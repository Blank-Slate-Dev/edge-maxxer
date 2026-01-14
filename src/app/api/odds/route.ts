// src/app/api/odds/route.ts
import { NextResponse } from 'next/server';
import { createOddsApiProvider } from '@/lib/providers/theOddsApiProvider';
import { getCache } from '@/lib/cache';
import { config } from '@/lib/config';
import { getUserApiKey } from '@/lib/getUserApiKey';

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

    // Get user's API key from database
    const userApiKey = await getUserApiKey();
    
    // If no API key, return helpful message
    if (!userApiKey) {
      return NextResponse.json({
        events: [],
        source: 'none',
        lastUpdated: new Date().toISOString(),
        cached: false,
        noApiKey: true,
        message: 'No API key configured. Go to Settings to add your Odds API key.',
      });
    }

    // Create provider with user's key
    const provider = createOddsApiProvider(userApiKey);

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
      isUsingMockData: false,
    });
  } catch (error) {
    console.error('[API /odds] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch odds', details: String(error) },
      { status: 500 }
    );
  }
}
