// src/app/api/cron/auto-scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User, { IUser, CREDIT_TIER_CONFIG, CreditTier } from '@/lib/models/User';
import GlobalScanCache from '@/lib/models/GlobalScanCache';
import { createOddsApiProvider } from '@/lib/providers/theOddsApiProvider';
import { detectAllOpportunities } from '@/lib/arb/detector';
import { detectLineOpportunities } from '@/lib/arb/lineDetector';
import { config, getApiRegionsForUserRegions, UserRegion } from '@/lib/config';
import { sendMultipleArbAlerts, ArbAlert } from '@/lib/sms';
import { calculateBookVsBookStakes } from '@/lib/arb/calculator';
import { buildFullEventUrls } from '@/lib/scraper/urlBuilder';
import type { BookVsBookArb, SpreadArb, TotalsArb, MiddleOpportunity, ValueBet } from '@/lib/types';

// Vercel cron jobs send a specific header to authenticate
const CRON_SECRET = process.env.CRON_SECRET;

// Master account email - this account's scans will populate GlobalScanCache
const MASTER_SCAN_USER_EMAIL = process.env.MASTER_SCAN_USER_EMAIL;

// Rotation config: How many AU-only scans between each other-region scan
const AU_ONLY_SCANS_BETWEEN_ROTATIONS = 3;

// Approximate credits per scan by region (includes H2H + lines markets)
const CREDITS_PER_SCAN: Record<string, number> = {
  AU: 170, // ~85 for H2H + ~85 for lines
  UK: 180,
  US: 240,
  EU: 200,
};

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Extended arb type with URLs
interface ArbWithUrls extends BookVsBookArb {
  bookmakerUrls?: Record<string, {
    eventUrl: string | null;
    competitionUrl: string | null;
    searchUrl: string | null;
  }>;
}

// Track scan count for rotation (resets on deploy, but that's fine)
let globalScanCounter = 0;

// Build a set of bookmaker KEYS for a region
function buildRegionBookmakerKeysSet(region: UserRegion): Set<string> {
  const keys = new Set<string>();
  config.bookmakersByRegion[region].forEach(k => {
    keys.add(k.toLowerCase());
  });
  return keys;
}

// Build a combined set of bookmaker KEYS for multiple regions
function buildMultiRegionBookmakerKeysSet(regions: UserRegion[]): Set<string> {
  const keys = new Set<string>();
  for (const region of regions) {
    config.bookmakersByRegion[region]?.forEach(k => {
      keys.add(k.toLowerCase());
    });
  }
  return keys;
}

// Check if all bookmaker KEYS in a list are from a region set
function allBookmakerKeysFromRegion(bookmakerKeys: string[], regionSet: Set<string>): boolean {
  return bookmakerKeys.every(key => regionSet.has(key.toLowerCase()));
}

// Extract bookmaker KEYS from H2H arb
function getBookmakerKeysFromArb(arb: ArbWithUrls): string[] {
  const keys = [arb.outcome1.bookmakerKey, arb.outcome2.bookmakerKey];
  if (arb.outcome3) {
    keys.push(arb.outcome3.bookmakerKey);
  }
  return keys;
}

// Extract bookmaker KEYS from spread arb
function getBookmakerKeysFromSpreadArb(arb: SpreadArb): string[] {
  return [arb.favorite.bookmakerKey, arb.underdog.bookmakerKey];
}

// Extract bookmaker KEYS from totals arb
function getBookmakerKeysFromTotalsArb(arb: TotalsArb): string[] {
  return [arb.over.bookmakerKey, arb.under.bookmakerKey];
}

// Extract bookmaker KEYS from middle
function getBookmakerKeysFromMiddle(middle: MiddleOpportunity): string[] {
  return [middle.side1.bookmakerKey, middle.side2.bookmakerKey];
}

