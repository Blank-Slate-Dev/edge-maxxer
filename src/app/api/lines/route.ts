// src/app/api/lines/route.ts
import { NextResponse } from 'next/server';
import { createOddsApiProvider } from '@/lib/providers/theOddsApiProvider';
import { detectLineOpportunities } from '@/lib/arb/lineDetector';
import { config } from '@/lib/config';
import { getUserApiKey } from '@/lib/getUserApiKey';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minProfit = parseFloat(searchParams.get('minProfit') || '-2');
    const maxHours = parseInt(searchParams.get('maxHours') || '72', 10);
    const marketType = searchParams.get('market') || 'all';
    const showMiddles = searchParams.get('middles') !== 'false';
    const globalMode = searchParams.get('global') === 'true';

    // Get user's API key from database
    const userApiKey = await getUserApiKey();
    
    // If no API key, return helpful message
    if (!userApiKey) {
      return NextResponse.json({
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
        globalMode,
        noApiKey: true,
        message: 'No API key configured. Go to Settings to add your Odds API key.',
      });
    }

    // Create provider with user's key
    const provider = createOddsApiProvider(userApiKey);

    console.log(`[API /lines] Using provider: ${provider.name}, globalMode: ${globalMode}`);

    // Get sports list
    const allSports = await provider.getSupportedSports();
    const sportsToFetch = allSports
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
    console.log(`[API /lines] Found ${sportsToFetch.length} sports with spreads/totals`);

    // Determine which markets to fetch
    const markets = marketType === 'all' 
      ? ['spreads', 'totals'] 
      : [marketType];

    // Fetch odds - pass globalMode
    console.log(`[API /lines] Fetching ${markets.join(', ')} for ${sportsToFetch.length} sports...`);
    const oddsResult = await provider.fetchOdds(sportsToFetch, markets, globalMode);

    console.log(`[API /lines] Total events fetched: ${oddsResult.events.length}`);

    // Detect line opportunities
    const { spreadArbs, totalsArbs, middles, stats } = detectLineOpportunities(
      oddsResult.events,
      config.filters.nearArbThreshold
    );

    console.log(`[API /lines] Detection complete:`, stats);

    // Filter by time
    const now = new Date();
    const maxTime = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

    const filteredSpreads = spreadArbs.filter(opp => {
      if (opp.profitPercentage < minProfit) return false;
      if (opp.event.commenceTime > maxTime) return false;
      if (opp.event.commenceTime < now) return false;
      return true;
    });

    const filteredTotals = totalsArbs.filter(opp => {
      if (opp.profitPercentage < minProfit) return false;
      if (opp.event.commenceTime > maxTime) return false;
      if (opp.event.commenceTime < now) return false;
      return true;
    });

    const filteredMiddles = showMiddles 
      ? middles.filter(m => {
          if (m.event.commenceTime > maxTime) return false;
          if (m.event.commenceTime < now) return false;
          return true;
        })
      : [];

    const response = {
      spreadArbs: filteredSpreads,
      totalsArbs: filteredTotals,
      middles: filteredMiddles,
      stats,
      lastUpdated: new Date().toISOString(),
      isUsingMockData: false,
      globalMode,
      remainingApiRequests: oddsResult.meta.remainingRequests,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /lines] Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute line opportunities', details: String(error) },
      { status: 500 }
    );
  }
}