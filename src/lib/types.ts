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
export type OpportunityType = 'arb' | 'near-arb' | 'value-bet';
export type ArbMode = 'book-vs-book' | 'book-vs-betfair';

export interface BookVsBookArb {
  mode: 'book-vs-book';
  type: OpportunityType;
  event: NormalizedEvent;
  marketType: string; // 'h2h' for 2-way, 'h2h-3way' for soccer
  outcomes: number; // 2 or 3
  outcome1: {
    name: string;
    bookmaker: string;
    odds: number;
  };
  outcome2: {
    name: string;
    bookmaker: string;
    odds: number;
  };
  outcome3?: { // For 3-way markets (soccer)
    name: string;
    bookmaker: string;
    odds: number;
  };
  impliedProbabilitySum: number;
  profitPercentage: number; // Positive = profit, negative = loss (near-arb)
  lastUpdated: Date;
}

export interface BookVsBetfairArb {
  mode: 'book-vs-betfair';
  type: OpportunityType;
  event: NormalizedEvent;
  marketType: string;
  backOutcome: {
    name: string;
    bookmaker: string;
    odds: number;
  };
  layOutcome: {
    name: string;
    odds: number;
    availableLiquidity?: number;
  };
  profitPercentage: number;
  commission: number;
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
    odds: number;
  };
  marketAverage: number;
  valuePercentage: number; // How much better than market average
  allOdds: { bookmaker: string; odds: number }[];
  lastUpdated: Date;
}

// Best odds for an event
export interface BestOdds {
  event: NormalizedEvent;
  outcomes: {
    name: string;
    bestOdds: number;
    bestBookmaker: string;
    allOdds: { bookmaker: string; odds: number }[];
    marketAverage: number;
  }[];
}

export type ArbOpportunity = BookVsBookArb | BookVsBetfairArb;
export type Opportunity = ArbOpportunity | ValueBet;

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
