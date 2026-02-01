// src/app/api/global-arbs/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import GlobalScanCache from '@/lib/models/GlobalScanCache';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
};

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    await dbConnect();

    // Check subscription status
    const userId = (session.user as { id: string }).id;
    const user = await User.findById(userId).select('subscriptionStatus subscriptionEndsAt');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    // Check if user has active subscription
    const hasActiveSubscription =
      user.subscriptionStatus === 'active' &&
      user.subscriptionEndsAt !== undefined &&
      user.subscriptionEndsAt !== null &&
      new Date(user.subscriptionEndsAt) > new Date();

    if (!hasActiveSubscription) {
      return NextResponse.json(
        {
          error: 'Active subscription required',
          subscriptionRequired: true,
          message: 'Please subscribe to access the arbitrage scanner.',
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    // Get the global scan cache
    const cachedScan = await GlobalScanCache.getCurrentScan();

    if (!cachedScan || !cachedScan.scannedAt) {
      return NextResponse.json(
        {
          hasCachedResults: false,
          message: 'No scan results available yet. Please wait for the next scan.',
          opportunities: [],
          valueBets: [],
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // Filter out expired opportunities (events that have already started)
    const now = new Date();

    const opportunities = (cachedScan.opportunities || []) as Array<{
      event?: { commenceTime?: string | Date };
    }>;
    const valueBets = (cachedScan.valueBets || []) as Array<{
      event?: { commenceTime?: string | Date };
    }>;

    const validOpportunities = opportunities.filter((opp) => {
      if (!opp.event?.commenceTime) return false;
      const commenceTime = new Date(opp.event.commenceTime);
      return commenceTime > now;
    });

    const validValueBets = valueBets.filter((vb) => {
      if (!vb.event?.commenceTime) return false;
      const commenceTime = new Date(vb.event.commenceTime);
      return commenceTime > now;
    });

    // Calculate age
    const scannedAt = new Date(cachedScan.scannedAt);
    const ageSeconds = Math.floor((Date.now() - scannedAt.getTime()) / 1000);
    const ageMinutes = Math.floor(ageSeconds / 60);

    return NextResponse.json(
      {
        hasCachedResults: true,
        opportunities: validOpportunities,
        valueBets: validValueBets,
        stats: cachedScan.stats,
        regions: cachedScan.regions,
        scannedAt: scannedAt.toISOString(),
        ageSeconds,
        ageMinutes,
        remainingCredits: cachedScan.remainingCredits,
        scanDurationMs: cachedScan.scanDurationMs,
      },
      { headers: NO_STORE_HEADERS }
    );

  } catch (error) {
    console.error('[API /global-arbs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: String(error) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}