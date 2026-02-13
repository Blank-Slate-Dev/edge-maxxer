// src/app/api/preview-arbs/route.ts
//
// PUBLIC endpoint — no auth required.
// Returns real cached scan data with team names, bookmaker display names,
// and sport titles replaced with placeholder text.
// bookmakerKey is KEPT so logos load correctly in preview mode.
// Profit %, odds, and structure remain intact so visitors can see the
// VALUE of the tool without seeing actionable details.

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import GlobalScanCache from '@/lib/models/GlobalScanCache';
import type { UserRegion } from '@/lib/config';

export const dynamic = 'force-dynamic';

// Obfuscation helpers
const TEAM_PLACEHOLDERS = [
  'Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F',
  'Team G', 'Team H', 'Team I', 'Team J', 'Team K', 'Team L',
];
const BOOK_PLACEHOLDER = 'Bookmaker';
const SPORT_PLACEHOLDER = 'Sport';

let teamCounter = 0;
const teamMap = new Map<string, string>();

function obfuscateTeam(name: string): string {
  if (teamMap.has(name)) return teamMap.get(name)!;
  const placeholder = TEAM_PLACEHOLDERS[teamCounter % TEAM_PLACEHOLDERS.length];
  teamCounter++;
  teamMap.set(name, placeholder);
  return placeholder;
}

function obfuscateEvent(event: Record<string, unknown>): Record<string, unknown> {
  return {
    ...event,
    homeTeam: obfuscateTeam(event.homeTeam as string),
    awayTeam: obfuscateTeam(event.awayTeam as string),
    sportTitle: SPORT_PLACEHOLDER,
    sportKey: 'hidden',
  };
}

function obfuscateOutcome(outcome: Record<string, unknown>): Record<string, unknown> {
  return {
    ...outcome,
    bookmaker: BOOK_PLACEHOLDER,
    // bookmakerKey is intentionally KEPT — needed for logo loading in preview
    name: obfuscateOutcomeName(outcome.name as string),
    alternativeOdds: undefined,
  };
}

function obfuscateOutcomeName(name: string): string {
  const genericNames = ['Over', 'Under', 'Draw', 'Home', 'Away'];
  for (const g of genericNames) {
    if (name.toLowerCase().includes(g.toLowerCase())) return name;
  }
  return obfuscateTeam(name);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function obfuscateOpportunity(opp: any): any {
  const result = { ...opp };
  result.event = obfuscateEvent(result.event);

  if (result.outcome1) result.outcome1 = obfuscateOutcome(result.outcome1);
  if (result.outcome2) result.outcome2 = obfuscateOutcome(result.outcome2);
  if (result.outcome3) result.outcome3 = obfuscateOutcome(result.outcome3);
  if (result.backOutcome) result.backOutcome = obfuscateOutcome(result.backOutcome);
  if (result.layOutcome) {
    result.layOutcome = { ...result.layOutcome, name: obfuscateOutcomeName(result.layOutcome.name) };
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function obfuscateSpreadOrTotals(item: any): any {
  const result = { ...item };
  result.event = obfuscateEvent(result.event);

  if (result.favorite) result.favorite = obfuscateOutcome(result.favorite);
  if (result.underdog) result.underdog = obfuscateOutcome(result.underdog);
  // Keep bookmakerKey on over/under for logo loading
  if (result.over) result.over = { ...result.over, bookmaker: BOOK_PLACEHOLDER };
  if (result.under) result.under = { ...result.under, bookmaker: BOOK_PLACEHOLDER };

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function obfuscateMiddle(m: any): any {
  const result = { ...m };
  result.event = obfuscateEvent(result.event);
  // Keep bookmakerKey on sides for logo loading
  if (result.side1) result.side1 = { ...result.side1, bookmaker: BOOK_PLACEHOLDER, name: obfuscateOutcomeName(result.side1.name || '') };
  if (result.side2) result.side2 = { ...result.side2, bookmaker: BOOK_PLACEHOLDER, name: obfuscateOutcomeName(result.side2.name || '') };
  if (result.middleRange) {
    result.middleRange = { ...result.middleRange, description: 'Sign up to see details' };
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function obfuscateValueBet(vb: any): any {
  const result = { ...vb };
  result.event = obfuscateEvent(result.event);
  // Keep bookmakerKey on outcome for logo loading
  if (result.outcome) result.outcome = { ...result.outcome, bookmaker: BOOK_PLACEHOLDER, name: obfuscateOutcomeName(result.outcome.name || '') };
  if (result.allOdds) result.allOdds = [];
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = (searchParams.get('region') || 'AU') as UserRegion;

    const validRegions: UserRegion[] = ['AU', 'UK', 'US', 'EU'];
    if (!validRegions.includes(region)) {
      return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
    }

    await dbConnect();

    const cachedScan = await GlobalScanCache.getScanForRegion(region);

    if (!cachedScan || !cachedScan.opportunities) {
      return NextResponse.json({
        hasCachedResults: false,
        region,
        opportunities: [],
        valueBets: [],
        spreadArbs: [],
        totalsArbs: [],
        middles: [],
        stats: null,
      });
    }

    // Reset obfuscation state for each request
    teamCounter = 0;
    teamMap.clear();

    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterByTime = <T extends { event?: any }>(items: T[]): T[] => {
      return items.filter(item => {
        const ct = item.event?.commenceTime;
        if (!ct) return false;
        return new Date(ct) > now;
      });
    };

    // Filter then obfuscate
    const opportunities = filterByTime(cachedScan.opportunities as Record<string, unknown>[]).map(obfuscateOpportunity);
    const valueBets = filterByTime((cachedScan.valueBets || []) as Record<string, unknown>[]).map(obfuscateValueBet);
    const spreadArbs = filterByTime((cachedScan.spreadArbs || []) as Record<string, unknown>[]).map(obfuscateSpreadOrTotals);
    const totalsArbs = filterByTime((cachedScan.totalsArbs || []) as Record<string, unknown>[]).map(obfuscateSpreadOrTotals);
    const middles = filterByTime((cachedScan.middles || []) as Record<string, unknown>[]).map(obfuscateMiddle);

    const ageSeconds = Math.round((now.getTime() - new Date(cachedScan.scannedAt).getTime()) / 1000);

    return NextResponse.json({
      hasCachedResults: true,
      region,
      opportunities,
      valueBets,
      spreadArbs,
      totalsArbs,
      middles,
      stats: cachedScan.stats,
      lineStats: cachedScan.lineStats,
      scannedAt: cachedScan.scannedAt,
      ageSeconds,
      preview: true,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[API /preview-arbs] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch preview data' }, { status: 500 });
  }
}