// Filter results by region using bookmakerKey
function filterResultsByRegion(
  opportunities: ArbWithUrls[],
  valueBets: ValueBet[],
  spreadArbs: SpreadArb[],
  totalsArbs: TotalsArb[],
  middles: MiddleOpportunity[],
  region: UserRegion
): {
  opportunities: ArbWithUrls[];
  valueBets: ValueBet[];
  spreadArbs: SpreadArb[];
  totalsArbs: TotalsArb[];
  middles: MiddleOpportunity[];
} {
  const regionSet = buildRegionBookmakerKeysSet(region);

  return {
    opportunities: opportunities.filter(arb => 
      allBookmakerKeysFromRegion(getBookmakerKeysFromArb(arb), regionSet)
    ),
    valueBets: valueBets.filter(vb => 
      regionSet.has(vb.outcome.bookmakerKey.toLowerCase())
    ),
    spreadArbs: spreadArbs.filter(arb => 
      allBookmakerKeysFromRegion(getBookmakerKeysFromSpreadArb(arb), regionSet)
    ),
    totalsArbs: totalsArbs.filter(arb => 
      allBookmakerKeysFromRegion(getBookmakerKeysFromTotalsArb(arb), regionSet)
    ),
    middles: middles.filter(m => 
      allBookmakerKeysFromRegion(getBookmakerKeysFromMiddle(m), regionSet)
    ),
  };
}

