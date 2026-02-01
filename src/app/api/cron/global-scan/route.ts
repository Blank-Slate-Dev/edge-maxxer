// src/app/api/cron/global-scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import GlobalScanCache from '@/lib/models/GlobalScanCache';
import { createOddsApiProvider } from '@/lib/providers/theOddsApiProvider';
import { detectAllOpportunities } from '@/lib/arb/detector';
import { config, getApiRegionsForUserRegions, type UserRegion } from '@/lib/config';
import { buildFullEventUrls } from '@/lib/scraper/urlBuilder';
import type { BookVsBookArb } from '@/lib/types';

const CRON_SECRET = process.env.CRON_SECRET;
const MASTER_ODDS_API_KEY = process.env.MASTER_ODDS_API_KEY;

// Regions to scan - all regions for global coverage
const SCAN_REGIONS: UserRegion[] = ['AU', 'UK', 'US', 'EU'];

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Extended arb type with URLs
interface ArbWithUrls extends BookVsBookArb {
  bookmakerUrls?: Record<string, {
    eventUrl: string | null;
    competitionUrl: string | null;
    searchUrl: string | null;
  }>;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');

    if (CRON_SECRET) {
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        console.log('[GlobalScan] Unauthorized cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const isVercelCron = request.headers.get('x-vercel-cron') === '1';
      if (!isVercelCron && process.env.NODE_ENV === 'production') {
        console.log('[GlobalScan] Missing cron authentication');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Check for master API key
    if (!MASTER_ODDS_API_KEY) {
      console.error('[GlobalScan] MASTER_ODDS_API_KEY not configured');
      return NextResponse.json(
        { error: 'Master API key not configured' },
        { status: 500 }
      );
    }

    console.log('[GlobalScan] Starting global scan...');

    await dbConnect();

    // Run the scan
    const scanResult = await runGlobalScan();

    const scanDurationMs = Date.now() - startTime;

    // Update the global cache
    await GlobalScanCache.updateScan({
      opportunities: scanResult.opportunities,
      valueBets: scanResult.valueBets,
      stats: scanResult.stats,
      regions: SCAN_REGIONS,
      scannedAt: new Date(),
      scanDurationMs,
      remainingCredits: scanResult.remainingCredits,
    });

    console.log(
      `[GlobalScan] Complete: ${scanResult.opportunities.length} arbs, ` +
      `${scanResult.valueBets.length} value bets, ${scanDurationMs}ms`
    );

    return NextResponse.json({
      success: true,
      arbsFound: scanResult.opportunities.length,
      valueBetsFound: scanResult.valueBets.length,
      stats: scanResult.stats,
      durationMs: scanDurationMs,
      remainingCredits: scanResult.remainingCredits,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GlobalScan] Error:', errorMsg);

    // Try to save error state
    try {
      await dbConnect();
      await GlobalScanCache.updateScan({
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
        regions: SCAN_REGIONS,
        scannedAt: new Date(),
        scanDurationMs: Date.now() - startTime,
        error: errorMsg,
      });
    } catch {
      // Ignore save error
    }

    return NextResponse.json(
      { error: 'Global scan failed', details: errorMsg },
      { status: 500 }
    );
  }
}

/**
 * Add bookmaker URLs to arb opportunities
 */
function addUrlsToArbs(arbs: BookVsBookArb[]): ArbWithUrls[] {
  return arbs.map(arb => {
    const bookmakers = [arb.outcome1.bookmaker, arb.outcome2.bookmaker];
    if (arb.outcome3) {
      bookmakers.push(arb.outcome3.bookmaker);
    }

    const bookmakerUrls = buildFullEventUrls(
      arb.event.sportKey,
      arb.event.homeTeam,
      arb.event.awayTeam,
      bookmakers
    );

    return {
      ...arb,
      bookmakerUrls,
    };
  });
}

/**
 * Run global arbitrage scan using master API key
 */
async function runGlobalScan(): Promise<{
  opportunities: ArbWithUrls[];
  valueBets: unknown[];
  stats: {
    totalEvents: number;
    eventsWithMultipleBookmakers: number;
    totalBookmakers: number;
    arbsFound: number;
    nearArbsFound: number;
    valueBetsFound: number;
    sportsScanned: number;
  };
  remainingCredits?: number;
}> {
  const provider = createOddsApiProvider(MASTER_ODDS_API_KEY!);

  // Get API regions string for all regions
  const regionsStr = getApiRegionsForUserRegions(SCAN_REGIONS);

  console.log(`[GlobalScan] Scanning regions: ${regionsStr}`);

  // Fetch available sports
  const allSports = await provider.getSupportedSports();
  const sportsToFetch = allSports
    .filter(s => !s.hasOutrights)
    .map(s => s.key);

  console.log(`[GlobalScan] Fetching ${sportsToFetch.length} sports`);

  // Fetch odds - h2h, spreads, and totals markets
  const oddsResult = await provider.fetchOdds(
    sportsToFetch,
    ['h2h', 'spreads', 'totals'],
    regionsStr
  );

  console.log(`[GlobalScan] Fetched ${oddsResult.events.length} events`);

  // Detect opportunities
  const { arbs, valueBets, stats } = detectAllOpportunities(
    oddsResult.events,
    config.filters.nearArbThreshold,
    config.filters.valueThreshold
  );

  // Filter valid arbs (not started, within 72 hours)
  const now = new Date();
  const maxTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const validArbs = arbs.filter(opp => {
    if (opp.event.commenceTime > maxTime) return false;
    if (opp.event.commenceTime < now) return false;
    return true;
  });

  const validValueBets = valueBets.filter(vb => {
    if (vb.event.commenceTime > maxTime) return false;
    if (vb.event.commenceTime < now) return false;
    return true;
  });

  // Add URLs to arbs
  const arbsWithUrls = addUrlsToArbs(validArbs);

  return {
    opportunities: arbsWithUrls,
    valueBets: validValueBets,
    stats,
    remainingCredits: (oddsResult as { remainingRequests?: number }).remainingRequests,
  };
}