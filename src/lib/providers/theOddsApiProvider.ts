// src/lib/providers/theOddsApiProvider.ts
import type { SportEvent, BookmakerOdds } from '../types';
import type { OddsProvider, ProviderResult, Sport, TheOddsApiEvent } from './types';
import { theOddsApiResponseSchema, theOddsApiSportsResponseSchema } from './types';

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

// Number of sports to fetch in parallel
const PARALLEL_BATCH_SIZE = 6;

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

    const url = `${this.baseUrl}/sports/?apiKey=${this.apiKey}`;
    
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const parsed = theOddsApiSportsResponseSchema.parse(data);
      
      return parsed
        .filter(s => s.active)
        .map(s => ({
          key: s.key,
          title: s.title,
          group: s.group,
          active: s.active,
          hasOutrights: s.has_outrights,
        }));
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
   * Fetch odds for given sports - PARALLEL VERSION
   * @param sports - Array of sport keys to fetch
   * @param markets - Array of market types (e.g., ['h2h', 'spreads'])
   * @param regions - Comma-separated API region string (e.g., 'au,uk,us,eu')
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

    const marketsStr = markets.join(',');

    // Sort sports by priority so we get high-arb sports first
    const sortedSports = this.sortByPriority(sports);

    console.log(`[TheOddsApiProvider] Fetching ${sortedSports.length} sports (parallel batches of ${PARALLEL_BATCH_SIZE})`);
    console.log(`[TheOddsApiProvider] Regions: ${regions}, Markets: ${marketsStr}`);
    console.log(`[TheOddsApiProvider] Priority sports first: ${sortedSports.slice(0, 5).join(', ')}...`);

    // Process sports in parallel batches
    for (let i = 0; i < sortedSports.length; i += PARALLEL_BATCH_SIZE) {
      // Check if we're low on API calls
      if (remainingRequests !== undefined && remainingRequests < 10) {
        console.log(`[TheOddsApiProvider] Low on API calls (${remainingRequests} left), stopping`);
        break;
      }

      const batch = sortedSports.slice(i, i + PARALLEL_BATCH_SIZE);
      
      console.log(`[TheOddsApiProvider] Batch ${Math.floor(i / PARALLEL_BATCH_SIZE) + 1}: ${batch.join(', ')}`);

      // Fetch all sports in this batch in parallel
      const results = await Promise.allSettled(
        batch.map(sport => this.fetchSportOdds(sport, regions, marketsStr))
      );

      // Process results
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const sport = batch[j];

        if (result.status === 'fulfilled') {
          allEvents.push(...result.value.events);
          // Update remaining requests from the latest response
          if (result.value.remainingRequests !== undefined) {
            remainingRequests = result.value.remainingRequests;
          }
          if (result.value.usedRequests !== undefined) {
            usedRequests = result.value.usedRequests;
          }
        } else {
          const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
          // 404 is expected for sports without odds - don't log as error
          if (!msg.includes('404')) {
            console.error(`[TheOddsApiProvider] Error fetching ${sport}:`, msg);
            errors.push(`${sport}: ${msg}`);
          }
        }
      }
    }

    console.log(`[TheOddsApiProvider] Complete: ${allEvents.length} events from ${sortedSports.length} sports`);
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
   * Fetch odds for priority sports only - for faster initial results
   */
  async fetchPriorityOdds(
    markets: string[] = ['h2h'],
    regions: string = 'au'
  ): Promise<ProviderResult> {
    return this.fetchOdds(PRIORITY_SPORTS, markets, regions);
  }

  private async fetchSportOdds(sport: string, regions: string, markets: string): Promise<{
    events: SportEvent[];
    remainingRequests?: number;
    usedRequests?: number;
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

    if (events.length > 0) {
      console.log(`[TheOddsApiProvider] ${sport}: ${events.length} events, ${this.countBookmakers(events)} bookmakers`);
    }

    return { events, remainingRequests, usedRequests };
  }

  private countBookmakers(events: SportEvent[]): number {
    const bookmakers = new Set<string>();
    events.forEach(e => e.bookmakers.forEach(b => bookmakers.add(b.bookmaker.key)));
    return bookmakers.size;
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