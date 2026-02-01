// src/lib/arb/detector.ts
import type {
  SportEvent,
  BookVsBookArb,
  BookVsBetfairArb,
  ArbOpportunity,
  NormalizedEvent,
  ValueBet,
  BestOdds,
  OpportunityType,
  ScanStats,
} from '../types';
import { normalizeEvent, findMatchingOutcome } from '../normalization/eventMatcher';
import { config } from '../config';

interface DetectionResult {
  arbs: BookVsBookArb[];
  valueBets: ValueBet[];
  bestOdds: BestOdds[];
  stats: ScanStats;
}

// Sports that ALWAYS use 2-way markets (draw is never offered)
// Note: Boxing and MMA CAN have draws, so they're NOT in this list
const ALWAYS_TWO_WAY_SPORTS = [
  'tennis',        // No draws in tennis
  'basketball',    // No draws (OT until winner)
  'baseball',      // No draws (extra innings)
  'americanfootball', // No draws (OT rules)
  'aussierules',   // AFL has no draws
];

// Sports that MIGHT be 2-way or 3-way depending on market
// These sports CAN have draws but some bookmakers only offer 2-way
const FLEXIBLE_SPORTS = [
  'icehockey',     // Can be 2-way (with OT) or 3-way (regulation time)
  'mma',           // Usually 2-way but draws are possible
  'boxing',        // Usually 3-way (Win/Win/Draw) but some offer 2-way
  'cricket',       // Depends on format
  'rugbyleague',   // Can have draws
  'rugbyunion',    // Can have draws
];

/**
 * Determines if a sport MUST be 2-way (no draw ever possible)
 */
function isAlwaysTwoWaySport(sportKey: string): boolean {
  return ALWAYS_TWO_WAY_SPORTS.some(s => sportKey.toLowerCase().includes(s));
}

/**
 * Determines if a sport can flexibly be 2-way or 3-way
 */
function isFlexibleSport(sportKey: string): boolean {
  return FLEXIBLE_SPORTS.some(s => sportKey.toLowerCase().includes(s));
}

// Internal type for tracking odds with bookmaker key
interface TrackedOdds {
  bookmaker: string; // Display title
  bookmakerKey: string; // API key for filtering
  odds: number;
  lastUpdate: Date;
}

/**
 * Comprehensive detection of all opportunity types
 */
export function detectAllOpportunities(
  events: SportEvent[],
  nearArbThreshold: number = config.filters.nearArbThreshold,
  valueThreshold: number = config.filters.valueThreshold
): DetectionResult {
  const arbs: BookVsBookArb[] = [];
  const valueBets: ValueBet[] = [];
  const bestOdds: BestOdds[] = [];

  let eventsWithMultipleBookmakers = 0;
  const allBookmakers = new Set<string>();
  const sportsSet = new Set<string>();

  for (const event of events) {
    sportsSet.add(event.sportKey);
    
    // Track bookmakers
    event.bookmakers.forEach(b => allBookmakers.add(b.bookmaker.key));

    if (event.bookmakers.length >= 2) {
      eventsWithMultipleBookmakers++;
    }

    const normalizedEvent = normalizeEvent(event);

    // Find arbs and near-arbs
    const eventArbs = findArbitrageInEvent(event, normalizedEvent, nearArbThreshold);
    arbs.push(...eventArbs);

    // Find value bets
    const eventValueBets = findValueBets(event, normalizedEvent, valueThreshold);
    valueBets.push(...eventValueBets);

    // Find best odds
    const eventBestOdds = findBestOdds(event, normalizedEvent);
    if (eventBestOdds) {
      bestOdds.push(eventBestOdds);
    }
  }

  // Sort by profit/value
  arbs.sort((a, b) => b.profitPercentage - a.profitPercentage);
  valueBets.sort((a, b) => b.valuePercentage - a.valuePercentage);

  const stats: ScanStats = {
    totalEvents: events.length,
    eventsWithMultipleBookmakers,
    totalBookmakers: allBookmakers.size,
    arbsFound: arbs.filter(a => a.type === 'arb').length,
    nearArbsFound: arbs.filter(a => a.type === 'near-arb').length,
    valueBetsFound: valueBets.length,
    sportsScanned: sportsSet.size,
  };

  console.log(`[Detector] Stats:`, stats);

  return { arbs, valueBets, bestOdds, stats };
}

