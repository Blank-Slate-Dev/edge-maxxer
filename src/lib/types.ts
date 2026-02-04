// src/lib/types.ts
// Core domain types for the arbitrage system

export interface Bookmaker {
  key: string;
  title: string;
  lastUpdate: Date;
}

export interface Outcome {
  name: string;
  price: number; // Decimal odds
  point?: number; // For spreads/totals
}

export interface Market {
  key: string; // e.g., 'h2h', 'spreads', 'totals'
  lastUpdate: Date;
  outcomes: Outcome[];
}

export interface BookmakerOdds {
  bookmaker: Bookmaker;
  markets: Market[];
}

export interface SportEvent {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: Date;
  homeTeam: string;
  awayTeam: string;
  bookmakers: BookmakerOdds[];
}

export interface NormalizedEvent {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: Date;
  homeTeam: string;
  awayTeam: string;
  normalizedHome: string;
  normalizedAway: string;
}

// Opportunity types
export type OpportunityType = 'arb' | 'near-arb' | 'value-bet' | 'middle';
export type ArbMode = 'book-vs-book' | 'book-vs-betfair';
export type MarketType = 'h2h' | 'spreads' | 'totals';

// Individual alternative bookmaker odds for the swap feature
export interface AlternativeOdds {
  bookmaker: string;      // Display name
  bookmakerKey: string;   // API key
  odds: number;
}

// Shared outcome type with bookmaker key for region filtering
export interface ArbOutcome {
  name: string;
  bookmaker: string; // Display name for UI
  bookmakerKey: string; // API key for filtering
  odds: number;
  // All bookmakers offering odds on this same outcome, sorted best-to-worst.
  // The first entry matches the selected bookmaker/odds above.
  // Used by the StakeCalculatorModal for the bookmaker swap feature.
  alternativeOdds?: AlternativeOdds[];
}

export interface ArbOutcomeWithPoint extends ArbOutcome {
  point: number;
}

export interface BookVsBookArb {
  mode: 'book-vs-book';
  type: OpportunityType;
  event: NormalizedEvent;
  marketType: string; // 'h2h' for 2-way, 'h2h-3way' for soccer
  outcomes: number; // 2 or 3
  outcome1: ArbOutcome;
  outcome2: ArbOutcome;
  outcome3?: ArbOutcome; // For 3-way markets (soccer)
  impliedProbabilitySum: number;
  profitPercentage: number; // Positive = profit, negative = loss (near-arb)
  lastUpdated: Date;
}

export interface BookVsBetfairArb {
  mode: 'book-vs-betfair';
  type: OpportunityType;
  event: NormalizedEvent;
  marketType: string;
  backOutcome: ArbOutcome;
  layOutcome: {
    name: string;
    odds: number;
    availableLiquidity?: number;
  };
  profitPercentage: number;
  commission: number;
  lastUpdated: Date;
}

// Spread/Line Arb - when same line across different bookies creates arb
export interface SpreadArb {
  mode: 'spread';
  type: OpportunityType;
  event: NormalizedEvent;
  marketType: 'spreads';
  line: number; // The spread line (e.g., -6.5)
  favorite: ArbOutcomeWithPoint;
  underdog: ArbOutcomeWithPoint;
  impliedProbabilitySum: number;
  profitPercentage: number;
  lastUpdated: Date;
}

// Middle opportunity - when different lines create win-win zone
export interface MiddleOpportunity {
  mode: 'middle';
  type: 'middle';
  event: NormalizedEvent;
  marketType: 'spreads' | 'totals';
  side1: ArbOutcomeWithPoint;
  side2: ArbOutcomeWithPoint;
  middleRange: {
    low: number;
    high: number;
    description: string; // e.g., "Team A wins by 4, 5, or 6"
  };
  guaranteedLoss: number; // Max loss if middle doesn't hit
  potentialProfit: number; // Profit if middle hits
  middleProbability: number; // Estimated % chance of hitting middle
  expectedValue: number; // EV of the play
  lastUpdated: Date;
}

