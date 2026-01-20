// src/lib/arb/lineDetector.ts
import type {
  SportEvent,
  SpreadArb,
  TotalsArb,
  MiddleOpportunity,
  NormalizedEvent,
  OpportunityType,
  LineStats,
} from '../types';
import { normalizeEvent } from '../normalization/eventMatcher';
import { config } from '../config';

interface LineDetectionResult {
  spreadArbs: SpreadArb[];
  totalsArbs: TotalsArb[];
  middles: MiddleOpportunity[];
  stats: LineStats;
}

/**
 * Detects spread and totals arbitrage opportunities
 */
export function detectLineOpportunities(
  events: SportEvent[],
  nearArbThreshold: number = config.filters.nearArbThreshold
): LineDetectionResult {
  const spreadArbs: SpreadArb[] = [];
  const totalsArbs: TotalsArb[] = [];
  const middles: MiddleOpportunity[] = [];

  let eventsWithSpreads = 0;
  let eventsWithTotals = 0;

  for (const event of events) {
    const normalizedEvent = normalizeEvent(event);
    
    // Detect spread arbs
    const eventSpreadArbs = findSpreadArbs(event, normalizedEvent, nearArbThreshold);
    spreadArbs.push(...eventSpreadArbs.arbs);
    if (eventSpreadArbs.arbs.length > 0 || eventSpreadArbs.hasData) {
      eventsWithSpreads++;
    }
    middles.push(...eventSpreadArbs.middles);

    // Detect totals arbs
    const eventTotalsArbs = findTotalsArbs(event, normalizedEvent, nearArbThreshold);
    totalsArbs.push(...eventTotalsArbs.arbs);
    if (eventTotalsArbs.arbs.length > 0 || eventTotalsArbs.hasData) {
      eventsWithTotals++;
    }
    middles.push(...eventTotalsArbs.middles);
  }

  // Sort by profit
  spreadArbs.sort((a, b) => b.profitPercentage - a.profitPercentage);
  totalsArbs.sort((a, b) => b.profitPercentage - a.profitPercentage);
  middles.sort((a, b) => b.expectedValue - a.expectedValue);

  const stats: LineStats = {
    totalEvents: events.length,
    spreadArbsFound: spreadArbs.filter(a => a.type === 'arb').length,
    totalsArbsFound: totalsArbs.filter(a => a.type === 'arb').length,
    middlesFound: middles.length,
    nearArbsFound: 
      spreadArbs.filter(a => a.type === 'near-arb').length +
      totalsArbs.filter(a => a.type === 'near-arb').length,
  };

  return { spreadArbs, totalsArbs, middles, stats };
}

interface SpreadResult {
  arbs: SpreadArb[];
  middles: MiddleOpportunity[];
  hasData: boolean;
}

/**
 * Find spread/line arbs within a single event
 */