/**
 * Detects Book vs Book arbitrage and near-arbitrage opportunities
 */
export function detectBookVsBookArbs(
  events: SportEvent[],
  nearArbThreshold: number = config.filters.nearArbThreshold
): BookVsBookArb[] {
  const result = detectAllOpportunities(events, nearArbThreshold);
  return result.arbs;
}

/**
 * Finds arbitrage opportunities within a single event
 * Handles both 2-way (tennis, basketball) and 3-way (soccer, boxing) markets
 */
function findArbitrageInEvent(
  event: SportEvent,
  normalizedEvent: NormalizedEvent,
  nearArbThreshold: number
): BookVsBookArb[] {
  const arbs: BookVsBookArb[] = [];
  const bookmakers = event.bookmakers;

  if (bookmakers.length < 2) return arbs;

  // Collect all h2h outcomes from all bookmakers - now tracking key AND title
  const outcomesByName = new Map<string, TrackedOdds[]>();

  for (const bm of bookmakers) {
    const h2hMarket = bm.markets.find(m => m.key === 'h2h');
    if (!h2hMarket) continue;

    for (const outcome of h2hMarket.outcomes) {
      const existing = outcomesByName.get(outcome.name) || [];
      existing.push({
        bookmaker: bm.bookmaker.title, // Display name for UI
        bookmakerKey: bm.bookmaker.key, // API key for filtering
        odds: outcome.price,
        lastUpdate: h2hMarket.lastUpdate,
      });
      outcomesByName.set(outcome.name, existing);
    }
  }

  const outcomeNames = Array.from(outcomesByName.keys());
  const numOutcomes = outcomeNames.length;

  // Determine sport type
  const isAlwaysTwoWay = isAlwaysTwoWaySport(event.sportKey);
  const isFlexible = isFlexibleSport(event.sportKey);
  const isSoccer = event.sportKey.toLowerCase().includes('soccer');

  // Validation based on sport type
  if (isAlwaysTwoWay) {
    // Sports like tennis, basketball MUST have exactly 2 outcomes
    if (numOutcomes !== 2) {
      return arbs;
    }
  } else if (isSoccer) {
    // Soccer MUST have 3 outcomes (Home/Draw/Away)
    if (numOutcomes !== 3) {
      console.log(`[Detector] Skipping ${event.homeTeam} vs ${event.awayTeam} - soccer with ${numOutcomes} outcomes (needs 3)`);
      return arbs;
    }
  } else if (isFlexible) {
    // Boxing, MMA, etc - accept 2 OR 3 outcomes
    if (numOutcomes < 2 || numOutcomes > 3) {
      return arbs;
    }
    // Log when we find a 3-way boxing/mma event
    if (numOutcomes === 3) {
      console.log(`[Detector] Found 3-way market for ${event.sportKey}: ${event.homeTeam} vs ${event.awayTeam}`);
    }
  } else {
    // Other sports - be flexible
    if (numOutcomes < 2 || numOutcomes > 3) {
      return arbs;
    }
  }

  // Find best odds for each outcome
  const bestOddsByOutcome = new Map<string, TrackedOdds>();
  
  for (const [name, odds] of outcomesByName) {
    const best = odds.reduce((a, b) => a.odds > b.odds ? a : b);
    bestOddsByOutcome.set(name, best);
  }

  // Calculate implied probability sum using ALL outcomes
  let impliedSum = 0;
  const bestOutcomes: { name: string; bookmaker: string; bookmakerKey: string; odds: number; lastUpdate: Date }[] = [];
  
  for (const [name, best] of bestOddsByOutcome) {
    impliedSum += 1 / best.odds;
    bestOutcomes.push({ name, bookmaker: best.bookmaker, bookmakerKey: best.bookmakerKey, odds: best.odds, lastUpdate: best.lastUpdate });
  }

  // Check for arbitrage
  const profitPct = ((1 / impliedSum) - 1) * 100;

  // Only include if it's profitable OR within near-arb threshold
  if (profitPct >= -nearArbThreshold) {
    const type: OpportunityType = profitPct >= 0 ? 'arb' : 'near-arb';
    
    // For 2-way markets
    if (numOutcomes === 2) {
      arbs.push({
        mode: 'book-vs-book',
        type,
        event: normalizedEvent,
        marketType: 'h2h',
        outcomes: numOutcomes,
        outcome1: {
          name: bestOutcomes[0].name,
          bookmaker: bestOutcomes[0].bookmaker,
          bookmakerKey: bestOutcomes[0].bookmakerKey,
          odds: bestOutcomes[0].odds,
        },
        outcome2: {
          name: bestOutcomes[1].name,
          bookmaker: bestOutcomes[1].bookmaker,
          bookmakerKey: bestOutcomes[1].bookmakerKey,
          odds: bestOutcomes[1].odds,
        },
        impliedProbabilitySum: impliedSum,
        profitPercentage: profitPct,
        lastUpdated: new Date(Math.max(...bestOutcomes.map(o => o.lastUpdate.getTime()))),
      });
    }
    // For 3-way markets (soccer, boxing with draw, etc.)
    else if (numOutcomes === 3) {
      arbs.push({
        mode: 'book-vs-book',
        type,
        event: normalizedEvent,
        marketType: 'h2h-3way',
        outcomes: numOutcomes,
        outcome1: {
          name: bestOutcomes[0].name,
          bookmaker: bestOutcomes[0].bookmaker,
          bookmakerKey: bestOutcomes[0].bookmakerKey,
          odds: bestOutcomes[0].odds,
        },
        outcome2: {
          name: bestOutcomes[1].name,
          bookmaker: bestOutcomes[1].bookmaker,
          bookmakerKey: bestOutcomes[1].bookmakerKey,
          odds: bestOutcomes[1].odds,
        },
        outcome3: {
          name: bestOutcomes[2].name,
          bookmaker: bestOutcomes[2].bookmaker,
          bookmakerKey: bestOutcomes[2].bookmakerKey,
          odds: bestOutcomes[2].odds,
        },
        impliedProbabilitySum: impliedSum,
        profitPercentage: profitPct,
        lastUpdated: new Date(Math.max(...bestOutcomes.map(o => o.lastUpdate.getTime()))),
      });
    }
  }

  return arbs;
}

