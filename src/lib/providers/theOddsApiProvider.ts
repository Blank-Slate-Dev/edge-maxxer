// src/lib/providers/theOddsApiProvider.ts
import type { SportEvent, BookmakerOdds } from '../types';
import type { OddsProvider, ProviderResult, Sport, TheOddsApiEvent } from './types';
import { theOddsApiResponseSchema, theOddsApiSportsResponseSchema } from './types';

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
   * Fetch odds for given sports
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

    console.log(`[TheOddsApiProvider] Fetching ${sports.length} sports with regions: ${regions}, markets: ${marketsStr}`);

    for (const sport of sports) {
      try {
        if (remainingRequests !== undefined && remainingRequests < 10) {
          console.log(`[TheOddsApiProvider] Low on API calls (${remainingRequests} left), stopping`);
          break;
        }

        const result = await this.fetchSportOdds(sport, regions, marketsStr);
        allEvents.push(...result.events);
        remainingRequests = result.remainingRequests;
        usedRequests = result.usedRequests;

        // Small delay between requests to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        // 404 is expected for sports without odds
        if (!msg.includes('404')) {
          console.error(`[TheOddsApiProvider] Error fetching ${sport}:`, msg);
          errors.push(`${sport}: ${msg}`);
        }
      }
    }

    console.log(`[TheOddsApiProvider] Total: ${allEvents.length} events from ${sports.length} sports`);

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
