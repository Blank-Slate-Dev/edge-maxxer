// src/app/api/sports/route.ts
import { NextResponse } from 'next/server';
import { createOddsApiProvider } from '@/lib/providers/theOddsApiProvider';
import { getUserApiKey } from '@/lib/getUserApiKey';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Get user's API key from their profile
    const userApiKey = await getUserApiKey();
    
    if (!userApiKey) {
      return NextResponse.json({
        sports: [],
        noApiKey: true,
        message: 'No API key configured. Go to Settings to add your Odds API key.',
      });
    }

    // Create provider with user's API key
    const provider = createOddsApiProvider(userApiKey);

    console.log(`[API /sports] Using provider: ${provider.name}`);

    const sports = await provider.getSupportedSports();

    return NextResponse.json({
      sports,
      isUsingMockData: false,
    });
  } catch (error) {
    console.error('[API /sports] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sports', details: String(error) },
      { status: 500 }
    );
  }
}
