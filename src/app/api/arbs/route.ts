// src/app/api/arbs/route.ts
import { NextResponse } from 'next/server';
import { createOddsApiProvider } from '@/lib/providers/theOddsApiProvider';
import { detectAllOpportunities } from '@/lib/arb/detector';
import { getCache } from '@/lib/cache';
import { config } from '@/lib/config';
import { getUserApiKey } from '@/lib/getUserApiKey';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minProfit = parseFloat(searchParams.get('minProfit') || '-2');
    const maxHours = parseInt(searchParams.get('maxHours') || '72', 10);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const showNearArbs = searchParams.get('nearArbs') !== 'false';
    const showValueBets = searchParams.get('valueBets') !== 'false';
    
    // Get regions parameter (comma-separated API regions like 'au,uk,us,eu')
    // Defaults to 'au' for backwards compatibility
    const regions = searchParams.get('regions') || 'au';
    const isMultiRegion = regions.includes(',') || regions !== 'au';

    const cache = getCache();

    // Check cache first (only for single AU region)
    if (!forceRefresh && !isMultiRegion) {
      const cached = cache.getArbs();
      if (cached) {
        return NextResponse.json({
          ...cached,
          cached: true,
          regions,
        });
      }
    }

    // Get user's API key from database
    const userApiKey = await getUserApiKey();
    
    // If no API key, return helpful message
    if (!userApiKey) {
      return NextResponse.json({
        opportunities: [],
        valueBets: [],
        stats: {
          totalEvents: 0,
          eventsWithMultipleBookmakers: 0,
          totalBookmakers: 0,
          arbsFound: 0,
          nearArbsFound: 0,
          valueBetsFound: 0,
          sportsScanned: 0,
        },
        lastUpdated: new Date().toISOString(),
        isUsingMockData: false,
        cached: false,
        regions,
        noApiKey: true,
        message: 'No API key configured. Go to Settings to add your Odds API key.',
      });
    }

    // Create provider with user's key
    const provider = createOddsApiProvider(userApiKey);

    console.log(`[API /arbs] Using provider: ${provider.name}, regions: ${regions}`);

    // Fetch ALL available sports
    console.log('[API /arbs] Fetching available sports list...');
    const allSports = await provider.getSupportedSports();
    const sportsToFetch = allSports
      .filter(s => !s.hasOutrights)
      .map(s => s.key);
    console.log(`[API /arbs] Found ${sportsToFetch.length} sports with h2h markets`);

    // Fetch odds - pass regions string
    console.log(`[API /arbs] Fetching odds for ${sportsToFetch.length} sports...`);
    const oddsResult = await provider.fetchOdds(sportsToFetch, ['h2h'], regions);

    console.log(`[API /arbs] Total events fetched: ${oddsResult.events.length}`);

    // Log bookmaker distribution
    const bookmakerCount = new Map<string, number>();
    oddsResult.events.forEach(e => {
      e.bookmakers.forEach(b => {
        bookmakerCount.set(b.bookmaker.key, (bookmakerCount.get(b.bookmaker.key) || 0) + 1);
      });
    });
    console.log(`[API /arbs] Bookmakers found:`, Object.fromEntries(bookmakerCount));

    // Update odds cache (only in single AU mode)
    if (!isMultiRegion) {
      cache.setOdds({
        events: oddsResult.events,
        source: oddsResult.meta.source,
        remainingRequests: oddsResult.meta.remainingRequests,
      });
    }

    // Detect all opportunities
    const { arbs, valueBets, stats } = detectAllOpportunities(
      oddsResult.events,
      config.filters.nearArbThreshold,
      config.filters.valueThreshold
    );

    console.log(`[API /arbs] Detection complete:`, stats);

    // Filter by time
    const now = new Date();
    const maxTime = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

    const filteredArbs = arbs.filter(opp => {
      if (opp.profitPercentage < minProfit) return false;
      if (!showNearArbs && opp.type === 'near-arb') return false;
      if (opp.event.commenceTime > maxTime) return false;
      if (opp.event.commenceTime < now) return false;
      return true;
    });

    const filteredValueBets = showValueBets 
      ? valueBets.filter(vb => {
          if (vb.event.commenceTime > maxTime) return false;
          if (vb.event.commenceTime < now) return false;
          return true;
        })
      : [];

    const response = {
      opportunities: filteredArbs,
      valueBets: filteredValueBets,
      stats,
      lastUpdated: new Date().toISOString(),
      isUsingMockData: false,
      cached: false,
      regions,
      remainingApiRequests: oddsResult.meta.remainingRequests,
    };

    // Cache the response (only in single AU mode)
    if (!isMultiRegion) {
      cache.setArbs({
        opportunities: arbs,
        valueBets,
        isUsingMockData: false,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /arbs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute opportunities', details: String(error) },
      { status: 500 }
    );
  }
}
