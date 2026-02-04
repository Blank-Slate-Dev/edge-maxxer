// src/app/api/scan-progress/route.ts
// Lightweight endpoint for real-time scan progress.
// The dashboard polls this every 2s during active scans to get
// arbs as they're found, sport-by-sport.
//
// Query params:
//   region  - AU|UK|US|EU (required)
//   since   - ISO timestamp, returns batches after this time (required)
//
// Returns: { batches: IScanProgressBatch[], serverTime: string }

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import GlobalScanProgress from '@/lib/models/GlobalScanProgress';
import User from '@/lib/models/User';
import type { UserRegion } from '@/lib/config';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
};

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    await dbConnect();

    // Quick subscription check
    const user = await User.findById((session.user as { id: string }).id).select(
      'plan subscriptionStatus subscriptionEndsAt'
    );
    if (!user || !user.hasAccess()) {
      return NextResponse.json(
        { error: 'Subscription required' },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const region = (searchParams.get('region') || 'AU') as UserRegion;
    const sinceParam = searchParams.get('since');

    const validRegions: UserRegion[] = ['AU', 'UK', 'US', 'EU'];
    if (!validRegions.includes(region)) {
      return NextResponse.json(
        { error: 'Invalid region' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (!sinceParam) {
      return NextResponse.json(
        { error: 'Missing "since" parameter' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const since = new Date(sinceParam);
    if (isNaN(since.getTime())) {
      return NextResponse.json(
        { error: 'Invalid "since" timestamp' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Fetch new batches since the given timestamp
    const batches = await GlobalScanProgress.getProgressSince(region, since);

    return NextResponse.json(
      {
        batches,
        count: batches.length,
        serverTime: new Date().toISOString(),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error('[API /scan-progress] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan progress' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