/**
 * Finds value bets - when one bookmaker has significantly better odds
 */
function findValueBets(
  event: SportEvent,
  normalizedEvent: NormalizedEvent,
  valueThreshold: number
): ValueBet[] {
  const valueBets: ValueBet[] = [];
  const bookmakers = event.bookmakers;

  if (bookmakers.length < 3) return valueBets; // Need enough for a meaningful average

  // Collect all odds for each outcome - tracking key and title
  const oddsByOutcome = new Map<string, { bookmaker: string; bookmakerKey: string; odds: number }[]>();

  for (const bm of bookmakers) {
    const h2hMarket = bm.markets.find(m => m.key === 'h2h');
    if (!h2hMarket) continue;

    for (const outcome of h2hMarket.outcomes) {
      const existing = oddsByOutcome.get(outcome.name) || [];
      existing.push({ 
        bookmaker: bm.bookmaker.title, 
        bookmakerKey: bm.bookmaker.key,
        odds: outcome.price 
      });
      oddsByOutcome.set(outcome.name, existing);
    }
  }

  // Check each outcome for value
  for (const [outcomeName, allOdds] of oddsByOutcome) {
    if (allOdds.length < 3) continue;

    // Calculate market average (excluding the best)
    const sortedOdds = [...allOdds].sort((a, b) => b.odds - a.odds);
    const best = sortedOdds[0];
    const rest = sortedOdds.slice(1);
    const average = rest.reduce((sum, o) => sum + o.odds, 0) / rest.length;

    // Calculate value percentage
    const valuePct = ((best.odds - average) / average) * 100;

    if (valuePct >= valueThreshold) {
      valueBets.push({
        mode: 'value-bet',
        type: 'value-bet',
        event: normalizedEvent,
        marketType: 'h2h',
        outcome: {
          name: outcomeName,
          bookmaker: best.bookmaker,
          bookmakerKey: best.bookmakerKey,
          odds: best.odds,
        },
        marketAverage: average,
        valuePercentage: valuePct,
        allOdds: sortedOdds,
        lastUpdated: new Date(),
      });
    }
  }

  return valueBets;
}

