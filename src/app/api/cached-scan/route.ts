// src/app/api/cached-scan/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

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
    const userId = (session.user as { id: string }).id;
    const user = await User.findById(userId).select('cachedScanResults autoScan');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    // Check if user has cached results
    if (!user.cachedScanResults || !user.cachedScanResults.scannedAt) {
      return NextResponse.json(
        { 
          hasCachedResults: false,
          message: 'No cached scan results available',
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // Check how old the cached results are
    const scannedAt = new Date(user.cachedScanResults.scannedAt);
    const ageMinutes = Math.floor((Date.now() - scannedAt.getTime()) / (1000 * 60));
    
    // Filter out expired opportunities (events that have already started)
    const now = new Date();
    
    // Cast to any to handle unknown[] type from MongoDB
    const opportunities = (user.cachedScanResults.opportunities || []) as Array<{ event?: { commenceTime?: string | Date } }>;
    const valueBets = (user.cachedScanResults.valueBets || []) as Array<{ event?: { commenceTime?: string | Date } }>;
    
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

    return NextResponse.json({
      hasCachedResults: true,
      opportunities: validOpportunities,
      valueBets: validValueBets,
      stats: user.cachedScanResults.stats,
      regions: user.cachedScanResults.regions,
      scannedAt: scannedAt.toISOString(),
      ageMinutes,
      autoScanEnabled: user.autoScan?.enabled || false,
    }, { headers: NO_STORE_HEADERS });
    
  } catch (error) {
    console.error('[API /cached-scan] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cached results', details: String(error) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}