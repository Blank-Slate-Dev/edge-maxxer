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

// Sport type matching the provider interface
interface CachedSport {
  key: string;
  title: string;
  group: string;
  active: boolean;
  hasOutrights?: boolean;
}

/**
 * Simple in-memory cache for odds, arbs, and sports.
 * In production, this could be replaced with Redis.
 */
class MemoryCache {
  private oddsCache: CacheEntry<OddsCache> | null = null;
  private arbsCache: CacheEntry<ArbsCache> | null = null;
  private sportsCache: CacheEntry<CachedSport[]> | null = null;

  // Default TTLs in milliseconds
  private ODDS_TTL = 30 * 1000; // 30 seconds
  private ARBS_TTL = 15 * 1000; // 15 seconds
  private SPORTS_TTL = 60 * 60 * 1000; // 1 hour (sports list rarely changes)

  // ============================================================================
  // ODDS CACHE
  // ============================================================================

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

  // ============================================================================
  // ARBS CACHE
  // ============================================================================

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

  // ============================================================================
  // SPORTS CACHE
  // ============================================================================

  setSports(data: CachedSport[]): void {
    this.sportsCache = {
      data,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.SPORTS_TTL),
    };
    console.log(`[Cache] Sports list cached (${data.length} sports, TTL: ${this.SPORTS_TTL / 1000}s)`);
  }

  getSports(): CachedSport[] | null {
    if (!this.sportsCache) return null;
    if (new Date() > this.sportsCache.expiresAt) {
      console.log('[Cache] Sports cache expired');
      this.sportsCache = null;
      return null;
    }
    return this.sportsCache.data;
  }

  getSportsTimestamp(): Date | null {
    return this.sportsCache?.timestamp || null;
  }

  /**
   * Check if sports cache is valid (not expired)
   */
  hasFreshSportsCache(): boolean {
    if (!this.sportsCache) return false;
    return new Date() <= this.sportsCache.expiresAt;
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  clear(): void {
    this.oddsCache = null;
    this.arbsCache = null;
    this.sportsCache = null;
    console.log('[Cache] All caches cleared');
  }

  /**
   * Clear only volatile data (odds/arbs) but keep sports
   */
  clearVolatile(): void {
    this.oddsCache = null;
    this.arbsCache = null;
    console.log('[Cache] Volatile caches cleared (sports preserved)');
  }

  getStatus(): {
    oddsAge: number | null;
    arbsAge: number | null;
    sportsAge: number | null;
    oddsExpired: boolean;
    arbsExpired: boolean;
    sportsExpired: boolean;
    sportsCached: number;
  } {
    const now = Date.now();
    return {
      oddsAge: this.oddsCache 
        ? Math.floor((now - this.oddsCache.timestamp.getTime()) / 1000)
        : null,
      arbsAge: this.arbsCache
        ? Math.floor((now - this.arbsCache.timestamp.getTime()) / 1000)
        : null,
      sportsAge: this.sportsCache
        ? Math.floor((now - this.sportsCache.timestamp.getTime()) / 1000)
        : null,
      oddsExpired: this.oddsCache ? now > this.oddsCache.expiresAt.getTime() : true,
      arbsExpired: this.arbsCache ? now > this.arbsCache.expiresAt.getTime() : true,
      sportsExpired: this.sportsCache ? now > this.sportsCache.expiresAt.getTime() : true,
      sportsCached: this.sportsCache?.data.length ?? 0,
    };
  }
}

// Singleton instance
const cache = new MemoryCache();

export function getCache(): MemoryCache {
  return cache;
}

export type { OddsCache, ArbsCache, CachedSport };