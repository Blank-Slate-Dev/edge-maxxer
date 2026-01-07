// src/lib/providers/types.ts
import { z } from 'zod';
import type { SportEvent, NormalizedEvent } from '../types';

// Provider interface - all odds providers must implement this
export interface OddsProvider {
  name: string;
  fetchOdds(sports: string[]): Promise<ProviderResult>;
  getSupportedSports(): Promise<Sport[]>;
}

export interface ProviderResult {
  events: SportEvent[];
  meta: {
    remainingRequests?: number;
    usedRequests?: number;
    source: string;
    errors?: string[];
  };
}

export interface Sport {
  key: string;
  title: string;
  group: string;
  active: boolean;
  hasOutrights?: boolean;
}

// Betfair-specific types
export interface BetfairMarket {
  marketId: string;
  eventId: string;
  eventName: string;
  marketName: string;
  runners: BetfairRunner[];
}

export interface BetfairRunner {
  selectionId: number;
  runnerName: string;
  backPrices: BetfairPrice[];
  layPrices: BetfairPrice[];
}

export interface BetfairPrice {
  price: number;
  size: number;
}

export interface BetfairProvider {
  name: string;
  fetchLayOdds(eventIds: string[]): Promise<BetfairMarket[]>;
  isConfigured(): boolean;
}

// The Odds API response schemas
export const theOddsApiOutcomeSchema = z.object({
  name: z.string(),
  price: z.number(),
});

export const theOddsApiMarketSchema = z.object({
  key: z.string(),
  last_update: z.string(),
  outcomes: z.array(theOddsApiOutcomeSchema),
});

export const theOddsApiBookmakerSchema = z.object({
  key: z.string(),
  title: z.string(),
  last_update: z.string(),
  markets: z.array(theOddsApiMarketSchema),
});

export const theOddsApiEventSchema = z.object({
  id: z.string(),
  sport_key: z.string(),
  sport_title: z.string(),
  commence_time: z.string(),
  home_team: z.string(),
  away_team: z.string(),
  bookmakers: z.array(theOddsApiBookmakerSchema),
});

export const theOddsApiResponseSchema = z.array(theOddsApiEventSchema);

export const theOddsApiSportSchema = z.object({
  key: z.string(),
  group: z.string(),
  title: z.string(),
  description: z.string(),
  active: z.boolean(),
  has_outrights: z.boolean(),
});

export const theOddsApiSportsResponseSchema = z.array(theOddsApiSportSchema);

export type TheOddsApiEvent = z.infer<typeof theOddsApiEventSchema>;
export type TheOddsApiSport = z.infer<typeof theOddsApiSportSchema>;