// Totals Arb - same as spread but for over/under
export interface TotalsArb {
  mode: 'totals';
  type: OpportunityType;
  event: NormalizedEvent;
  marketType: 'totals';
  line: number; // The total line (e.g., 42.5)
  over: {
    bookmaker: string;
    bookmakerKey: string;
    odds: number;
    point: number;
  };
  under: {
    bookmaker: string;
    bookmakerKey: string;
    odds: number;
    point: number;
  };
  impliedProbabilitySum: number;
  profitPercentage: number;
  lastUpdated: Date;
}

// Value bet - when one bookmaker has significantly better odds
export interface ValueBet {
  mode: 'value-bet';
  type: 'value-bet';
  event: NormalizedEvent;
  marketType: string;
  outcome: {
    name: string;
    bookmaker: string;
    bookmakerKey: string;
    odds: number;
  };
  marketAverage: number;
  valuePercentage: number; // How much better than market average
  allOdds: { bookmaker: string; bookmakerKey: string; odds: number }[];
  lastUpdated: Date;
}

// Best odds for an event
export interface BestOdds {
  event: NormalizedEvent;
  outcomes: {
    name: string;
    bestOdds: number;
    bestBookmaker: string;
    bestBookmakerKey: string;
    allOdds: { bookmaker: string; bookmakerKey: string; odds: number }[];
    marketAverage: number;
  }[];
}

export type ArbOpportunity = BookVsBookArb | BookVsBetfairArb;
export type LineOpportunity = SpreadArb | TotalsArb | MiddleOpportunity;
export type Opportunity = ArbOpportunity | ValueBet | LineOpportunity;

// Stake calculation types
export interface BookVsBookStakes {
  totalStake: number;
  stake1: number;
  stake2: number;
  stake3?: number; // For 3-way markets
  guaranteedProfit: number;
  profitPercentage: number;
  returnOnOutcome1: number;
  returnOnOutcome2: number;
  returnOnOutcome3?: number; // For 3-way markets
}

export interface ThreeWayStakes {
  totalStake: number;
  stake1: number;
  stake2: number;
  stake3: number;
  guaranteedProfit: number;
  profitPercentage: number;
  returnOnAnyOutcome: number;
}

export interface BookVsBetfairStakes {
  backStake: number;
  layStake: number;
  layLiability: number;
  commission: number;
  profitIfBackWins: number;
  profitIfLayWins: number;
  guaranteedProfit: number;
  profitPercentage: number;
}

export interface LineStakes {
  totalStake: number;
  stake1: number;
  stake2: number;
  guaranteedProfit: number;
  profitPercentage: number;
  returnOnSide1: number;
  returnOnSide2: number;
}

// Filter types
export interface ArbFilters {
  minProfit: number;
  sports: string[];
  bookmakers: string[];
  maxHoursUntilStart: number;
  mode: ArbMode | 'all';
  showNearArbs: boolean;
  showValueBets: boolean;
  profitableOnly: boolean;
}

export interface LineFilters {
  minProfit: number;
  sports: string[];
  bookmakers: string[];
  maxHoursUntilStart: number;
  showNearArbs: boolean;
  showMiddles: boolean;
  profitableOnly: boolean;
}

// API response types
export interface OddsApiResponse {
  events: SportEvent[];
  remainingRequests: number;
  usedRequests: number;
}

export interface ArbsApiResponse {
  opportunities: ArbOpportunity[];
  valueBets: ValueBet[];
  bestOdds: BestOdds[];
  lastUpdated: Date;
  isUsingMockData: boolean;
}

// Stats
export interface ScanStats {
  totalEvents: number;
  eventsWithMultipleBookmakers: number;
  totalBookmakers: number;
  arbsFound: number;
  nearArbsFound: number;
  valueBetsFound: number;
  sportsScanned: number;
}

export interface LineStats {
  totalEvents: number;
  spreadArbsFound: number;
  totalsArbsFound: number;
  middlesFound: number;
  nearArbsFound: number;
}
