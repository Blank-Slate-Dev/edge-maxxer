// src/app/api/odds/route.ts
import { NextResponse } from 'next/server';
import { hasOddsApiKey } from '@/env';
import { getTheOddsApiProvider, getMockOddsProvider } from '@/lib/providers';
import { getCache } from '@/lib/cache';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const cache = getCache();
    
    // Check cache first
    const cachedOdds = cache.getOdds();
    if (cachedOdds) {
      const timestamp = cache.getOddsTimestamp();
      return NextResponse.json({
        events: cachedOdds.events,
        source: cachedOdds.source,
        remainingRequests: cachedOdds.remainingRequests,
        lastUpdated: timestamp?.toISOString(),
        cached: true,
      });
    }

    // Determine which provider to use
    const useRealApi = hasOddsApiKey();
    const provider = useRealApi
      ? getTheOddsApiProvider()
      : getMockOddsProvider();

    console.log(`[API /odds] Using provider: ${provider.name}`);

    // Fetch odds (use popular sports from config)
    const result = await provider.fetchOdds([...config.sportCategories.popular]);

    // Cache the results
    cache.setOdds({
      events: result.events,
      source: result.meta.source,
      remainingRequests: result.meta.remainingRequests,
    });

    const timestamp = cache.getOddsTimestamp();

    return NextResponse.json({
      events: result.events,
      source: result.meta.source,
      remainingRequests: result.meta.remainingRequests,
      usedRequests: result.meta.usedRequests,
      lastUpdated: timestamp?.toISOString(),
      cached: false,
      isUsingMockData: !useRealApi,
    });
  } catch (error) {
    console.error('[API /odds] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch odds', details: String(error) },
      { status: 500 }
    );
  }
}
