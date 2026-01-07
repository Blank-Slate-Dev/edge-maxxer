// src/lib/cache.ts
import type { SportEvent, ArbOpportunity, ValueBet } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

interface OddsCache {
  events: SportEvent[];
  source: string;
  remainingRequests?: number;
}

interface ArbsCache {
  opportunities: ArbOpportunity[];
  valueBets: ValueBet[];
  isUsingMockData: boolean;
}

/**
 * Simple in-memory cache for odds and arbs.
 * In production, this could be replaced with Redis.
 */
class MemoryCache {
  private oddsCache: CacheEntry<OddsCache> | null = null;
  private arbsCache: CacheEntry<ArbsCache> | null = null;
  private sportsCache: CacheEntry<{ key: string; title: string }[]> | null = null;

  // Default TTLs in milliseconds
  private ODDS_TTL = 30 * 1000; // 30 seconds
  private ARBS_TTL = 15 * 1000; // 15 seconds
  private SPORTS_TTL = 60 * 60 * 1000; // 1 hour

  setOdds(data: OddsCache): void {
    this.oddsCache = {
      data,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.ODDS_TTL),
    };
  }

  getOdds(): OddsCache | null {
    if (!this.oddsCache) return null;
    if (new Date() > this.oddsCache.expiresAt) {
      this.oddsCache = null;
      return null;
    }
    return this.oddsCache.data;
  }

  getOddsTimestamp(): Date | null {
    return this.oddsCache?.timestamp || null;
  }

  setArbs(data: ArbsCache): void {
    this.arbsCache = {
      data,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.ARBS_TTL),
    };
  }

  getArbs(): ArbsCache | null {
    if (!this.arbsCache) return null;
    if (new Date() > this.arbsCache.expiresAt) {
      this.arbsCache = null;
      return null;
    }
    return this.arbsCache.data;
  }

  getArbsTimestamp(): Date | null {
    return this.arbsCache?.timestamp || null;
  }

  setSports(data: { key: string; title: string }[]): void {
    this.sportsCache = {
      data,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.SPORTS_TTL),
    };
  }

  getSports(): { key: string; title: string }[] | null {
    if (!this.sportsCache) return null;
    if (new Date() > this.sportsCache.expiresAt) {
      this.sportsCache = null;
      return null;
    }
    return this.sportsCache.data;
  }

  clear(): void {
    this.oddsCache = null;
    this.arbsCache = null;
    this.sportsCache = null;
  }

  getStatus(): {
    oddsAge: number | null;
    arbsAge: number | null;
    oddsExpired: boolean;
    arbsExpired: boolean;
  } {
    const now = Date.now();
    return {
      oddsAge: this.oddsCache 
        ? Math.floor((now - this.oddsCache.timestamp.getTime()) / 1000)
        : null,
      arbsAge: this.arbsCache
        ? Math.floor((now - this.arbsCache.timestamp.getTime()) / 1000)
        : null,
      oddsExpired: this.oddsCache ? now > this.oddsCache.expiresAt.getTime() : true,
      arbsExpired: this.arbsCache ? now > this.arbsCache.expiresAt.getTime() : true,
    };
  }
}

// Singleton instance
const cache = new MemoryCache();

export function getCache(): MemoryCache {
  return cache;
}

export type { OddsCache, ArbsCache };
