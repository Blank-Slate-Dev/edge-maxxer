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

    await dbConnect();

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
    });

  } catch (error) {
    console.error('[API /global-arbs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global arbs' },
      { status: 500 }
    );
  }
}