// src/app/api/ws/extension/route.ts
// WebSocket endpoint for Chrome extension real-time arb alerts
// Note: Vercel doesn't support WebSockets, so this would need to be deployed 
// separately (e.g., on Railway, Render, or a VPS) or use polling instead.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

// For Vercel deployment, we'll use Server-Sent Events (SSE) instead of WebSocket
// This allows real-time updates without a separate WebSocket server

export async function GET(request: NextRequest) {
  // Verify authentication via token
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 401 });
  }
  
  try {
    await dbConnect();
    
    // Find user by extension token
    const user = await User.findOne({ extensionToken: token });
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // For SSE: Return a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
        
        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`));
          } catch {
            clearInterval(heartbeat);
          }
        }, 30000);
        
        // Clean up on close
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
      },
    });
    
  } catch (error) {
    console.error('[WS Extension] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Alternative: Polling endpoint for extension to check for new arbs
export async function POST(request: NextRequest) {
  try {
    const { token, lastCheckAt } = await request.json();
    
    if (!token) {
      console.log('[Extension Poll] No token provided');
      return NextResponse.json({ error: 'Token required' }, { status: 401 });
    }
    
    console.log('[Extension Poll] Token received:', token.substring(0, 20) + '...');
    
    await dbConnect();
    
    // Find user by extension token
    const user = await User.findOne({ extensionToken: token }).select('cachedScanResults autoScan email');
    
    if (!user) {
      // Debug: Check if any user has a token
      const anyUserWithToken = await User.findOne({ extensionToken: { $exists: true, $ne: null } }).select('extensionToken email');
      console.log('[Extension Poll] Token not found in DB');
      console.log('[Extension Poll] Any user with token?', anyUserWithToken ? `Yes - ${anyUserWithToken.email}` : 'No');
      if (anyUserWithToken) {
        console.log('[Extension Poll] DB token starts with:', anyUserWithToken.extensionToken?.substring(0, 20));
      }
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    console.log('[Extension Poll] User found:', user.email);
    
    // Check if there are new arbs since last check
    if (!user.cachedScanResults?.scannedAt) {
      return NextResponse.json({ 
        hasNewArbs: false,
        arbs: [],
      });
    }
    
    const scannedAt = new Date(user.cachedScanResults.scannedAt);
    const lastCheck = lastCheckAt ? new Date(lastCheckAt) : new Date(0);
    
    // If scanned since last check, return arbs
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
      }>;
      
      // Filter to actual arbs (not near-arbs) - 0.5% minimum for testing
      const arbs = opportunities
        .filter(opp => opp.type === 'arb' && (opp.profitPercentage || 0) >= 0.5)
        .sort((a, b) => (b.profitPercentage || 0) - (a.profitPercentage || 0)) // Highest first
        .map(opp => ({
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
              stake: 0, // Will be calculated client-side
            },
            {
              outcome: opp.outcome2?.name,
              bookmaker: opp.outcome2?.bookmaker,
              odds: opp.outcome2?.odds,
              stake: 0,
            },
            ...(opp.outcome3 ? [{
              outcome: opp.outcome3.name,
              bookmaker: opp.outcome3.bookmaker,
              odds: opp.outcome3.odds,
              stake: 0,
            }] : []),
          ],
        }));
      
      return NextResponse.json({
        hasNewArbs: arbs.length > 0,
        arbs,
        scannedAt: scannedAt.toISOString(),
      });
    }
    
    return NextResponse.json({
      hasNewArbs: false,
      arbs: [],
    });
    
  } catch (error) {
    console.error('[Extension Poll] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}