// Filter opportunities by multiple regions (for SMS alerts)
function filterOpportunitiesByRegions(
  opportunities: ArbWithUrls[],
  regions: UserRegion[]
): ArbWithUrls[] {
  const regionSet = buildMultiRegionBookmakerKeysSet(regions);
  return opportunities.filter(arb => 
    allBookmakerKeysFromRegion(getBookmakerKeysFromArb(arb), regionSet)
  );
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');

    if (CRON_SECRET) {
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        console.log('[AutoScan] Unauthorized cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const isVercelCron = request.headers.get('x-vercel-cron') === '1';
      if (!isVercelCron && process.env.NODE_ENV === 'production') {
        console.log('[AutoScan] Missing cron authentication');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[AutoScan] Starting auto-scan cron job...');

    await dbConnect();

    // Determine which regions to scan this run
    const regionsToScan = getRegionsForThisScan();
    console.log(`[AutoScan] Regions for this scan: ${regionsToScan.join(', ')}`);

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
      globalCacheUpdated: false,
      regionsScanned: regionsToScan,
      regionResults: {} as Record<string, { h2h: number; spreads: number; totals: number; middles: number }>,
      errors: [] as string[],
    };

    for (const user of users) {
      results.processed++;

      try {
        const shouldScan = checkShouldScan(user, now);

        if (!shouldScan.scan) {
          console.log(`[AutoScan] Skipping user ${user.email}: ${shouldScan.reason}`);
          continue;
        }

        console.log(`[AutoScan] Scanning for user ${user.email}...`);

        // For master account, use rotation regions; for others, use their settings
        const isMasterAccount = MASTER_SCAN_USER_EMAIL && user.email === MASTER_SCAN_USER_EMAIL;
        const scanRegions = isMasterAccount ? regionsToScan : user.autoScan.regions;

        const estimatedCredits = calculateEstimatedCredits(scanRegions);

        await User.findByIdAndUpdate(user._id, {
          'autoScan.scanStartedAt': now,
        });

        const scanStartTime = Date.now();
        const scanResult = await runScanForUser(user, scanRegions);
        const scanDurationMs = Date.now() - scanStartTime;

        // Update user's scan stats
        await User.findByIdAndUpdate(user._id, {
          'autoScan.lastScanAt': now,
          'autoScan.scanStartedAt': null,
          'autoScan.lastScanCreditsRemaining': scanResult.remainingCredits,
          $inc: { 'autoScan.creditsUsedThisMonth': estimatedCredits },
          cachedScanResults: {
            opportunities: scanResult.opportunities,
            valueBets: scanResult.valueBets,
            stats: scanResult.stats,
            regions: scanRegions,
            scannedAt: now,
          },
        });

        results.scanned++;

        // If master account, update GlobalScanCache PER REGION
        if (isMasterAccount) {
          console.log(`[AutoScan] Updating per-region caches for regions: ${scanRegions.join(', ')}`);

          for (const region of scanRegions) {
            // Filter results to only include arbs where ALL bookmakers are from this region
            const regionFiltered = filterResultsByRegion(
              scanResult.opportunities,
              scanResult.valueBets as ValueBet[],
              scanResult.spreadArbs,
              scanResult.totalsArbs,
              scanResult.middles,
              region
            );

            // Calculate region-specific stats
            const regionStats = {
              ...scanResult.stats,
              arbsFound: regionFiltered.opportunities.filter(o => o.type === 'arb').length,
              nearArbsFound: regionFiltered.opportunities.filter(o => o.type === 'near-arb').length,
              valueBetsFound: regionFiltered.valueBets.length,
            };

            const regionLineStats = {
              totalEvents: scanResult.lineStats.totalEvents,
              spreadArbsFound: regionFiltered.spreadArbs.filter(s => s.type === 'arb').length,
              totalsArbsFound: regionFiltered.totalsArbs.filter(t => t.type === 'arb').length,
              middlesFound: regionFiltered.middles.length,
              nearArbsFound: regionFiltered.spreadArbs.filter(s => s.type === 'near-arb').length +
                            regionFiltered.totalsArbs.filter(t => t.type === 'near-arb').length,
            };

            await GlobalScanCache.updateScanForRegion(region, {
              opportunities: regionFiltered.opportunities,
              valueBets: regionFiltered.valueBets,
              spreadArbs: regionFiltered.spreadArbs,
              totalsArbs: regionFiltered.totalsArbs,
              middles: regionFiltered.middles,
              stats: regionStats,
              lineStats: regionLineStats,
              scannedAt: now,
              scanDurationMs,
              remainingCredits: scanResult.remainingCredits,
            });

            results.regionResults[region] = {
              h2h: regionFiltered.opportunities.length,
              spreads: regionFiltered.spreadArbs.length,
              totals: regionFiltered.totalsArbs.length,
              middles: regionFiltered.middles.length,
            };

            console.log(`[AutoScan] ${region} cache: ${regionFiltered.opportunities.length} H2H, ${regionFiltered.spreadArbs.length} spreads, ${regionFiltered.totalsArbs.length} totals, ${regionFiltered.middles.length} middles`);
          }

          results.globalCacheUpdated = true;
        }

        // Handle alerts - FILTERED BY USER'S ALERT REGIONS
        await handleAlertsForUser(user, scanResult, now, results);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[AutoScan] Error processing user ${user.email}:`, errorMsg);
        results.errors.push(`Error for ${user.email}: ${errorMsg}`);

        await User.findByIdAndUpdate(user._id, {
          'autoScan.scanStartedAt': null,
        });
      }
    }

    // Increment scan counter for next rotation
    globalScanCounter++;

    console.log(`[AutoScan] Completed. Processed: ${results.processed}, Scanned: ${results.scanned}, Regions: ${results.regionsScanned.join(',')}, GlobalCache: ${results.globalCacheUpdated}, Alerts: ${results.alertsSent}`);

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
 * Determine which regions to scan this run based on rotation
 * AU is always included, other regions rotate every N scans
 */
function getRegionsForThisScan(): UserRegion[] {
  const regions: UserRegion[] = ['AU']; // AU always included

  // Every (AU_ONLY_SCANS_BETWEEN_ROTATIONS + 1) scans, add another region
  const cycleLength = AU_ONLY_SCANS_BETWEEN_ROTATIONS + 1;

  if (globalScanCounter % cycleLength === 0) {
    // Time to add a rotating region
    const rotationOrder: UserRegion[] = ['UK', 'US', 'EU'];
    const rotationCycle = Math.floor(globalScanCounter / cycleLength);
    const regionIndex = rotationCycle % rotationOrder.length;
    regions.push(rotationOrder[regionIndex]);
  }

  return regions;
}

/**
 * Handle sending alerts for a user - FILTERS BY USER'S ALERT REGIONS
 */
async function handleAlertsForUser(
  user: IUser,
  scanResult: { opportunities: ArbWithUrls[]; valueBets: unknown[]; stats: unknown },
  now: Date,
  results: { alertsSent: number; errors: string[] }
) {
  const minProfit = user.autoScan.minProfitPercent || 4.0;
  const highValueThreshold = user.autoScan.highValueThreshold || 10.0;
  const enableHighValueReminders = user.autoScan.enableHighValueReminders !== false;
  
  // Get user's alert regions - use autoScan.regions if set, otherwise fall back to user.region
  const userAlertRegions = user.autoScan.regions && user.autoScan.regions.length > 0 
    ? user.autoScan.regions 
    : [user.region || 'AU'];

  // FILTER opportunities to only include those matching user's alert regions
  const filteredOpportunities = filterOpportunitiesByRegions(scanResult.opportunities, userAlertRegions);
  
  console.log(`[AutoScan] User ${user.email} alert regions: ${userAlertRegions.join(',')} - ${filteredOpportunities.length}/${scanResult.opportunities.length} arbs match`);

  const alertedArbs: Record<string, { alertedAt: Date; profitPercent: number }> =
    user.autoScan.alertedArbs instanceof Map
      ? Object.fromEntries(user.autoScan.alertedArbs)
      : (user.autoScan.alertedArbs || {});

  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const cleanedAlertedArbs: Record<string, { alertedAt: Date; profitPercent: number }> = {};
  for (const [arbId, alert] of Object.entries(alertedArbs)) {
    if (new Date(alert.alertedAt) > twentyFourHoursAgo) {
      cleanedAlertedArbs[arbId] = alert;
    }
  }

  const oppsToAlert: ArbWithUrls[] = [];
  const newAlertedArbs: Record<string, { alertedAt: Date; profitPercent: number }> = { ...cleanedAlertedArbs };

  // Use filtered opportunities instead of all opportunities
  for (const opp of filteredOpportunities) {
    if (opp.type !== 'arb' || opp.profitPercentage < minProfit) continue;

    const arbId = generateArbId(opp);
    const wasAlerted = cleanedAlertedArbs[arbId];
    const isHighValue = opp.profitPercentage >= highValueThreshold;

    let shouldAlert = false;

    if (isHighValue && enableHighValueReminders) {
      shouldAlert = true;
    } else if (!wasAlerted) {
      shouldAlert = true;
    }

    if (shouldAlert) {
      oppsToAlert.push(opp);
      newAlertedArbs[arbId] = { alertedAt: now, profitPercent: opp.profitPercentage };
    }
  }

  if (oppsToAlert.length > 0) {
    const canAlert = checkCanSendAlert(user, now);

    if (canAlert) {
      oppsToAlert.sort((a, b) => b.profitPercentage - a.profitPercentage);
      const topOpps = oppsToAlert.slice(0, 5);

      const alerts: ArbAlert[] = topOpps.map(opp => {
        const stakes = calculateBookVsBookStakes(opp, 100);
        const isReminder = opp.profitPercentage >= highValueThreshold;

        const bets: ArbAlert['bets'] = [
          {
            outcome: opp.outcome1.name,
            bookmaker: config.bookmakerNames[opp.outcome1.bookmakerKey] || opp.outcome1.bookmaker,
            odds: opp.outcome1.odds,
            stake: stakes.stake1,
          },
          {
            outcome: opp.outcome2.name,
            bookmaker: config.bookmakerNames[opp.outcome2.bookmakerKey] || opp.outcome2.bookmaker,
            odds: opp.outcome2.odds,
            stake: stakes.stake2,
          },
        ];

        if (opp.outcome3 && stakes.stake3) {
          bets.push({
            outcome: opp.outcome3.name,
            bookmaker: config.bookmakerNames[opp.outcome3.bookmakerKey] || opp.outcome3.bookmaker,
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

      const smsResult = await sendMultipleArbAlerts(user.phoneNumber!, alerts);

      if (smsResult.success) {
        results.alertsSent++;
        await User.findByIdAndUpdate(user._id, {
          'autoScan.lastAlertAt': now,
          'autoScan.alertedArbs': newAlertedArbs,
        });
        console.log(`[AutoScan] Sent ${alerts.length} alerts to ${user.email} for regions: ${userAlertRegions.join(',')}`);
      } else {
        results.errors.push(`SMS failed for ${user.email}: ${smsResult.error}`);
      }
    } else {
      await User.findByIdAndUpdate(user._id, {
        'autoScan.alertedArbs': newAlertedArbs,
      });
    }
  } else {
    await User.findByIdAndUpdate(user._id, {
      'autoScan.alertedArbs': cleanedAlertedArbs,
    });
  }
}

/**
 * Check if user should be scanned
 */
function checkShouldScan(user: IUser, now: Date): { scan: boolean; reason: string } {
  if (!user.autoScan?.enabled) {
    return { scan: false, reason: 'Auto-scan not enabled' };
  }

  if (!user.oddsApiKey) {
    return { scan: false, reason: 'No API key' };
  }

  if (!user.phoneNumber) {
    return { scan: false, reason: 'No phone number' };
  }

  if (user.subscriptionStatus !== 'active' || !user.subscriptionEndsAt || user.subscriptionEndsAt < now) {
    return { scan: false, reason: 'No active subscription' };
  }

  const creditTier = user.autoScan.creditTier as CreditTier;
  const tierConfig = CREDIT_TIER_CONFIG[creditTier];

  if (user.autoScan.lastScanAt) {
    const secondsSinceLastScan = (now.getTime() - user.autoScan.lastScanAt.getTime()) / 1000;
    if (secondsSinceLastScan < tierConfig.scanIntervalSeconds) {
      return {
        scan: false,
        reason: `Scan interval not reached (${Math.round(secondsSinceLastScan)}s / ${tierConfig.scanIntervalSeconds}s)`,
      };
    }
  }

  const estimatedCredits = calculateEstimatedCredits(user.autoScan.regions);
  const currentCredits = user.autoScan.creditsUsedThisMonth || 0;

  if (currentCredits + estimatedCredits > tierConfig.credits) {
    return { scan: false, reason: 'Monthly credit limit reached' };
  }

  return { scan: true, reason: 'OK' };
}

function checkCanSendAlert(user: IUser, now: Date): boolean {
  if (!user.autoScan?.lastAlertAt) {
    return true;
  }

  const cooldownMs = (user.autoScan.alertCooldownMinutes || 5) * 60 * 1000;
  const timeSinceLastAlert = now.getTime() - user.autoScan.lastAlertAt.getTime();

  return timeSinceLastAlert >= cooldownMs;
}

function generateArbId(opp: BookVsBookArb): string {
  const eventId = opp.event.id;
  const bk1 = opp.outcome1.bookmakerKey;
  const bk2 = opp.outcome2.bookmakerKey;
  const odds1 = Math.round(opp.outcome1.odds * 100);
  const odds2 = Math.round(opp.outcome2.odds * 100);

  if (opp.outcome3) {
    const bk3 = opp.outcome3.bookmakerKey;
    const odds3 = Math.round(opp.outcome3.odds * 100);
    return `${eventId}-${bk1}-${bk2}-${bk3}-${odds1}-${odds2}-${odds3}`;
  }

  return `${eventId}-${bk1}-${bk2}-${odds1}-${odds2}`;
}

function calculateEstimatedCredits(regions: UserRegion[]): number {
  let total = 0;
  for (const region of regions) {
    total += CREDITS_PER_SCAN[region] || 170;
  }
  return total;
}

function addUrlsToArbs(arbs: BookVsBookArb[]): ArbWithUrls[] {
  return arbs.map(arb => {
    const bookmakers = [arb.outcome1.bookmakerKey, arb.outcome2.bookmakerKey];
    if (arb.outcome3) {
      bookmakers.push(arb.outcome3.bookmakerKey);
    }

    const bookmakerUrls = buildFullEventUrls(
      arb.event.sportKey,
      arb.event.homeTeam,
      arb.event.awayTeam,
      bookmakers
    );

    return { ...arb, bookmakerUrls };
  });
}

async function runScanForUser(user: IUser, regions: UserRegion[]): Promise<{
  opportunities: ArbWithUrls[];
  valueBets: unknown[];
  spreadArbs: SpreadArb[];
  totalsArbs: TotalsArb[];
  middles: MiddleOpportunity[];
  stats: {
    totalEvents: number;
    eventsWithMultipleBookmakers: number;
    totalBookmakers: number;
    arbsFound: number;
    nearArbsFound: number;
    valueBetsFound: number;
    sportsScanned: number;
  };
  lineStats: {
    totalEvents: number;
    spreadArbsFound: number;
    totalsArbsFound: number;
    middlesFound: number;
    nearArbsFound: number;
  };
  remainingCredits?: number;
}> {
  const provider = createOddsApiProvider(user.oddsApiKey!);
  const regionsStr = getApiRegionsForUserRegions(regions);

  const allSports = await provider.getSupportedSports();
  const allSportsKeys = allSports.filter(s => !s.hasOutrights).map(s => s.key);

  // =====================
  // 1. FETCH H2H MARKETS
  // =====================
  const h2hResult = await provider.fetchOdds(allSportsKeys, ['h2h'], regionsStr);

  const { arbs, valueBets, stats } = detectAllOpportunities(
    h2hResult.events,
    config.filters.nearArbThreshold,
    config.filters.valueThreshold
  );

  // =====================
  // 2. FETCH LINES MARKETS (spreads/totals)
  // =====================
  // Filter to sports that typically have spreads/totals
  const lineSportsKeys = allSports
    .filter(s => !s.hasOutrights)
    .filter(s => {
      const key = s.key.toLowerCase();
      return key.includes('basketball') ||
             key.includes('football') ||
             key.includes('baseball') ||
             key.includes('hockey') ||
             key.includes('aussierules') ||
             key.includes('rugby');
    })
    .map(s => s.key);

  let spreadArbs: SpreadArb[] = [];
  let totalsArbs: TotalsArb[] = [];
  let middles: MiddleOpportunity[] = [];
  let lineStats = {
    totalEvents: 0,
    spreadArbsFound: 0,
    totalsArbsFound: 0,
    middlesFound: 0,
    nearArbsFound: 0,
  };

  if (lineSportsKeys.length > 0) {
    const linesResult = await provider.fetchOdds(lineSportsKeys, ['spreads', 'totals'], regionsStr);

    const lineOpportunities = detectLineOpportunities(
      linesResult.events,
      config.filters.nearArbThreshold
    );

    spreadArbs = lineOpportunities.spreadArbs;
    totalsArbs = lineOpportunities.totalsArbs;
    middles = lineOpportunities.middles;
    lineStats = lineOpportunities.stats;

    console.log(`[AutoScan] Lines detection complete:`, lineStats);
  }

  // =====================
  // 3. FILTER BY TIME
  // =====================
  const now = new Date();
  const maxTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const filterByTime = <T extends { event: { commenceTime: Date } }>(items: T[]): T[] => {
    return items.filter(item => {
      const commence = new Date(item.event.commenceTime);
      return commence > now && commence < maxTime;
    });
  };

  const validArbs = filterByTime(arbs);
  const validValueBets = filterByTime(valueBets);
  const validSpreadArbs = filterByTime(spreadArbs);
  const validTotalsArbs = filterByTime(totalsArbs);
  const validMiddles = filterByTime(middles);

  const arbsWithUrls = addUrlsToArbs(validArbs);

  console.log(`[AutoScan] Found ${arbsWithUrls.length} H2H arbs, ${validSpreadArbs.length} spread arbs, ${validTotalsArbs.length} totals arbs, ${validMiddles.length} middles for regions: ${regions.join(', ')}`);

  // Get remaining credits from the last API call
  const remainingCredits = (h2hResult as { remainingRequests?: number }).remainingRequests;

  return {
    opportunities: arbsWithUrls,
    valueBets: validValueBets,
    spreadArbs: validSpreadArbs,
    totalsArbs: validTotalsArbs,
    middles: validMiddles,
    stats,
    lineStats,
    remainingCredits,
  };
}