function findSpreadArbs(
  event: SportEvent,
  normalizedEvent: NormalizedEvent,
  nearArbThreshold: number
): SpreadResult {
  const arbs: SpreadArb[] = [];
  const middles: MiddleOpportunity[] = [];
  let hasData = false;

  // Collect all spread outcomes grouped by line
  // Structure: { lineValue: { teamName: [{ bookmaker, odds, point }] } }
  const spreadsByLine = new Map<number, Map<string, { bookmaker: string; odds: number; point: number; lastUpdate: Date }[]>>();

  for (const bm of event.bookmakers) {
    const spreadMarket = bm.markets.find(m => m.key === 'spreads');
    if (!spreadMarket) continue;
    hasData = true;

    for (const outcome of spreadMarket.outcomes) {
      if (outcome.point === undefined) continue;

      const lineKey = Math.abs(outcome.point); // Use absolute value as key
      
      if (!spreadsByLine.has(lineKey)) {
        spreadsByLine.set(lineKey, new Map());
      }
      
      const lineMap = spreadsByLine.get(lineKey)!;
      const teamOdds = lineMap.get(outcome.name) || [];
      teamOdds.push({
        bookmaker: bm.bookmaker.title,
        odds: outcome.price,
        point: outcome.point,
        lastUpdate: spreadMarket.lastUpdate,
      });
      lineMap.set(outcome.name, teamOdds);
    }
  }

  // Check each line for arbs
  for (const [line, teamMap] of spreadsByLine) {
    const teams = Array.from(teamMap.keys());
    if (teams.length !== 2) continue;

    const team1Odds = teamMap.get(teams[0])!;
    const team2Odds = teamMap.get(teams[1])!;

    // Find best odds for each side AT THE SAME LINE
    const best1 = team1Odds.reduce((a, b) => a.odds > b.odds ? a : b);
    const best2 = team2Odds.reduce((a, b) => a.odds > b.odds ? a : b);

    // Only valid if they're opposite sides of same line
    if (Math.abs(best1.point) !== Math.abs(best2.point)) continue;
    if (Math.sign(best1.point) === Math.sign(best2.point)) continue;

    const impliedSum = (1 / best1.odds) + (1 / best2.odds);
    const profitPct = ((1 / impliedSum) - 1) * 100;

    if (profitPct >= -nearArbThreshold) {
      const type: OpportunityType = profitPct >= 0 ? 'arb' : 'near-arb';
      
      // Determine favorite/underdog
      const favorite = best1.point < 0 ? { name: teams[0], ...best1 } : { name: teams[1], ...best2 };
      const underdog = best1.point > 0 ? { name: teams[0], ...best1 } : { name: teams[1], ...best2 };

      arbs.push({
        mode: 'spread',
        type,
        event: normalizedEvent,
        marketType: 'spreads',
        line,
        favorite: {
          name: favorite.name,
          bookmaker: favorite.bookmaker,
          odds: favorite.odds,
          point: favorite.point,
        },
        underdog: {
          name: underdog.name,
          bookmaker: underdog.bookmaker,
          odds: underdog.odds,
          point: underdog.point,
        },
        impliedProbabilitySum: impliedSum,
        profitPercentage: profitPct,
        lastUpdated: new Date(Math.max(best1.lastUpdate.getTime(), best2.lastUpdate.getTime())),
      });
    }
  }

  // Check for middles (different lines across bookies)
  const allLines = Array.from(spreadsByLine.keys()).sort((a, b) => a - b);
  
  for (let i = 0; i < allLines.length; i++) {
    for (let j = i + 1; j < allLines.length; j++) {
      const line1 = allLines[i];
      const line2 = allLines[j];
      
      // Lines must be different by at least 1 point to have a middle
      if (line2 - line1 < 1) continue;

      const teamMap1 = spreadsByLine.get(line1)!;
      const teamMap2 = spreadsByLine.get(line2)!;

      const teams = Array.from(teamMap1.keys());
      if (teams.length !== 2) continue;

      // For a middle on spreads:
      // Back the underdog at the HIGHER line (e.g., +6.5)
      // Back the favorite at the LOWER line (e.g., -3.5)
      // If favorite wins by 4, 5, or 6, both bets win!
      
      const team1AtLine1 = teamMap1.get(teams[0]);
      const team2AtLine1 = teamMap1.get(teams[1]);
      const team1AtLine2 = teamMap2.get(teams[0]);
      const team2AtLine2 = teamMap2.get(teams[1]);

      if (!team1AtLine1 || !team2AtLine1 || !team1AtLine2 || !team2AtLine2) continue;

      // Find the underdog bet at higher line and favorite bet at lower line
      const underdogAtHighLine = [...team1AtLine2, ...team2AtLine2]
        .filter(o => o.point > 0)
        .reduce((a, b) => !a || b.odds > a.odds ? b : a, null as any);
      
      const favoriteAtLowLine = [...team1AtLine1, ...team2AtLine1]
        .filter(o => o.point < 0)
        .reduce((a, b) => !a || b.odds > a.odds ? b : a, null as any);

      if (!underdogAtHighLine || !favoriteAtLowLine) continue;

      // Calculate middle opportunity
      const middleLow = Math.abs(favoriteAtLowLine.point);
      const middleHigh = underdogAtHighLine.point;
      const middleSize = middleHigh - middleLow;

      if (middleSize <= 0) continue;

      // Rough probability estimate (very simplified)
      // Real probability depends on sport, spread size, etc.
      const middleProbability = Math.min(30, middleSize * 5); // ~5% per point of middle

      // Calculate returns and losses
      const stake = 100; // Assume $100 each side
      const totalStake = stake * 2;
      
      // If middle hits: both win
      const returnIfMiddle = (stake * underdogAtHighLine.odds) + (stake * favoriteAtLowLine.odds);
      const profitIfMiddle = returnIfMiddle - totalStake;
      
      // If middle misses: one wins, one loses
      const returnIfMiss = stake * Math.max(underdogAtHighLine.odds, favoriteAtLowLine.odds);
      const lossIfMiss = totalStake - returnIfMiss;

      // Expected value
      const ev = (middleProbability / 100 * profitIfMiddle) - ((100 - middleProbability) / 100 * lossIfMiss);

      // Only include if EV is positive or loss is small
      if (ev > -10 || lossIfMiss < 10) {
        const favTeam = teams.find(t => 
          teamMap1.get(t)?.some(o => o.point < 0) || 
          teamMap2.get(t)?.some(o => o.point < 0)
        ) || teams[0];

        middles.push({
          mode: 'middle',
          type: 'middle',
          event: normalizedEvent,
          marketType: 'spreads',
          side1: {
            name: favTeam,
            bookmaker: favoriteAtLowLine.bookmaker,
            odds: favoriteAtLowLine.odds,
            point: favoriteAtLowLine.point,
          },
          side2: {
            name: teams.find(t => t !== favTeam) || teams[1],
            bookmaker: underdogAtHighLine.bookmaker,
            odds: underdogAtHighLine.odds,
            point: underdogAtHighLine.point,
          },
          middleRange: {
            low: middleLow,
            high: middleHigh,
            description: `${favTeam} wins by ${middleLow + 1} to ${middleHigh}`,
          },
          guaranteedLoss: lossIfMiss,
          potentialProfit: profitIfMiddle,
          middleProbability,
          expectedValue: ev,
          lastUpdated: new Date(),
        });
      }
    }
  }

  return { arbs, middles, hasData };
}

