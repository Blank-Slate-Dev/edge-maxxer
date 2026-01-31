// src/components/ArbTable.tsx
'use client';

import { useState, useEffect } from 'react';
import type { ArbOpportunity } from '@/lib/types';
import { getBookmakerName, getBookmakerRegion } from '@/lib/config';
import { buildBookmakerSearchUrl, getCanonicalBookmaker } from '@/lib/bookmakerLinks';
import { BookLogo } from './BookLogo';

interface ArbTableProps {
  opportunities: ArbOpportunity[];
  onSelectArb: (arb: ArbOpportunity) => void;
  globalMode?: boolean;
}

// Cache for deep links
const deepLinkCache = new Map<string, Record<string, string | null>>();

function RegionBadge({ bookmaker }: { bookmaker: string }) {
  const region = getBookmakerRegion(bookmaker);
  const colors: Record<string, string> = {
    AU: 'bg-green-900/50 text-green-400',
    UK: 'bg-blue-900/50 text-blue-400',
    US: 'bg-red-900/50 text-red-400',
    EU: 'bg-purple-900/50 text-purple-400',
    INT: 'bg-zinc-700 text-zinc-300',
  };
  
  return (
    <span className={`text-[10px] sm:text-xs px-1 py-0.5 rounded ${colors[region] || colors.INT}`}>
      {region}
    </span>
  );
}

