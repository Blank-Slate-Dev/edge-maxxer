// src/app/api/global-arbs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import GlobalScanCache from '@/lib/models/GlobalScanCache';
import type { ArbOpportunity, SpreadArb, TotalsArb, MiddleOpportunity } from '@/lib/types';
import type { UserRegion } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', subscriptionRequired: true },
        { status: 401 }
      );
    }

    // =========================================================================
    // ACCESS CHECK — with DB fallback for stale JWT sessions
    //
    // The JWT token caches subscription data and refreshes every 15 minutes.
    // After a user subscribes via Stripe, there's a window where the JWT still
    // thinks hasAccess=false even though the DB has been updated by the webhook.
    // To handle this, if the session says no access, we do a quick DB check
    // as a fallback before blocking the user.
    // =========================================================================
    let hasAccess = (session.user as { hasAccess?: boolean }).hasAccess ?? false;
    let dbFallbackUsed = false;

    if (!hasAccess) {
      // Session says no access — but the JWT might be stale.
      // Quick DB check to see if the user actually has an active subscription.
      try {
        await dbConnect();
        const dbUser = await User.findOne({ email: session.user.email })
          .select('subscriptionStatus subscriptionEndsAt freeTrialStartedAt')
          .lean();

        if (dbUser) {
          const hasActiveSubscription =
            dbUser.subscriptionStatus === 'active' &&
            dbUser.subscriptionEndsAt &&
            new Date(dbUser.subscriptionEndsAt) > new Date();

          if (hasActiveSubscription) {
            hasAccess = true;
            dbFallbackUsed = true;
            console.log(`[API /global-arbs] DB fallback granted access for ${session.user.email} (stale JWT)`);
          }
        }
      } catch (dbError) {
        console.error('[API /global-arbs] DB fallback check failed:', dbError);
        // If DB check fails, we still deny based on session — better safe than broken
      }
    }

    if (!hasAccess) {
      // Determine if the user had a free trial that expired (vs never had one)
      const freeTrialStartedAt = (session.user as { freeTrialStartedAt?: string }).freeTrialStartedAt;
      const trialExpired = !!freeTrialStartedAt;
      
      return NextResponse.json({
        hasCachedResults: false,
        subscriptionRequired: true,
        trialExpired,
        message: trialExpired 
          ? 'Your free trial has ended. Subscribe to continue accessing arbitrage data.'
          : 'Active subscription required to access arbitrage data',
        region: 'AU',
        opportunities: [],
        valueBets: [],
        spreadArbs: [],
        totalsArbs: [],
        middles: [],
      });
    }

    // Get requested region from query params (default to AU)
    const { searchParams } = new URL(request.url);
    const region = (searchParams.get('region') || 'AU') as UserRegion;

    // Validate region
    const validRegions: UserRegion[] = ['AU', 'UK', 'US', 'EU'];
    if (!validRegions.includes(region)) {
      return NextResponse.json(
        { error: 'Invalid region' },
        { status: 400 }
      );
    }

    // Only connect to DB if we haven't already (fallback may have connected)
    if (!dbFallbackUsed) {
      await dbConnect();
    }

    // Get cached scan for the specific region
    const cachedScan = await GlobalScanCache.getScanForRegion(region);

    if (!cachedScan || !cachedScan.opportunities) {
      return NextResponse.json({
        hasCachedResults: false,
        message: `No scan data available for ${region} yet. Scanner starting soon...`,
        region,
        opportunities: [],
        valueBets: [],
        spreadArbs: [],
        totalsArbs: [],
        middles: [],
      });
    }

    // Filter out expired opportunities
    const now = new Date();
    
    const filterByTime = <T extends { event: { commenceTime: Date | string } }>(items: T[]): T[] => {
      return items.filter(item => {
        const commenceTime = new Date(item.event.commenceTime);
        return commenceTime > now;
      });
    };

    const validOpportunities = filterByTime(cachedScan.opportunities as ArbOpportunity[]);
    const validValueBets = filterByTime(cachedScan.valueBets as { event: { commenceTime: Date } }[]);
    const validSpreadArbs = filterByTime((cachedScan.spreadArbs || []) as SpreadArb[]);
    const validTotalsArbs = filterByTime((cachedScan.totalsArbs || []) as TotalsArb[]);
    const validMiddles = filterByTime((cachedScan.middles || []) as MiddleOpportunity[]);

    // Calculate age
    const ageSeconds = Math.round((now.getTime() - new Date(cachedScan.scannedAt).getTime()) / 1000);

    // Include free trial end time so dashboard can show countdown
    const freeTrialEndsAt = (session.user as { freeTrialEndsAt?: string }).freeTrialEndsAt;

    console.log(`[API /global-arbs] ${region}: ${validOpportunities.length} H2H, ${validSpreadArbs.length} spreads, ${validTotalsArbs.length} totals, ${validMiddles.length} middles (${ageSeconds}s old)${dbFallbackUsed ? ' [DB-fallback]' : ''}`);

    return NextResponse.json({
      hasCachedResults: true,
      region,
      opportunities: validOpportunities,
      valueBets: validValueBets,
      spreadArbs: validSpreadArbs,
      totalsArbs: validTotalsArbs,
      middles: validMiddles,
      stats: cachedScan.stats,
      lineStats: cachedScan.lineStats,
      scannedAt: cachedScan.scannedAt,
      ageSeconds,
      remainingCredits: cachedScan.remainingCredits,
      ...(freeTrialEndsAt ? { freeTrialEndsAt } : {}),
    });

  } catch (error) {
    console.error('[API /global-arbs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global arbs' },
      { status: 500 }
    );
  }
}
