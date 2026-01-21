// src/app/api/lines/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOddsApiProvider } from '@/lib/providers/theOddsApiProvider';
import { detectLineOpportunities } from '@/lib/arb/lineDetector';
import { config } from '@/lib/config';
import { getUserApiKey } from '@/lib/getUserApiKey';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
};

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to scan for opportunities.' },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    // Check subscription status
    await dbConnect();
    const userId = (session.user as { id: string }).id;
    const user = await User.findById(userId);

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
          message: 'Please subscribe to access the lines scanner.',
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const minProfit = parseFloat(searchParams.get('minProfit') || '-2');
    const maxHours = parseInt(searchParams.get('maxHours') || '72', 10);
    const marketType = searchParams.get('market') || 'all';
    const showMiddles = searchParams.get('middles') !== 'false';
    
    // Get regions parameter (comma-separated API regions like 'au,uk,us,eu')
    // Defaults to 'au' for backwards compatibility
    const regions = searchParams.get('regions') || 'au';
    
    // Get sports filter (comma-separated sport keys for Quick Scan)
    const sportsFilter = searchParams.get('sports');
    const requestedSports = sportsFilter ? sportsFilter.split(',').map(s => s.trim()) : null;
    const isQuickScan = requestedSports !== null && requestedSports.length > 0;

    // Get user's API key from database
    const userApiKey = await getUserApiKey();
    
    // If no API key, return helpful message
    if (!userApiKey) {
      return NextResponse.json(
        {
          spreadArbs: [],
          totalsArbs: [],
          middles: [],
          stats: {
            totalEvents: 0,
            spreadArbsFound: 0,
            totalsArbsFound: 0,
            middlesFound: 0,
            nearArbsFound: 0,
          },
          lastUpdated: new Date().toISOString(),
          isUsingMockData: false,
          regions,
          noApiKey: true,
          message: 'No API key configured. Go to Settings to add your Odds API key.',
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // Create provider with user's key
    const provider = createOddsApiProvider(userApiKey);

    console.log(`[API /lines] Using provider: ${provider.name}, regions: ${regions}${isQuickScan ? ', Quick Scan mode' : ''}`);

    // Get sports list - focus on sports that have spreads/totals
    const allSports = await provider.getSupportedSports();
    
    // Filter to sports that typically have spreads/totals markets
    let sportsToFetch = allSports
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
    
    // Apply sports filter if Quick Scan is active
    if (isQuickScan) {
      const availableSportsSet = new Set(sportsToFetch);
      sportsToFetch = requestedSports.filter(sport => availableSportsSet.has(sport));
      console.log(`[API /lines] Quick Scan: filtered to ${sportsToFetch.length} of ${requestedSports.length} requested sports (that have spreads/totals)`);
    }
    
    console.log(`[API /lines] Found ${sportsToFetch.length} sports with spreads/totals`);

    // Determine which markets to fetch
    const markets = marketType === 'all' 
      ? ['spreads', 'totals']
      : marketType === 'spreads' 
        ? ['spreads'] 
        : ['totals'];

    // Fetch odds with regions string
    const oddsResult = await provider.fetchOdds(sportsToFetch, markets, regions);

    console.log(`[API /lines] Total events fetched: ${oddsResult.events.length}`);

    // Detect opportunities (middles are always detected, filtered later if needed)
    const { spreadArbs, totalsArbs, middles, stats } = detectLineOpportunities(
      oddsResult.events,
      config.filters.nearArbThreshold
    );

    console.log(`[API /lines] Detection complete:`, stats);

    // Filter by time
    const now = new Date();
    const maxTime = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

    const filterByTime = <T extends { event: { commenceTime: Date }; profitPercentage: number }>(items: T[]): T[] => {
      return items.filter(item => {
        if (item.profitPercentage < minProfit) return false;
        if (item.event.commenceTime > maxTime) return false;
        if (item.event.commenceTime < now) return false;
        return true;
      });
    };

    const filteredSpreads = filterByTime(spreadArbs);
    const filteredTotals = filterByTime(totalsArbs);
    
    // Filter middles by time and showMiddles flag
    const filteredMiddles = showMiddles 
      ? middles.filter(m => {
          if (m.event.commenceTime > maxTime) return false;
          if (m.event.commenceTime < now) return false;
          return true;
        })
      : [];

    return NextResponse.json(
      {
        spreadArbs: filteredSpreads,
        totalsArbs: filteredTotals,
        middles: filteredMiddles,
        stats,
        lastUpdated: new Date().toISOString(),
        isUsingMockData: false,
        regions,
        remainingApiRequests: oddsResult.meta.remainingRequests,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error('[API /lines] Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute line opportunities', details: String(error) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}