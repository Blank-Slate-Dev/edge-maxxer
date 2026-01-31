// src/app/api/event-url/route.ts
// API endpoint to lookup deep links for events

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EventUrl from '@/lib/models/EventUrl';

export const dynamic = 'force-dynamic';

// GET - Lookup URLs (supports single or multiple bookmakers)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Support both parameter naming conventions
    const bookmaker = searchParams.get('bookmaker');
    const bookmakers = searchParams.get('bookmakers');
    const homeTeam = searchParams.get('homeTeam') || searchParams.get('home');
    const awayTeam = searchParams.get('awayTeam') || searchParams.get('away');
    const sport = searchParams.get('sport');
    
    // Determine which bookmaker(s) to look up
    const bookmakerList = bookmakers 
      ? bookmakers.split(',').filter(Boolean)
      : bookmaker 
        ? [bookmaker]
        : [];
    
    if (bookmakerList.length === 0 || !homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: 'Missing required params: bookmaker(s), homeTeam/home, awayTeam/away' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // If single bookmaker, return simple response
    if (bookmakerList.length === 1) {
      const result = await EventUrl.findEventUrl(bookmakerList[0], homeTeam, awayTeam, sport || undefined);
      
      if (result) {
        return NextResponse.json({
          found: true,
          url: result.eventUrl,
          eventName: result.eventName,
          scrapedAt: result.scrapedAt,
          expiresAt: result.expiresAt,
        });
      }
      
      return NextResponse.json({
        found: false,
        url: null,
      });
    }
    
    // Multiple bookmakers - return urls object
    const urls: Record<string, string | null> = {};
    
    await Promise.all(
      bookmakerList.map(async (bookie: string) => {
        const result = await EventUrl.findEventUrl(bookie, homeTeam, awayTeam, sport || undefined);
        urls[bookie] = result?.eventUrl || null;
      })
    );
    
    return NextResponse.json({
      urls,
      homeTeam,
      awayTeam,
      sport: sport || null,
    });
    
  } catch (error) {
    console.error('[EventUrl API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup URL' },
      { status: 500 }
    );
  }
}

// POST - Lookup multiple URLs at once (for arb display)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookmakers, homeTeam, awayTeam, sport } = body;
    
    if (!bookmakers || !Array.isArray(bookmakers) || !homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: 'Missing required params: bookmakers (array), homeTeam, awayTeam' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Lookup all bookmakers in parallel
    const urls: Record<string, string | null> = {};
    
    await Promise.all(
      bookmakers.map(async (bookmaker: string) => {
        const result = await EventUrl.findEventUrl(bookmaker, homeTeam, awayTeam, sport);
        urls[bookmaker] = result?.eventUrl || null;
      })
    );
    
    return NextResponse.json({
      urls,
      homeTeam,
      awayTeam,
      sport: sport || null,
    });
    
  } catch (error) {
    console.error('[EventUrl API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup URLs' },
      { status: 500 }
    );
  }
}