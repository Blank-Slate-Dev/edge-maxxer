// src/app/api/ws/extension/route.ts
// Polling endpoint for Chrome extension arb alerts
// Returns arbs with bookmaker URLs for direct navigation

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

// CORS headers for Chrome extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// For SSE: Return a streaming response (optional - for future use)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 401, headers: corsHeaders });
  }
  
  try {
    await dbConnect();
    
    const user = await User.findOne({ extensionToken: token });
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders });
    }
    
    // For SSE: Return a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
        
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`));
          } catch {
            clearInterval(heartbeat);
          }
        }, 30000);
        
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          controller.close();
        });
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders,
      },
    });
    
  } catch (error) {
    console.error('[WS Extension] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: corsHeaders });
  }
}

// Main polling endpoint for extension
export async function POST(request: NextRequest) {
  try {
    const { token, lastCheckAt } = await request.json();
    
    if (!token) {
      console.log('[Extension Poll] No token provided');
      return NextResponse.json({ error: 'Token required' }, { status: 401, headers: corsHeaders });
    }
    
    console.log('[Extension Poll] Token received:', token.substring(0, 20) + '...');
    
    await dbConnect();
    
    const user = await User.findOne({ extensionToken: token }).select('cachedScanResults autoScan email');
    
    if (!user) {
      const anyUserWithToken = await User.findOne({ extensionToken: { $exists: true, $ne: null } }).select('extensionToken email');
      console.log('[Extension Poll] Token not found in DB');
      console.log('[Extension Poll] Any user with token?', anyUserWithToken ? `Yes - ${anyUserWithToken.email}` : 'No');
      if (anyUserWithToken) {
        console.log('[Extension Poll] DB token starts with:', anyUserWithToken.extensionToken?.substring(0, 20));
      }
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders });
    }
    
    console.log('[Extension Poll] User found:', user.email);
    
    if (!user.cachedScanResults?.scannedAt) {
      return NextResponse.json({ 
        hasNewArbs: false,
        arbs: [],
      }, { headers: corsHeaders });
    }
    
    const scannedAt = new Date(user.cachedScanResults.scannedAt);
    const lastCheck = lastCheckAt ? new Date(lastCheckAt) : new Date(0);
    
    if (scannedAt > lastCheck) {
      const opportunities = (user.cachedScanResults.opportunities || []) as Array<{
        id?: string;
        profitPercentage?: number;
        event?: {
          homeTeam?: string;
          awayTeam?: string;
          sportKey?: string;
          commenceTime?: string | Date;
        };
        outcome1?: { name?: string; bookmaker?: string; odds?: number };
        outcome2?: { name?: string; bookmaker?: string; odds?: number };
        outcome3?: { name?: string; bookmaker?: string; odds?: number };
        type?: string;
        // New: bookmaker URLs from auto-scan
        bookmakerUrls?: Record<string, {
          eventUrl?: string | null;
          competitionUrl?: string | null;
          searchUrl?: string | null;
        }>;
      }>;
      
      // Filter to actual arbs (not near-arbs) - 0.5% minimum for testing
      const arbs = opportunities
        .filter(opp => opp.type === 'arb' && (opp.profitPercentage || 0) >= 0.5)
        .sort((a, b) => (b.profitPercentage || 0) - (a.profitPercentage || 0))
        .map(opp => {
          // Helper to get URL info for a bookmaker
          const getUrlInfo = (bookmaker: string) => {
            const urlInfo = opp.bookmakerUrls?.[bookmaker];
            return {
              eventUrl: urlInfo?.eventUrl || null,
              competitionUrl: urlInfo?.competitionUrl || null,
              searchUrl: urlInfo?.searchUrl || null,
            };
          };
          
          return {
            id: opp.id || `${opp.event?.homeTeam}-${opp.event?.awayTeam}-${Date.now()}`,
            profitPercent: opp.profitPercentage || 0,
            eventName: `${opp.event?.homeTeam} vs ${opp.event?.awayTeam}`,
            homeTeam: opp.event?.homeTeam,
            awayTeam: opp.event?.awayTeam,
            sport: opp.event?.sportKey,
            commenceTime: opp.event?.commenceTime,
            bets: [
              {
                outcome: opp.outcome1?.name,
                bookmaker: opp.outcome1?.bookmaker,
                odds: opp.outcome1?.odds,
                stake: 0,
                // Include URL info for this bookmaker
                urls: opp.outcome1?.bookmaker ? getUrlInfo(opp.outcome1.bookmaker) : null,
              },
              {
                outcome: opp.outcome2?.name,
                bookmaker: opp.outcome2?.bookmaker,
                odds: opp.outcome2?.odds,
                stake: 0,
                urls: opp.outcome2?.bookmaker ? getUrlInfo(opp.outcome2.bookmaker) : null,
              },
              ...(opp.outcome3 ? [{
                outcome: opp.outcome3.name,
                bookmaker: opp.outcome3.bookmaker,
                odds: opp.outcome3.odds,
                stake: 0,
                urls: opp.outcome3.bookmaker ? getUrlInfo(opp.outcome3.bookmaker) : null,
              }] : []),
            ],
            // Also include top-level URLs for convenience
            bookmakerUrls: opp.bookmakerUrls || {},
          };
        });
      
      return NextResponse.json({
        hasNewArbs: arbs.length > 0,
        arbs,
        scannedAt: scannedAt.toISOString(),
      }, { headers: corsHeaders });
    }
    
    return NextResponse.json({
      hasNewArbs: false,
      arbs: [],
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('[Extension Poll] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: corsHeaders });
  }
}