/**
 * Finds best odds for each outcome in an event
 */
function findBestOdds(
  event: SportEvent,
  normalizedEvent: NormalizedEvent
): BestOdds | null {
  if (event.bookmakers.length === 0) return null;

  const oddsByOutcome = new Map<string, { bookmaker: string; bookmakerKey: string; odds: number }[]>();

  for (const bm of event.bookmakers) {
    const h2hMarket = bm.markets.find(m => m.key === 'h2h');
    if (!h2hMarket) continue;

    for (const outcome of h2hMarket.outcomes) {
      const existing = oddsByOutcome.get(outcome.name) || [];
      existing.push({ 
        bookmaker: bm.bookmaker.title, 
        bookmakerKey: bm.bookmaker.key,
        odds: outcome.price 
      });
      oddsByOutcome.set(outcome.name, existing);
    }
  }

  const outcomes = Array.from(oddsByOutcome.entries()).map(([name, allOdds]) => {
    const sorted = [...allOdds].sort((a, b) => b.odds - a.odds);
    const best = sorted[0];
    const average = allOdds.reduce((sum, o) => sum + o.odds, 0) / allOdds.length;

    return {
      name,
      bestOdds: best.odds,
      bestBookmaker: best.bookmaker,
      bestBookmakerKey: best.bookmakerKey,
      allOdds: sorted,
      marketAverage: average,
    };
  });

  return {
    event: normalizedEvent,
    outcomes,
  };
}

/**
 * Detects Book vs Betfair lay arbitrage opportunities
 */
export function detectBookVsBetfairArbs(
  events: SportEvent[],
  betfairOdds: Map<string, { layOdds: number; liquidity: number }>,
  commission: number = 0.05
): BookVsBetfairArb[] {
  const arbs: BookVsBetfairArb[] = [];

  for (const event of events) {
    const normalizedEvent = normalizeEvent(event);
    
    for (const bm of event.bookmakers) {
      const h2hMarket = bm.markets.find(m => m.key === 'h2h');
      if (!h2hMarket) continue;

      for (const outcome of h2hMarket.outcomes) {
        const betfairKey = `${event.id}-${outcome.name}`;
        const betfair = betfairOdds.get(betfairKey);
        
        if (!betfair) continue;

        const backOdds = outcome.price;
        const layOdds = betfair.layOdds;
        
        const effectiveLayReturn = (layOdds - 1) * (1 - commission);
        const backReturn = backOdds - 1;
        
        if (backReturn > effectiveLayReturn) {
          const profitPct = ((backReturn - effectiveLayReturn) / backOdds) * 100;
          
          arbs.push({
            mode: 'book-vs-betfair',
            type: 'arb',
            event: normalizedEvent,
            marketType: 'h2h',
            backOutcome: {
              name: outcome.name,
              bookmaker: bm.bookmaker.title,
              bookmakerKey: bm.bookmaker.key,
              odds: backOdds,
            },
            layOutcome: {
              name: outcome.name,
              odds: layOdds,
              availableLiquidity: betfair.liquidity,
            },
            profitPercentage: profitPct,
            commission,
            lastUpdated: h2hMarket.lastUpdate,
          });
        }
      }
    }
  }

  return arbs.sort((a, b) => b.profitPercentage - a.profitPercentage);
}
