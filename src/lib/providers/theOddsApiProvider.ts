// src/lib/providers/theOddsApiProvider.ts
import type { SportEvent, BookmakerOdds } from '../types';
import type { OddsProvider, ProviderResult, Sport, TheOddsApiEvent } from './types';
import { theOddsApiResponseSchema, theOddsApiSportsResponseSchema } from './types';
import { getCache } from '../cache';

// Priority sports - these have the most arb opportunities and should be fetched first
const PRIORITY_SPORTS = [
  // Tennis - high arb frequency
  'tennis_atp', 'tennis_wta', 'tennis_itf_men', 'tennis_itf_women',
  // Basketball - good arb potential
  'basketball_nba', 'basketball_nbl', 'basketball_euroleague', 'basketball_ncaab',
  // American Football
  'americanfootball_nfl', 'americanfootball_ncaaf',
  // Combat sports - often have arbs
  'mma_mixed_martial_arts', 'boxing_boxing',
  // Baseball
  'baseball_mlb',
  // Hockey
  'icehockey_nhl',
  // Aussie sports
  'aussierules_afl', 'rugbyleague_nrl',
];

// ============================================================================
// PERFORMANCE TUNING CONSTANTS
// ============================================================================

// Higher concurrency for faster scans - retry logic handles any 429s
const PARALLEL_BATCH_SIZE = 10;

// Retry configuration for 429 errors - this is our safety net
const RETRY_CONFIG = {
  MAX_RETRIES: 2,
  BASE_DELAY_MS: 800,
  MAX_DELAY_MS: 3000,
};

// Only stop if critically low on quota
const MIN_REMAINING_REQUESTS = 10;

