// src/app/api/global-arbs/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import GlobalScanCache from '@/lib/models/GlobalScanCache';
import type { ArbOpportunity } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    // Get merged scan from all regions (max 10 min age per region)
    const mergedScan = await GlobalScanCache.getMergedScan(600);

    if (!mergedScan || mergedScan.opportunities.length === 0) {
      return NextResponse.json({
        hasCachedResults: false,
        message: 'No scan data available yet. Scanner starting soon...',
        opportunities: [],
        valueBets: [],
        regionAges: { AU: null, UK: null, US: null, EU: null },
      });
    }

    // Filter out expired opportunities
    const now = new Date();
    const validOpportunities = (mergedScan.opportunities as ArbOpportunity[]).filter(opp => {
      const commenceTime = new Date(opp.event.commenceTime);
      return commenceTime > now;
    });

    const validValueBets = (mergedScan.valueBets as { event: { commenceTime: Date } }[]).filter(vb => {
      const commenceTime = new Date(vb.event.commenceTime);
      return commenceTime > now;
    });

    // Calculate overall age (from most recent region)
    const ageSeconds = Math.round((now.getTime() - new Date(mergedScan.scannedAt).getTime()) / 1000);

    console.log(`[API /global-arbs] Returning ${validOpportunities.length} opportunities, region ages: AU=${mergedScan.regionAges.AU}s, UK=${mergedScan.regionAges.UK}s, US=${mergedScan.regionAges.US}s, EU=${mergedScan.regionAges.EU}s`);

    return NextResponse.json({
      hasCachedResults: true,
      opportunities: validOpportunities,
      valueBets: validValueBets,
      stats: mergedScan.stats,
      regionAges: mergedScan.regionAges,
      scannedAt: mergedScan.scannedAt.toISOString(),
      ageSeconds,
      remainingCredits: mergedScan.remainingCredits,
    });

  } catch (error) {
    console.error('[API /global-arbs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global arbs' },
      { status: 500 }
    );
  }
}