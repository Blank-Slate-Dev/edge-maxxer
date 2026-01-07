// src/lib/providers/mockProvider.ts
import type { OddsProvider, ProviderResult, Sport } from './types';
import type { SportEvent, BookmakerOdds } from '../types';

/**
 * Mock provider that returns realistic sample data for development
 * and when no API key is configured.
 */
export class MockOddsProvider implements OddsProvider {
  name = 'Mock Provider (Demo)';

  async getSupportedSports(): Promise<Sport[]> {
    return [
      { key: 'tennis_atp', title: 'ATP Tennis', group: 'Tennis', active: true },
      { key: 'tennis_wta', title: 'WTA Tennis', group: 'Tennis', active: true },
      { key: 'basketball_nba', title: 'NBA Basketball', group: 'Basketball', active: true },
      { key: 'aussierules_afl', title: 'AFL', group: 'Australian Rules', active: true },
      { key: 'rugbyleague_nrl', title: 'NRL', group: 'Rugby League', active: true },
      { key: 'soccer_epl', title: 'EPL', group: 'Soccer', active: true },
    ];
  }

  async fetchOdds(sports: string[]): Promise<ProviderResult> {
    console.log(`[MockProvider] Generating mock data for: ${sports.join(', ')}`);
    
    const events = this.generateMockEvents(sports);
    
    return {
      events,
      meta: {
        remainingRequests: 999,
        usedRequests: 1,
        source: this.name,
      },
    };
  }