export class TheOddsApiProvider implements OddsProvider {
  name = 'The Odds API';
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.baseUrl = 'https://api.the-odds-api.com/v4';
    this.apiKey = apiKey;
  }

  hasValidKey(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async getSupportedSports(): Promise<Sport[]> {
    if (!this.apiKey) {
      console.log('[TheOddsApiProvider] No API key, returning empty sports list');
      return [];
    }

    // Check server-side memory cache first
    const cache = getCache();
    const cachedSports = cache.getSports();
    if (cachedSports) {
      console.log(`[TheOddsApiProvider] Using cached sports list (${cachedSports.length} sports)`);
      return cachedSports;
    }

    const url = `${this.baseUrl}/sports/?apiKey=${this.apiKey}`;
    
    try {
      console.log('[TheOddsApiProvider] Fetching sports list from API...');
      const startTime = Date.now();
      
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const parsed = theOddsApiSportsResponseSchema.parse(data);
      
      const sports = parsed
        .filter(s => s.active)
        .map(s => ({
          key: s.key,
          title: s.title,
          group: s.group,
          active: s.active,
          hasOutrights: s.has_outrights,
        }));

      // Cache the sports list (1 hour TTL)
      cache.setSports(sports);
      
      console.log(`[TheOddsApiProvider] Fetched ${sports.length} sports in ${Date.now() - startTime}ms`);
      return sports;
    } catch (error) {
      console.error('[TheOddsApiProvider] Failed to fetch sports:', error);
      return [];
    }
  }

  async fetchAllSports(): Promise<Sport[]> {
    return this.getSupportedSports();
  }

  /**
   * Sort sports by priority - put high-arb sports first
   */
  private sortByPriority(sports: string[]): string[] {
    const prioritySet = new Set(PRIORITY_SPORTS);
    const priority: string[] = [];
    const other: string[] = [];

    for (const sport of sports) {
      if (prioritySet.has(sport)) {
        priority.push(sport);
      } else {
        other.push(sport);
      }
    }

    // Sort priority sports by their order in PRIORITY_SPORTS
    priority.sort((a, b) => PRIORITY_SPORTS.indexOf(a) - PRIORITY_SPORTS.indexOf(b));

    return [...priority, ...other];
  }

  /**
   * Helper to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch odds for given sports - FAST PARALLEL VERSION
   * Uses higher concurrency with retry safety net for any 429s
   */
  async fetchOdds(
    sports: string[], 
    markets: string[] = ['h2h'],
    regions: string = 'au'
  ): Promise<ProviderResult> {
    if (!this.apiKey) {
      console.log('[TheOddsApiProvider] No API key configured');
      return {
        events: [],
        meta: { source: this.name },
      };
    }

    const allEvents: SportEvent[] = [];
    let remainingRequests: number | undefined;
    let usedRequests: number | undefined;
    const errors: string[] = [];
    const rateLimitedSports: string[] = [];

    const marketsStr = markets.join(',');
    const sortedSports = this.sortByPriority(sports);

    const scanStartTime = Date.now();
    console.log(`[TheOddsApiProvider] Starting scan of ${sortedSports.length} sports`);
    console.log(`[TheOddsApiProvider] Regions: ${regions}, Markets: ${marketsStr}, Concurrency: ${PARALLEL_BATCH_SIZE}`);

    // Process in batches with NO delays between batches
    for (let i = 0; i < sortedSports.length; i += PARALLEL_BATCH_SIZE) {
      // Check if critically low on quota
      if (remainingRequests !== undefined && remainingRequests < MIN_REMAINING_REQUESTS) {
        console.log(`[TheOddsApiProvider] ⚠️ Low API calls (${remainingRequests}), stopping`);
        break;
      }

      const batch = sortedSports.slice(i, i + PARALLEL_BATCH_SIZE);
      const batchNum = Math.floor(i / PARALLEL_BATCH_SIZE) + 1;
      const batchStart = Date.now();

      // Fire all requests in parallel (no stagger)
      const results = await Promise.allSettled(
        batch.map(sport => this.fetchSportOddsWithRetry(sport, regions, marketsStr))
      );

      // Process results
      let batchEvents = 0;
      let batchRateLimited = 0;

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const sport = batch[j];

        if (result.status === 'fulfilled') {
          if (result.value.rateLimited) {
            batchRateLimited++;
            rateLimitedSports.push(sport);
          } else {
            allEvents.push(...result.value.events);
            batchEvents += result.value.events.length;
          }
          
          if (result.value.remainingRequests !== undefined) {
            remainingRequests = result.value.remainingRequests;
          }
          if (result.value.usedRequests !== undefined) {
            usedRequests = result.value.usedRequests;
          }
        } else {
          const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
          if (!msg.includes('404')) {
            if (msg.includes('429')) {
              batchRateLimited++;
              rateLimitedSports.push(sport);
            } else {
              errors.push(`${sport}: ${msg}`);
            }
          }
        }
      }

      const batchDuration = Date.now() - batchStart;
      if (batchRateLimited > 0) {
        console.log(`[TheOddsApiProvider] Batch ${batchNum}: ${batchEvents} events, ${batchRateLimited} retrying (${batchDuration}ms)`);
      } else {
        console.log(`[TheOddsApiProvider] Batch ${batchNum}: ${batchEvents} events in ${batchDuration}ms (${remainingRequests ?? '?'} remaining)`);
      }
    }

    // Final retry pass for rate-limited sports (smaller batches, with delay)
    if (rateLimitedSports.length > 0 && rateLimitedSports.length <= 20) {
      console.log(`[TheOddsApiProvider] Final retry for ${rateLimitedSports.length} sports...`);
      await this.delay(1000);
      
      // Retry in batches of 4 with small delays
      for (let r = 0; r < rateLimitedSports.length; r += 4) {
        const retryBatch = rateLimitedSports.slice(r, r + 4);
        
        const retryResults = await Promise.allSettled(
          retryBatch.map(sport => this.fetchSportOdds(sport, regions, marketsStr))
        );
        
        for (const result of retryResults) {
          if (result.status === 'fulfilled' && !result.value.rateLimited) {
            allEvents.push(...result.value.events);
            if (result.value.remainingRequests !== undefined) {
              remainingRequests = result.value.remainingRequests;
            }
          }
        }
        
        if (r + 4 < rateLimitedSports.length) {
          await this.delay(400);
        }
      }
    }

    const totalDuration = Date.now() - scanStartTime;
    console.log(`[TheOddsApiProvider] ✅ Scan complete: ${allEvents.length} events in ${totalDuration}ms`);
    if (remainingRequests !== undefined) {
      console.log(`[TheOddsApiProvider] API calls remaining: ${remainingRequests}`);
    }

    return {
      events: allEvents,
      meta: {
        remainingRequests,
        usedRequests,
        source: this.name,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  /**
   * Fetch odds for priority sports only
   */
  async fetchPriorityOdds(
    markets: string[] = ['h2h'],
    regions: string = 'au'
  ): Promise<ProviderResult> {
    return this.fetchOdds(PRIORITY_SPORTS, markets, regions);
  }

  /**
   * Fetch sport odds with automatic retry on 429
   */
  private async fetchSportOddsWithRetry(
    sport: string, 
    regions: string, 
    markets: string,
    retryCount: number = 0
  ): Promise<{
    events: SportEvent[];
    remainingRequests?: number;
    usedRequests?: number;
    rateLimited?: boolean;
  }> {
    try {
      return await this.fetchSportOdds(sport, regions, markets);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      
      if (msg.includes('429') && retryCount < RETRY_CONFIG.MAX_RETRIES) {
        const delayMs = Math.min(
          RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, retryCount),
          RETRY_CONFIG.MAX_DELAY_MS
        );
        await this.delay(delayMs);
        return this.fetchSportOddsWithRetry(sport, regions, markets, retryCount + 1);
      }
      
      if (msg.includes('429')) {
        return { events: [], rateLimited: true };
      }
      
      throw error;
    }
  }

  private async fetchSportOdds(sport: string, regions: string, markets: string): Promise<{
    events: SportEvent[];
    remainingRequests?: number;
    usedRequests?: number;
    rateLimited?: boolean;
  }> {
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      regions: regions,
      markets: markets,
      oddsFormat: 'decimal',
      dateFormat: 'iso',
    });

    const url = `${this.baseUrl}/sports/${sport}/odds/?${params}`;

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const remainingRequests = parseInt(response.headers.get('x-requests-remaining') || '0', 10);
    const usedRequests = parseInt(response.headers.get('x-requests-used') || '0', 10);

    const data = await response.json();
    const parsed = theOddsApiResponseSchema.parse(data);

    const events = parsed.map(e => this.transformEvent(e));

    return { events, remainingRequests, usedRequests };
  }

  private transformEvent(raw: TheOddsApiEvent): SportEvent {
    const bookmakers: BookmakerOdds[] = raw.bookmakers.map(b => ({
      bookmaker: {
        key: b.key,
        title: b.title,
        lastUpdate: new Date(b.last_update),
      },
      markets: b.markets.map(m => ({
        key: m.key,
        lastUpdate: new Date(m.last_update),
        outcomes: m.outcomes.map(o => ({
          name: o.name,
          price: o.price,
          point: o.point,
        })),
      })),
    }));

    return {
      id: raw.id,
      sportKey: raw.sport_key,
      sportTitle: raw.sport_title,
      commenceTime: new Date(raw.commence_time),
      homeTeam: raw.home_team,
      awayTeam: raw.away_team,
      bookmakers,
    };
  }
}

// Factory function that creates provider with given API key
export function createOddsApiProvider(apiKey: string): TheOddsApiProvider {
  return new TheOddsApiProvider(apiKey);
}

// Export priority sports for use elsewhere
export { PRIORITY_SPORTS };