function formatEventTime(date: Date): string {
  return date.toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatEventTimeShort(date: Date): string {
  return date.toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isEventSoon(date: Date): boolean {
  const now = new Date();
  const twoHours = 2 * 60 * 60 * 1000;
  return date > now && date.getTime() - now.getTime() < twoHours;
}

function getTimeUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff < 0) return 'Started';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Hook to fetch deep links for an event
function useDeepLinks(event: { homeTeam: string; awayTeam: string; sportKey?: string }, bookmakers: string[]) {
  const [links, setLinks] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  
  const cacheKey = `${event.homeTeam}-${event.awayTeam}-${bookmakers.sort().join(',')}`;
  
  useEffect(() => {
    // Check cache first
    const cached = deepLinkCache.get(cacheKey);
    if (cached) {
      setLinks(cached);
      setLoading(false);
      return;
    }
    
    // Fetch from API
    const fetchLinks = async () => {
      try {
        const res = await fetch('/api/event-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookmakers: bookmakers.map(getCanonicalBookmaker),
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            sport: event.sportKey,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          const urls = data.urls || {};
          deepLinkCache.set(cacheKey, urls);
          setLinks(urls);
        }
      } catch (err) {
        console.error('Failed to fetch deep links:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLinks();
  }, [cacheKey, event.homeTeam, event.awayTeam, event.sportKey, bookmakers]);
  
  return { links, loading };
}

export function ArbTable({ opportunities, onSelectArb, globalMode = false }: ArbTableProps) {
  if (opportunities.length === 0) {
    return (
      <div 
        className="border p-8 sm:p-12 text-center rounded-lg"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)'
        }}
      >
        <p style={{ color: 'var(--muted)' }} className="mb-2 text-sm">No arbitrage opportunities found</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Click Scan to search for opportunities, or adjust filters
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {opportunities.map((opp, idx) => (
          <ArbCard key={`${opp.event.id}-${idx}`} opp={opp} onSelect={onSelectArb} globalMode={globalMode} />
        ))}
      </div>

      {/* Desktop Table View */}
      <div 
        className="hidden md:block border overflow-x-auto rounded-lg"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)'
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
                Event
              </th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
                Time (AEST)
              </th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
                Bets Required
              </th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
                Profit
              </th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp, idx) => (
              <ArbRow key={`${opp.event.id}-${idx}`} opp={opp} onSelect={onSelectArb} globalMode={globalMode} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Mobile Card Component
function ArbCard({ opp, onSelect, globalMode }: { opp: ArbOpportunity; onSelect: (arb: ArbOpportunity) => void; globalMode: boolean }) {
  const eventDate = new Date(opp.event.commenceTime);
  const soon = isEventSoon(eventDate);
  const timeUntil = getTimeUntil(eventDate);
  
  // Get bookmakers from the arb
  const bookmakers = opp.mode === 'book-vs-book' 
    ? [opp.outcome1.bookmaker, opp.outcome2.bookmaker, opp.outcome3?.bookmaker].filter(Boolean) as string[]
    : [opp.backOutcome.bookmaker];
  
  const { links } = useDeepLinks(opp.event, bookmakers);

  return (
    <div 
      className="border rounded-lg overflow-hidden"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--surface)'
      }}
    >
      {/* Card Header */}
      <div 
        className="px-3 py-2 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <TypeBadge type={opp.type} />
          {opp.mode === 'book-vs-betfair' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/50 text-purple-400 rounded">
              BF
            </span>
          )}
          <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
            {opp.event.sportTitle}
          </span>
        </div>
        <span 
          className="font-mono font-bold text-base shrink-0"
          style={{ color: opp.profitPercentage >= 0 ? 'var(--success)' : 'var(--muted)' }}
        >
          {opp.profitPercentage >= 0 ? '+' : ''}{opp.profitPercentage.toFixed(2)}%
        </span>
      </div>

      {/* Event Info */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{opp.event.homeTeam}</div>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>vs {opp.event.awayTeam}</div>
        <div className={`text-xs mt-1 ${soon ? 'text-yellow-500' : ''}`} style={soon ? {} : { color: 'var(--muted-foreground)' }}>
          {formatEventTimeShort(eventDate)} • {timeUntil === 'Started' ? 'In progress' : `in ${timeUntil}`}
        </div>
      </div>

      {/* Bets Required */}
      <div className="px-3 py-2" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <div className="text-[10px] uppercase tracking-wide mb-2" style={{ color: 'var(--muted-foreground)' }}>
          Bets Required
        </div>
        {opp.mode === 'book-vs-book' ? (
          <div className="space-y-2">
            <BetLineMobile 
              name={opp.outcome1.name} 
              odds={opp.outcome1.odds} 
              bookmaker={opp.outcome1.bookmaker}
              showRegion={globalMode}
              deepLink={links[getCanonicalBookmaker(opp.outcome1.bookmaker)]}
              event={opp.event}
            />
            <BetLineMobile 
              name={opp.outcome2.name} 
              odds={opp.outcome2.odds} 
              bookmaker={opp.outcome2.bookmaker}
              showRegion={globalMode}
              deepLink={links[getCanonicalBookmaker(opp.outcome2.bookmaker)]}
              event={opp.event}
            />
            {opp.outcome3 && (
              <BetLineMobile 
                name={opp.outcome3.name} 
                odds={opp.outcome3.odds} 
                bookmaker={opp.outcome3.bookmaker}
                showRegion={globalMode}
                deepLink={links[getCanonicalBookmaker(opp.outcome3.bookmaker)]}
                event={opp.event}
              />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <BetLineMobile 
              name={`Back ${opp.backOutcome.name}`} 
              odds={opp.backOutcome.odds} 
              bookmaker={opp.backOutcome.bookmaker}
              showRegion={globalMode}
              deepLink={links[getCanonicalBookmaker(opp.backOutcome.bookmaker)]}
              event={opp.event}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookLogo bookKey="betfair_ex_au" size={20} />
                <div>
                  <span className="text-purple-400 text-xs">Lay</span>
                  <span className="text-[10px] ml-1" style={{ color: 'var(--muted-foreground)' }}>Betfair</span>
                </div>
              </div>
              <span className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>{opp.layOutcome.odds.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="px-3 py-2">
        <button
          onClick={() => onSelect(opp)}
          className="w-full py-2 text-sm font-medium rounded transition-colors"
          style={{
            backgroundColor: 'var(--foreground)',
            color: 'var(--background)'
          }}
        >
          Calculate Stakes
        </button>
      </div>
    </div>
  );
}

// Mobile-optimized bet line
function BetLineMobile({
  name,
  odds,
  bookmaker,
  showRegion,
  deepLink,
  event,
}: {
  name: string;
  odds: number;
  bookmaker: string;
  showRegion?: boolean;
  deepLink?: string | null;
  event: { homeTeam: string; awayTeam: string; sportTitle?: string; sportKey?: string; commenceTime?: Date };
}) {
  const href = deepLink || buildBookmakerSearchUrl(bookmaker, {
    home_team: event.homeTeam,
    away_team: event.awayTeam,
    sport_title: event.sportTitle || event.sportKey,
    commence_time: event.commenceTime ? new Date(event.commenceTime).toISOString() : undefined,
  }) || undefined;
  
  const hasDeepLink = !!deepLink;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <BookLogo bookKey={bookmaker} size={24} />
        <div className="min-w-0">
          <div className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>{name}</div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            <a 
              href={href} 
              target="_blank" 
              rel="noreferrer" 
              className="hover:underline truncate"
              title={hasDeepLink ? 'Direct link to event' : 'Opens bookmaker homepage'}
            >
              {getBookmakerName(bookmaker)}
            </a>
            {hasDeepLink && (
              <span className="px-1 py-0.5 text-[8px] bg-green-900/50 text-green-400 rounded">
                Direct
              </span>
            )}
            {showRegion && <RegionBadge bookmaker={bookmaker} />}
          </div>
        </div>
      </div>
      <span className="font-mono text-sm font-medium shrink-0" style={{ color: 'var(--foreground)' }}>{odds.toFixed(2)}</span>
    </div>
  );
}

// Desktop Row Component
function ArbRow({ opp, onSelect, globalMode }: { opp: ArbOpportunity; onSelect: (arb: ArbOpportunity) => void; globalMode: boolean }) {
  const eventDate = new Date(opp.event.commenceTime);
  const soon = isEventSoon(eventDate);
  const timeUntil = getTimeUntil(eventDate);
  
  // Get bookmakers from the arb
  const bookmakers = opp.mode === 'book-vs-book' 
    ? [opp.outcome1.bookmaker, opp.outcome2.bookmaker, opp.outcome3?.bookmaker].filter(Boolean) as string[]
    : [opp.backOutcome.bookmaker];
  
  const { links } = useDeepLinks(opp.event, bookmakers);

  return (
    <tr 
      className="hover:bg-[var(--background)] transition-colors"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <td className="px-4 py-3">
        <TypeBadge type={opp.type} />
        {opp.mode === 'book-vs-betfair' && (
          <span className="ml-1 text-xs px-1.5 py-0.5 bg-purple-900/50 text-purple-400 rounded">
            BF
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium" style={{ color: 'var(--foreground)' }}>{opp.event.homeTeam}</div>
        <div style={{ color: 'var(--muted)' }}>vs {opp.event.awayTeam}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{opp.event.sportTitle}</div>
      </td>
      <td className="px-4 py-3">
        <div className={soon ? 'text-yellow-500' : ''} style={soon ? {} : { color: 'var(--muted)' }}>
          {formatEventTime(eventDate)}
        </div>
        <div className={`text-xs mt-0.5 ${soon ? 'text-yellow-500' : ''}`} style={soon ? {} : { color: 'var(--muted-foreground)' }}>
          {timeUntil === 'Started' ? 'In progress' : `Starts in ${timeUntil}`}
        </div>
      </td>
      <td className="px-4 py-3">
        {opp.mode === 'book-vs-book' ? (
          <div className="space-y-2">
            <BetLine 
              name={opp.outcome1.name} 
              odds={opp.outcome1.odds} 
              bookmaker={opp.outcome1.bookmaker}
              showRegion={globalMode}
              deepLink={links[getCanonicalBookmaker(opp.outcome1.bookmaker)]}
              event={opp.event}
            />
            <BetLine 
              name={opp.outcome2.name} 
              odds={opp.outcome2.odds} 
              bookmaker={opp.outcome2.bookmaker}
              showRegion={globalMode}
              deepLink={links[getCanonicalBookmaker(opp.outcome2.bookmaker)]}
              event={opp.event}
            />
            {opp.outcome3 && (
              <BetLine 
                name={opp.outcome3.name} 
                odds={opp.outcome3.odds} 
                bookmaker={opp.outcome3.bookmaker}
                showRegion={globalMode}
                deepLink={links[getCanonicalBookmaker(opp.outcome3.bookmaker)]}
                event={opp.event}
              />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <BetLine 
              name={`Back ${opp.backOutcome.name}`} 
              odds={opp.backOutcome.odds} 
              bookmaker={opp.backOutcome.bookmaker}
              showRegion={globalMode}
              deepLink={links[getCanonicalBookmaker(opp.backOutcome.bookmaker)]}
              event={opp.event}
            />
            <div className="flex items-center gap-2">
              <BookLogo bookKey="betfair_ex_au" size={24} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">Lay</span>
                  <span className="font-mono" style={{ color: 'var(--foreground)' }}>{opp.layOutcome.odds.toFixed(2)}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Betfair Exchange</div>
              </div>
            </div>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span 
          className="font-mono font-medium"
          style={{ color: opp.profitPercentage >= 0 ? 'var(--foreground)' : 'var(--muted)' }}
        >
          {opp.profitPercentage >= 0 ? '+' : ''}{opp.profitPercentage.toFixed(2)}%
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onSelect(opp)}
          className="px-3 py-1 text-xs font-medium rounded transition-colors"
          style={{
            backgroundColor: 'var(--foreground)',
            color: 'var(--background)'
          }}
        >
          Calculate
        </button>
      </td>
    </tr>
  );
}

// Desktop bet line
function BetLine({
  name,
  odds,
  bookmaker,
  showRegion,
  deepLink,
  event,
}: {
  name: string;
  odds: number;
  bookmaker: string;
  showRegion?: boolean;
  deepLink?: string | null;
  event: { homeTeam: string; awayTeam: string; sportTitle?: string; sportKey?: string; commenceTime?: Date };
}) {
  const href = deepLink || buildBookmakerSearchUrl(bookmaker, {
    home_team: event.homeTeam,
    away_team: event.awayTeam,
    sport_title: event.sportTitle || event.sportKey,
    commence_time: event.commenceTime ? new Date(event.commenceTime).toISOString() : undefined,
  }) || undefined;
  
  const hasDeepLink = !!deepLink;

  return (
    <div className="flex items-center gap-2">
      <BookLogo bookKey={bookmaker} size={28} />
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: 'var(--foreground)' }}>{name}</span>
          <span className="font-mono" style={{ color: 'var(--foreground)' }}>{odds.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
            title={hasDeepLink ? 'Direct link to event' : 'Opens bookmaker homepage'}
          >
            {getBookmakerName(bookmaker)}
          </a>
          {hasDeepLink && (
            <span className="px-1 py-0.5 text-[9px] bg-green-900/50 text-green-400 rounded">
              Direct
            </span>
          )}
          {showRegion && <RegionBadge bookmaker={bookmaker} />}
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'arb') {
    return (
      <span 
        className="inline-block px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded"
        style={{
          backgroundColor: 'var(--foreground)',
          color: 'var(--background)'
        }}
      >
        ARB
      </span>
    );
  }
  return (
    <span 
      className="inline-block px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded"
      style={{
        backgroundColor: 'var(--surface-secondary)',
        color: 'var(--muted)'
      }}
    >
      NEAR
    </span>
  );
}
