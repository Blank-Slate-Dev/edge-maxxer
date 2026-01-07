// src/app/api/arbs/route.ts
import { NextResponse } from 'next/server';
import { hasOddsApiKey } from '@/env';
import { getTheOddsApiProvider, getMockOddsProvider } from '@/lib/providers';
import { detectAllOpportunities } from '@/lib/arb/detector';
import { getCache } from '@/lib/cache';
import { config } from '@/lib/config';
import type { ArbOpportunity, ValueBet, ScanStats } from '@/lib/types';

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

    const cache = getCache();

    // Check cache first
    if (!forceRefresh) {
      const cached = cache.getArbs();
      if (cached) {
        return NextResponse.json({
          ...cached,
          cached: true,
        });
      }
    }

    // Get fresh data
    const useRealApi = hasOddsApiKey();
    const provider = useRealApi
      ? getTheOddsApiProvider()
      : getMockOddsProvider();

    console.log(`[API /arbs] Using provider: ${provider.name}`);

    // Fetch ALL available sports
    let sportsToFetch: string[] = [];
    
    if (useRealApi) {
      console.log('[API /arbs] Fetching available sports list...');
      const allSports = await provider.getSupportedSports();
      // Filter to sports with head-to-head markets (not outrights)
      sportsToFetch = allSports
        .filter(s => !s.hasOutrights)
        .map(s => s.key);
      console.log(`[API /arbs] Found ${sportsToFetch.length} sports with h2h markets`);
    } else {
      // Mock provider - use default sports
      sportsToFetch = [...config.sportCategories.popular];
    }

    // Fetch odds for all sports
    console.log(`[API /arbs] Fetching odds for ${sportsToFetch.length} sports...`);
    const oddsResult = await provider.fetchOdds(sportsToFetch);

    console.log(`[API /arbs] Total events fetched: ${oddsResult.events.length}`);

    // Log bookmaker distribution
    const bookmakerCount = new Map<string, number>();
    oddsResult.events.forEach(e => {
      e.bookmakers.forEach(b => {
        bookmakerCount.set(b.bookmaker.key, (bookmakerCount.get(b.bookmaker.key) || 0) + 1);
      });
    });
    console.log(`[API /arbs] Bookmakers found:`, Object.fromEntries(bookmakerCount));

    // Update odds cache
    cache.setOdds({
      events: oddsResult.events,
      source: oddsResult.meta.source,
      remainingRequests: oddsResult.meta.remainingRequests,
    });

    // Detect all opportunities
    const { arbs, valueBets, bestOdds, stats } = detectAllOpportunities(
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
      isUsingMockData: !useRealApi,
      cached: false,
      remainingApiRequests: oddsResult.meta.remainingRequests,
    };

    // Cache the response
    cache.setArbs({
      opportunities: arbs,
      valueBets,
      isUsingMockData: !useRealApi,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /arbs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute opportunities', details: String(error) },
      { status: 500 }
    );
  }
}