interface TotalsResult {
  arbs: TotalsArb[];
  middles: MiddleOpportunity[];
  hasData: boolean;
}

/**
 * Find totals/over-under arbs within a single event
 */
function findTotalsArbs(
  event: SportEvent,
  normalizedEvent: NormalizedEvent,
  nearArbThreshold: number
): TotalsResult {
  const arbs: TotalsArb[] = [];
  const middles: MiddleOpportunity[] = [];
  let hasData = false;

  // Collect all totals outcomes grouped by line
  const totalsByLine = new Map<number, { 
    over: { bookmaker: string; odds: number; point: number; lastUpdate: Date }[];
    under: { bookmaker: string; odds: number; point: number; lastUpdate: Date }[];
  }>();

  for (const bm of event.bookmakers) {
    const totalsMarket = bm.markets.find(m => m.key === 'totals');
    if (!totalsMarket) continue;
    hasData = true;

    for (const outcome of totalsMarket.outcomes) {
      if (outcome.point === undefined) continue;

      const line = outcome.point;
      const isOver = outcome.name.toLowerCase().includes('over');
      
      if (!totalsByLine.has(line)) {
        totalsByLine.set(line, { over: [], under: [] });
      }
      
      const lineData = totalsByLine.get(line)!;
      const entry = {
        bookmaker: bm.bookmaker.title,
        odds: outcome.price,
        point: line,
        lastUpdate: totalsMarket.lastUpdate,
      };

      if (isOver) {
        lineData.over.push(entry);
      } else {
        lineData.under.push(entry);
      }
    }
  }

  // Check each line for arbs
  for (const [line, { over, under }] of totalsByLine) {
    if (over.length === 0 || under.length === 0) continue;

    const bestOver = over.reduce((a, b) => a.odds > b.odds ? a : b);
    const bestUnder = under.reduce((a, b) => a.odds > b.odds ? a : b);

    const impliedSum = (1 / bestOver.odds) + (1 / bestUnder.odds);
    const profitPct = ((1 / impliedSum) - 1) * 100;

    if (profitPct >= -nearArbThreshold) {
      const type: OpportunityType = profitPct >= 0 ? 'arb' : 'near-arb';

      arbs.push({
        mode: 'totals',
        type,
        event: normalizedEvent,
        marketType: 'totals',
        line,
        over: {
          bookmaker: bestOver.bookmaker,
          odds: bestOver.odds,
          point: bestOver.point,
        },
        under: {
          bookmaker: bestUnder.bookmaker,
          odds: bestUnder.odds,
          point: bestUnder.point,
        },
        impliedProbabilitySum: impliedSum,
        profitPercentage: profitPct,
        lastUpdated: new Date(Math.max(bestOver.lastUpdate.getTime(), bestUnder.lastUpdate.getTime())),
      });
    }
  }

  // Check for totals middles (different lines)
  const allLines = Array.from(totalsByLine.keys()).sort((a, b) => a - b);
  
  for (let i = 0; i < allLines.length; i++) {
    for (let j = i + 1; j < allLines.length; j++) {
      const lowLine = allLines[i];
      const highLine = allLines[j];
      
      if (highLine - lowLine < 0.5) continue;

      const lowData = totalsByLine.get(lowLine)!;
      const highData = totalsByLine.get(highLine)!;

      // For a totals middle:
      // Back Over at the LOW line
      // Back Under at the HIGH line
      // If total lands between, both win!

      const bestOverLow = lowData.over.length > 0 
        ? lowData.over.reduce((a, b) => a.odds > b.odds ? a : b)
        : null;
      const bestUnderHigh = highData.under.length > 0
        ? highData.under.reduce((a, b) => a.odds > b.odds ? a : b)
        : null;

      if (!bestOverLow || !bestUnderHigh) continue;

      const middleSize = highLine - lowLine;
      const middleProbability = Math.min(25, middleSize * 8);

      const stake = 100;
      const totalStake = stake * 2;
      
      const returnIfMiddle = (stake * bestOverLow.odds) + (stake * bestUnderHigh.odds);
      const profitIfMiddle = returnIfMiddle - totalStake;
      
      const returnIfMiss = stake * Math.max(bestOverLow.odds, bestUnderHigh.odds);
      const lossIfMiss = totalStake - returnIfMiss;

      const ev = (middleProbability / 100 * profitIfMiddle) - ((100 - middleProbability) / 100 * lossIfMiss);

      if (ev > -10 || lossIfMiss < 10) {
        middles.push({
          mode: 'middle',
          type: 'middle',
          event: normalizedEvent,
          marketType: 'totals',
          side1: {
            name: `Over ${lowLine}`,
            bookmaker: bestOverLow.bookmaker,
            odds: bestOverLow.odds,
            point: lowLine,
          },
          side2: {
            name: `Under ${highLine}`,
            bookmaker: bestUnderHigh.bookmaker,
            odds: bestUnderHigh.odds,
            point: highLine,
          },
          middleRange: {
            low: lowLine,
            high: highLine,
            description: `Total lands between ${lowLine} and ${highLine}`,
          },
          guaranteedLoss: lossIfMiss,
          potentialProfit: profitIfMiddle,
          middleProbability,
          expectedValue: ev,
          lastUpdated: new Date(),
        });
      }
    }
  }

  return { arbs, middles, hasData };
}