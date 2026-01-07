// src/app/api/sports/route.ts
import { NextResponse } from 'next/server';
import { hasOddsApiKey } from '@/env';
import { getTheOddsApiProvider, getMockOddsProvider } from '@/lib/providers';
import { getCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cache = getCache();

    // Check cache first
    const cachedSports = cache.getSports();
    if (cachedSports) {
      return NextResponse.json({
        sports: cachedSports,
        cached: true,
      });
    }

    // Get sports from provider
    const useRealApi = hasOddsApiKey();
    const provider = useRealApi
      ? getTheOddsApiProvider()
      : getMockOddsProvider();

    const sports = await provider.getSupportedSports();

    // Transform and cache
    const sportsList = sports.map(s => ({
      key: s.key,
      title: s.title,
      group: s.group,
    }));

    cache.setSports(sportsList);

    return NextResponse.json({
      sports: sportsList,
      cached: false,
      isUsingMockData: !useRealApi,
    });
  } catch (error) {
    console.error('[API /sports] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sports', details: String(error) },
      { status: 500 }
    );
  }
}
