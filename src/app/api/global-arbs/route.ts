// src/app/api/global-arbs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
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
    // PERFORMANCE FIX: Use the session's cached hasAccess flag instead of
    // doing a separate User.findById() on every request.
    //
    // The JWT callback in auth.ts already fetches subscription data from the
    // DB and caches it in the token (refreshed every 15 minutes or on manual
    // trigger after checkout). The session callback then computes hasAccess
    // from that cached data. This eliminates a redundant DB round-trip on
    // every 5-second poll from the dashboard.
    //
    // Previously: getServerSession (JWT callback) + User.findById (2nd DB call)
    // Now:        getServerSession (JWT callback, usually cached) + no extra call
    // =========================================================================
    const hasAccess = (session.user as { hasAccess?: boolean }).hasAccess ?? false;
    
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

    await dbConnect();

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

    console.log(`[API /global-arbs] ${region}: ${validOpportunities.length} H2H, ${validSpreadArbs.length} spreads, ${validTotalsArbs.length} totals, ${validMiddles.length} middles (${ageSeconds}s old)`);

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
