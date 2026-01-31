// src/app/api/cron/auto-scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User, { IUser, CREDIT_TIER_CONFIG, CreditTier } from '@/lib/models/User';
import { createOddsApiProvider } from '@/lib/providers/theOddsApiProvider';
import { detectAllOpportunities } from '@/lib/arb/detector';
import { config, getApiRegionsForUserRegions, UserRegion } from '@/lib/config';
import { sendMultipleArbAlerts, ArbAlert } from '@/lib/sms';
import { calculateBookVsBookStakes } from '@/lib/arb/calculator';
import { buildFullEventUrls } from '@/lib/scraper/urlBuilder';
import type { BookVsBookArb } from '@/lib/types';

// Vercel cron jobs send a specific header to authenticate
const CRON_SECRET = process.env.CRON_SECRET;

// Approximate credits per scan (varies by region)
const CREDITS_PER_SCAN: Record<string, number> = {
  AU: 85,
  UK: 90,
  US: 120,
  EU: 100,
};

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for cron job

// Extended arb type with URLs
interface ArbWithUrls extends BookVsBookArb {
  bookmakerUrls?: Record<string, { 
    eventUrl: string | null; 
    competitionUrl: string | null; 
    searchUrl: string | null;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');
    
    // Check for Vercel cron secret or custom secret
    if (CRON_SECRET) {
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        console.log('[AutoScan] Unauthorized cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      // In development, allow without auth
      const isVercelCron = request.headers.get('x-vercel-cron') === '1';
      if (!isVercelCron && process.env.NODE_ENV === 'production') {
        console.log('[AutoScan] Missing cron authentication');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[AutoScan] Starting auto-scan cron job...');
    
    await dbConnect();
    
    // Find all users with auto-scan enabled
    const now = new Date();
    const users = await User.find({
      'autoScan.enabled': true,
      oddsApiKey: { $exists: true, $ne: '' },
      phoneNumber: { $exists: true, $ne: '' },
      subscriptionStatus: 'active',
      subscriptionEndsAt: { $gt: now },
    });

    console.log(`[AutoScan] Found ${users.length} users with auto-scan enabled`);

    const results = {
      processed: 0,
      scanned: 0,
      alertsSent: 0,
      errors: [] as string[],
    };

    // Process each user
    for (const user of users) {
      results.processed++;
      
      try {
        const shouldScan = checkShouldScan(user, now);
        
        if (!shouldScan.scan) {
          console.log(`[AutoScan] Skipping user ${user.email}: ${shouldScan.reason}`);
          continue;
        }

        console.log(`[AutoScan] Scanning for user ${user.email}...`);
        
        // Calculate estimated credits for this scan
        const estimatedCredits = calculateEstimatedCredits(user.autoScan.regions);
        
        // Mark scan as started (for real-time UI updates)
        await User.findByIdAndUpdate(user._id, {
          'autoScan.scanStartedAt': now,
        });
        
        // Run the scan
        const scanResult = await runScanForUser(user);
        
        // Update user's scan stats AND cache the results
        await User.findByIdAndUpdate(user._id, {
          'autoScan.lastScanAt': now,
          'autoScan.scanStartedAt': null, // Clear scanning flag
          'autoScan.lastScanCreditsRemaining': scanResult.remainingCredits,
          $inc: { 'autoScan.creditsUsedThisMonth': estimatedCredits },
          // Cache all scan results for dashboard
          cachedScanResults: {
            opportunities: scanResult.opportunities,
            valueBets: scanResult.valueBets,
            stats: scanResult.stats,
            regions: user.autoScan.regions,
            scannedAt: now,
          },
        });
        
        results.scanned++;

        // Get user's alert settings
        const minProfit = user.autoScan.minProfitPercent || 4.0;
        const highValueThreshold = user.autoScan.highValueThreshold || 10.0;
        const enableHighValueReminders = user.autoScan.enableHighValueReminders !== false;
        
        // Get existing alerted arbs (convert Map to object if needed)
        const alertedArbs: Record<string, { alertedAt: Date; profitPercent: number }> = 
          user.autoScan.alertedArbs instanceof Map 
            ? Object.fromEntries(user.autoScan.alertedArbs)
            : (user.autoScan.alertedArbs || {});
        
        // Clean up old alerts (older than 24 hours)
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const cleanedAlertedArbs: Record<string, { alertedAt: Date; profitPercent: number }> = {};
        for (const [arbId, alert] of Object.entries(alertedArbs)) {
          if (new Date(alert.alertedAt) > twentyFourHoursAgo) {
            cleanedAlertedArbs[arbId] = alert;
          }
        }

        // Filter opportunities that meet alert criteria
        const oppsToAlert: ArbWithUrls[] = [];
        const newAlertedArbs: Record<string, { alertedAt: Date; profitPercent: number }> = { ...cleanedAlertedArbs };
        
        for (const opp of scanResult.opportunities) {
          // Skip non-arbs and below minimum threshold
          if (opp.type !== 'arb' || opp.profitPercentage < minProfit) continue;
          
          // Generate unique arb ID
          const arbId = generateArbId(opp);
          const wasAlerted = cleanedAlertedArbs[arbId];
          const isHighValue = opp.profitPercentage >= highValueThreshold;
          
          // Determine if we should alert
          let shouldAlert = false;
          
          if (isHighValue && enableHighValueReminders) {
            // High-value arbs: always alert (reminder)
            shouldAlert = true;
            console.log(`[AutoScan] High-value arb (${opp.profitPercentage.toFixed(2)}%) - sending reminder`);
          } else if (!wasAlerted) {
            // Normal arbs: only alert if not already alerted
            shouldAlert = true;
            console.log(`[AutoScan] New arb (${opp.profitPercentage.toFixed(2)}%) - first alert`);
          } else {
            console.log(`[AutoScan] Skipping already-alerted arb (${opp.profitPercentage.toFixed(2)}%)`);
          }
          
          if (shouldAlert) {
            oppsToAlert.push(opp);
            // Mark as alerted
            newAlertedArbs[arbId] = { alertedAt: now, profitPercent: opp.profitPercentage };
          }
        }

        if (oppsToAlert.length > 0) {
          // Check alert cooldown
          const canAlert = checkCanSendAlert(user, now);
          
          if (canAlert) {
            // Sort by profit (highest first) and take top 5
            oppsToAlert.sort((a, b) => b.profitPercentage - a.profitPercentage);
            const topOpps = oppsToAlert.slice(0, 5);
            
            console.log(`[AutoScan] Alerting ${topOpps.length} opportunities for ${user.email}`);
            
            // Format opportunities for SMS
            const alerts: ArbAlert[] = topOpps.map(opp => {
              // Calculate stakes for a $100 total stake
              const stakes = calculateBookVsBookStakes(opp, 100);
              
              // Check if this is a reminder (high-value)
              const isReminder = opp.profitPercentage >= highValueThreshold;
              
              // Build bets array from outcomes
              const bets: ArbAlert['bets'] = [
                {
                  outcome: opp.outcome1.name,
                  bookmaker: config.bookmakerNames[opp.outcome1.bookmaker] || opp.outcome1.bookmaker,
                  odds: opp.outcome1.odds,
                  stake: stakes.stake1,
                },
                {
                  outcome: opp.outcome2.name,
                  bookmaker: config.bookmakerNames[opp.outcome2.bookmaker] || opp.outcome2.bookmaker,
                  odds: opp.outcome2.odds,
                  stake: stakes.stake2,
                },
              ];
              
              // Add third outcome if it exists (3-way markets like soccer)
              if (opp.outcome3 && stakes.stake3) {
                bets.push({
                  outcome: opp.outcome3.name,
                  bookmaker: config.bookmakerNames[opp.outcome3.bookmaker] || opp.outcome3.bookmaker,
                  odds: opp.outcome3.odds,
                  stake: stakes.stake3,
                });
              }
              
              return {
                eventName: `${opp.event.homeTeam} vs ${opp.event.awayTeam}`,
                sport: opp.event.sportKey,
                profitPercent: opp.profitPercentage,
                stake: 100,
                bets,
                commenceTime: new Date(opp.event.commenceTime),
                isReminder,
              };
            });

            // Send SMS alert
            const smsResult = await sendMultipleArbAlerts(user.phoneNumber!, alerts);
            
            if (smsResult.success) {
              results.alertsSent++;
              
              // Update last alert time and alerted arbs
              await User.findByIdAndUpdate(user._id, {
                'autoScan.lastAlertAt': now,
                'autoScan.alertedArbs': newAlertedArbs,
              });
              
              console.log(`[AutoScan] Alert sent to ${user.email}`);
            } else {
              console.error(`[AutoScan] Failed to send alert to ${user.email}: ${smsResult.error}`);
              results.errors.push(`SMS failed for ${user.email}: ${smsResult.error}`);
            }
          } else {
            console.log(`[AutoScan] Alert cooldown active for ${user.email}`);
            // Still update alerted arbs tracking even if cooldown is active
            await User.findByIdAndUpdate(user._id, {
              'autoScan.alertedArbs': newAlertedArbs,
            });
          }
        } else {
          console.log(`[AutoScan] No new opportunities for ${user.email} (min: ${minProfit}%, high: ${highValueThreshold}%)`);
          // Update cleaned alerted arbs
          await User.findByIdAndUpdate(user._id, {
            'autoScan.alertedArbs': cleanedAlertedArbs,
          });
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[AutoScan] Error processing user ${user.email}:`, errorMsg);
        results.errors.push(`Error for ${user.email}: ${errorMsg}`);
        
        // Clear scanning flag on error
        await User.findByIdAndUpdate(user._id, {
          'autoScan.scanStartedAt': null,
        });
      }
    }

    console.log(`[AutoScan] Completed. Processed: ${results.processed}, Scanned: ${results.scanned}, Alerts: ${results.alertsSent}`);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString(),
    });
    
  } catch (error) {
    console.error('[AutoScan] Cron job error:', error);
    return NextResponse.json(
      { error: 'Auto-scan cron failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Check if user should be scanned based on their tier and last scan time
 */
function checkShouldScan(user: IUser, now: Date): { scan: boolean; reason: string } {
  // Check if auto-scan is enabled
  if (!user.autoScan?.enabled) {
    return { scan: false, reason: 'Auto-scan not enabled' };
  }
  
  // Check API key
  if (!user.oddsApiKey) {
    return { scan: false, reason: 'No API key' };
  }
  
  // Check phone number
  if (!user.phoneNumber) {
    return { scan: false, reason: 'No phone number' };
  }
  
  // Check subscription
  if (user.subscriptionStatus !== 'active' || !user.subscriptionEndsAt || user.subscriptionEndsAt < now) {
    return { scan: false, reason: 'No active subscription' };
  }
  
  // Check credits reset (monthly)
  if (user.autoScan.creditsResetAt && user.autoScan.creditsResetAt <= now) {
    // Credits should be reset - will happen after this check
    // For now, allow the scan
  }
  
  // Check scan interval based on tier
  const creditTier = user.autoScan.creditTier as CreditTier;
  const tierConfig = CREDIT_TIER_CONFIG[creditTier];
  
  if (user.autoScan.lastScanAt) {
    const secondsSinceLastScan = (now.getTime() - user.autoScan.lastScanAt.getTime()) / 1000;
    if (secondsSinceLastScan < tierConfig.scanIntervalSeconds) {
      return { 
        scan: false, 
        reason: `Scan interval not reached (${Math.round(secondsSinceLastScan)}s / ${tierConfig.scanIntervalSeconds}s)` 
      };
    }
  }
  
  // Check if user has credits remaining this month
  const estimatedCredits = calculateEstimatedCredits(user.autoScan.regions);
  const currentCredits = user.autoScan.creditsUsedThisMonth || 0;
  
  if (currentCredits + estimatedCredits > tierConfig.credits) {
    return { scan: false, reason: 'Monthly credit limit reached' };
  }
  
  return { scan: true, reason: 'OK' };
}

/**
 * Check if alert can be sent (cooldown check)
 */
function checkCanSendAlert(user: IUser, now: Date): boolean {
  if (!user.autoScan?.lastAlertAt) {
    return true;
  }
  
  const cooldownMs = (user.autoScan.alertCooldownMinutes || 5) * 60 * 1000;
  const timeSinceLastAlert = now.getTime() - user.autoScan.lastAlertAt.getTime();
  
  return timeSinceLastAlert >= cooldownMs;
}

/**
 * Generate a unique ID for an arb opportunity
 * Used to track which arbs have been alerted to avoid spam
 */
function generateArbId(opp: BookVsBookArb): string {
  // Create a unique ID from event + bookmakers + approximate odds
  const eventId = opp.event.id;
  const bk1 = opp.outcome1.bookmaker;
  const bk2 = opp.outcome2.bookmaker;
  const odds1 = Math.round(opp.outcome1.odds * 100); // Round to avoid floating point issues
  const odds2 = Math.round(opp.outcome2.odds * 100);
  
  // Include outcome3 if present (3-way markets)
  if (opp.outcome3) {
    const bk3 = opp.outcome3.bookmaker;
    const odds3 = Math.round(opp.outcome3.odds * 100);
    return `${eventId}-${bk1}-${bk2}-${bk3}-${odds1}-${odds2}-${odds3}`;
  }
  
  return `${eventId}-${bk1}-${bk2}-${odds1}-${odds2}`;
}

/**
 * Calculate estimated credits for a scan based on regions
 */
function calculateEstimatedCredits(regions: UserRegion[]): number {
  let total = 0;
  for (const region of regions) {
    total += CREDITS_PER_SCAN[region] || 85;
  }
  return total;
}

/**
 * Add bookmaker URLs to arb opportunities
 */
function addUrlsToArbs(arbs: BookVsBookArb[]): ArbWithUrls[] {
  return arbs.map(arb => {
    // Get all bookmakers involved in this arb
    const bookmakers = [arb.outcome1.bookmaker, arb.outcome2.bookmaker];
    if (arb.outcome3) {
      bookmakers.push(arb.outcome3.bookmaker);
    }
    
    // Build URLs for each bookmaker (includes eventUrl, competitionUrl, searchUrl)
    const bookmakerUrls = buildFullEventUrls(
      arb.event.sportKey,
      arb.event.homeTeam,
      arb.event.awayTeam,
      bookmakers
    );
    
    return {
      ...arb,
      bookmakerUrls,
    };
  });
}

/**
 * Run arbitrage scan for a specific user
 */
async function runScanForUser(user: IUser): Promise<{
  opportunities: ArbWithUrls[];
  valueBets: unknown[];
  stats: {
    totalEvents: number;
    eventsWithMultipleBookmakers: number;
    totalBookmakers: number;
    arbsFound: number;
    nearArbsFound: number;
    valueBetsFound: number;
    sportsScanned: number;
  };
  remainingCredits?: number;
}> {
  const provider = createOddsApiProvider(user.oddsApiKey!);
  
  // Get API regions string from user's selected regions
  const regionsStr = getApiRegionsForUserRegions(user.autoScan.regions);
  
  // Fetch available sports
  const allSports = await provider.getSupportedSports();
  const sportsToFetch = allSports
    .filter(s => !s.hasOutrights)
    .map(s => s.key);
  
  // Fetch odds - h2h, spreads, and totals markets
  const oddsResult = await provider.fetchOdds(sportsToFetch, ['h2h', 'spreads', 'totals'], regionsStr);
  
  // Detect opportunities
  const { arbs, valueBets, stats } = detectAllOpportunities(
    oddsResult.events,
    config.filters.nearArbThreshold,
    config.filters.valueThreshold
  );
  
  // Filter to only actual arbs (not near-arbs or value bets)
  const now = new Date();
  const maxTime = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
  
  const validArbs = arbs.filter(opp => {
    if (opp.event.commenceTime > maxTime) return false;
    if (opp.event.commenceTime < now) return false;
    return true;
  });
  
  const validValueBets = valueBets.filter(vb => {
    if (vb.event.commenceTime > maxTime) return false;
    if (vb.event.commenceTime < now) return false;
    return true;
  });
  
  // Add URLs to arbs (lightweight - no scraping)
  const arbsWithUrls = addUrlsToArbs(validArbs);
  
  console.log(`[AutoScan] Added URLs to ${arbsWithUrls.length} arbs`);
  
  return {
    opportunities: arbsWithUrls,
    valueBets: validValueBets,
    stats,
    // Try to get remaining credits if available on the result
    remainingCredits: (oddsResult as { remainingRequests?: number }).remainingRequests,
  };
}