  private generateMockEvents(sports: string[]): SportEvent[] {
    const now = new Date();
    const events: SportEvent[] = [];

    // Generate mock tennis events with arb opportunities
    if (sports.includes('tennis_atp') || sports.includes('all')) {
      events.push(
        this.createEvent({
          id: 'mock-tennis-1',
          sportKey: 'tennis_atp',
          sportTitle: 'ATP Tennis',
          homeTeam: 'Jannik Sinner',
          awayTeam: 'Carlos Alcaraz',
          commenceTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
          bookmakers: [
            this.createBookmaker('sportsbet', 'Sportsbet', [
              { name: 'Jannik Sinner', price: 2.15 },
              { name: 'Carlos Alcaraz', price: 1.85 },
            ]),
            this.createBookmaker('tab', 'TAB', [
              { name: 'Jannik Sinner', price: 2.05 },
              { name: 'Carlos Alcaraz', price: 1.95 },
            ]),
            this.createBookmaker('pointsbet', 'PointsBet', [
              { name: 'Jannik Sinner', price: 2.10 },
              { name: 'Carlos Alcaraz', price: 1.88 },
            ]),
            // This creates an arb: 1/2.15 + 1/1.95 = 0.465 + 0.513 = 0.978 (2.2% profit)
            this.createBookmaker('neds', 'Neds', [
              { name: 'Jannik Sinner', price: 2.08 },
              { name: 'Carlos Alcaraz', price: 1.92 },
            ]),
          ],
        }),
        this.createEvent({
          id: 'mock-tennis-2',
          sportKey: 'tennis_atp',
          sportTitle: 'ATP Tennis',
          homeTeam: 'Novak Djokovic',
          awayTeam: 'Alexander Zverev',
          commenceTime: new Date(now.getTime() + 5 * 60 * 60 * 1000),
          bookmakers: [
            this.createBookmaker('sportsbet', 'Sportsbet', [
              { name: 'Novak Djokovic', price: 1.55 },
              { name: 'Alexander Zverev', price: 2.60 },
            ]),
            this.createBookmaker('ladbrokes', 'Ladbrokes', [
              // Creates arb: 1/1.55 + 1/2.75 = 0.645 + 0.364 = 1.009 (no arb)
              { name: 'Novak Djokovic', price: 1.52 },
              { name: 'Alexander Zverev', price: 2.75 },
            ]),
            this.createBookmaker('unibet', 'Unibet', [
              { name: 'Novak Djokovic', price: 1.58 },
              { name: 'Alexander Zverev', price: 2.55 },
            ]),
          ],
        }),
      );
    }

    // Generate mock NBA events
    if (sports.includes('basketball_nba') || sports.includes('all')) {
      events.push(
        this.createEvent({
          id: 'mock-nba-1',
          sportKey: 'basketball_nba',
          sportTitle: 'NBA Basketball',
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Golden State Warriors',
          commenceTime: new Date(now.getTime() + 8 * 60 * 60 * 1000),
          bookmakers: [
            this.createBookmaker('sportsbet', 'Sportsbet', [
              { name: 'Los Angeles Lakers', price: 1.95 },
              { name: 'Golden State Warriors', price: 1.95 },
            ]),
            this.createBookmaker('tab', 'TAB', [
              { name: 'Los Angeles Lakers', price: 1.92 },
              { name: 'Golden State Warriors', price: 1.98 },
            ]),
            // Creates small arb: 1/1.98 + 1/1.98 = 1.01 (no arb)
            this.createBookmaker('pointsbet', 'PointsBet', [
              { name: 'Los Angeles Lakers', price: 1.98 },
              { name: 'Golden State Warriors', price: 1.92 },
            ]),
            // Creates arb with Sportsbet: 1/1.95 + 1/2.05 = 0.513 + 0.488 = 1.001 (marginal)
            this.createBookmaker('bet365', 'bet365', [
              { name: 'Los Angeles Lakers', price: 2.05 },
              { name: 'Golden State Warriors', price: 1.85 },
            ]),
          ],
        }),
        this.createEvent({
          id: 'mock-nba-2',
          sportKey: 'basketball_nba',
          sportTitle: 'NBA Basketball',
          homeTeam: 'Boston Celtics',
          awayTeam: 'Miami Heat',
          commenceTime: new Date(now.getTime() + 10 * 60 * 60 * 1000),
          bookmakers: [
            this.createBookmaker('sportsbet', 'Sportsbet', [
              { name: 'Boston Celtics', price: 1.45 },
              { name: 'Miami Heat', price: 2.90 },
            ]),
            this.createBookmaker('neds', 'Neds', [
              // Creates arb: 1/1.48 + 1/2.95 = 0.676 + 0.339 = 1.015 (no arb)
              { name: 'Boston Celtics', price: 1.48 },
              { name: 'Miami Heat', price: 2.95 },
            ]),
            this.createBookmaker('ladbrokes', 'Ladbrokes', [
              // Creates arb with Sportsbet: 1/1.45 + 1/3.10 = 0.689 + 0.323 = 1.012 (no arb)
              { name: 'Boston Celtics', price: 1.42 },
              { name: 'Miami Heat', price: 3.10 },
            ]),
          ],
        }),
      );
    }

    // Generate mock AFL events
    if (sports.includes('aussierules_afl') || sports.includes('all')) {
      events.push(
        this.createEvent({
          id: 'mock-afl-1',
          sportKey: 'aussierules_afl',
          sportTitle: 'AFL',
          homeTeam: 'Collingwood Magpies',
          awayTeam: 'Carlton Blues',
          commenceTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
          bookmakers: [
            this.createBookmaker('sportsbet', 'Sportsbet', [
              { name: 'Collingwood Magpies', price: 1.72 },
              { name: 'Carlton Blues', price: 2.20 },
            ]),
            this.createBookmaker('tab', 'TAB', [
              { name: 'Collingwood Magpies', price: 1.75 },
              { name: 'Carlton Blues', price: 2.15 },
            ]),
            // Creates arb: 1/1.80 + 1/2.20 = 0.556 + 0.455 = 1.011 (no arb)
            this.createBookmaker('pointsbet', 'PointsBet', [
              { name: 'Collingwood Magpies', price: 1.80 },
              { name: 'Carlton Blues', price: 2.10 },
            ]),
          ],
        }),
      );
    }

    // Generate mock NRL event with clear arb opportunity
    if (sports.includes('rugbyleague_nrl') || sports.includes('all')) {
      events.push(
        this.createEvent({
          id: 'mock-nrl-1',
          sportKey: 'rugbyleague_nrl',
          sportTitle: 'NRL',
          homeTeam: 'Penrith Panthers',
          awayTeam: 'Melbourne Storm',
          commenceTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
          bookmakers: [
            // Creates arb: 1/2.25 + 1/1.85 = 0.444 + 0.541 = 0.985 (1.5% profit!)
            this.createBookmaker('sportsbet', 'Sportsbet', [
              { name: 'Penrith Panthers', price: 2.25 },
              { name: 'Melbourne Storm', price: 1.72 },
            ]),
            this.createBookmaker('tab', 'TAB', [
              { name: 'Penrith Panthers', price: 2.10 },
              { name: 'Melbourne Storm', price: 1.85 },
            ]),
            this.createBookmaker('ladbrokes', 'Ladbrokes', [
              { name: 'Penrith Panthers', price: 2.15 },
              { name: 'Melbourne Storm', price: 1.80 },
            ]),
            this.createBookmaker('neds', 'Neds', [
              { name: 'Penrith Panthers', price: 2.18 },
              { name: 'Melbourne Storm', price: 1.78 },
            ]),
          ],
        }),
      );
    }

    return events;
  }

  private createEvent(params: {
    id: string;
    sportKey: string;
    sportTitle: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: Date;
    bookmakers: BookmakerOdds[];
  }): SportEvent {
    return {
      id: params.id,
      sportKey: params.sportKey,
      sportTitle: params.sportTitle,
      homeTeam: params.homeTeam,
      awayTeam: params.awayTeam,
      commenceTime: params.commenceTime,
      bookmakers: params.bookmakers,
    };
  }

  private createBookmaker(
    key: string,
    title: string,
    outcomes: { name: string; price: number }[]
  ): BookmakerOdds {
    return {
      bookmaker: {
        key,
        title,
        lastUpdate: new Date(),
      },
      markets: [
        {
          key: 'h2h',
          lastUpdate: new Date(),
          outcomes: outcomes.map(o => ({
            name: o.name,
            price: o.price,
          })),
        },
      ],
    };
  }
}

// Singleton instance
let providerInstance: MockOddsProvider | null = null;

export function getMockOddsProvider(): MockOddsProvider {
  if (!providerInstance) {
    providerInstance = new MockOddsProvider();
  }
  return providerInstance;
}
