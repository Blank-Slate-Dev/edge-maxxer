// src/components/ArbTable.tsx
'use client';

import type { ArbOpportunity } from '@/lib/types';
import { getBookmakerName, getBookmakerRegion } from '@/lib/config';
import type { UserRegion } from '@/lib/config';
import { buildBookmakerSearchUrl } from '@/lib/bookmakerLinks';
import { formatDecimalOddsForRegion } from '@/lib/oddsFormat';
import { BookLogo } from './BookLogo';

interface ArbTableProps {
  opportunities: ArbOpportunity[];
  onSelectArb: (arb: ArbOpportunity) => void;
  globalMode?: boolean;
  userRegion?: UserRegion;
}

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

export function ArbTable({ opportunities, onSelectArb, globalMode = false, userRegion = 'AU' }: ArbTableProps) {
  if (opportunities.length === 0) {
    return (
      <div
        className="border p-8 sm:p-12 text-center rounded-lg"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <p style={{ color: 'var(--muted)' }} className="mb-2 text-sm">
          No arbitrage opportunities found
        </p>
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
          <ArbCard key={`${opp.event.id}-${idx}`} opp={opp} onSelect={onSelectArb} globalMode={globalMode} userRegion={userRegion} />
        ))}
      </div>

      {/* Desktop Table View */}
      <div
        className="hidden md:block border overflow-x-auto rounded-lg"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th
                className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium"
                style={{ color: 'var(--muted)' }}
              >
                Type
              </th>
              <th
                className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium"
                style={{ color: 'var(--muted)' }}
              >
                Event
              </th>
              <th
                className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium"
                style={{ color: 'var(--muted)' }}
              >
                Time (AEST)
              </th>
              <th
                className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium"
                style={{ color: 'var(--muted)' }}
              >
                Bets Required
              </th>
              <th
                className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium"
                style={{ color: 'var(--muted)' }}
              >
                Profit
              </th>
              <th
                className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium"
                style={{ color: 'var(--muted)' }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp, idx) => (
              <ArbRow key={`${opp.event.id}-${idx}`} opp={opp} onSelect={onSelectArb} globalMode={globalMode} userRegion={userRegion} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Mobile Card Component
function ArbCard({
  opp,
  onSelect,
  globalMode,
  userRegion,
}: {
  opp: ArbOpportunity;
  onSelect: (arb: ArbOpportunity) => void;
  globalMode: boolean;
  userRegion: UserRegion;
}) {
  const eventDate = new Date(opp.event.commenceTime);
  const soon = isEventSoon(eventDate);
  const timeUntil = getTimeUntil(eventDate);

  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--surface)',
      }}
    >
      {/* Card Header */}
      <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <TypeBadge type={opp.type} />
          {opp.mode === 'book-vs-betfair' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/50 text-purple-400 rounded">BF</span>
          )}
          <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
            {opp.event.sportTitle}
          </span>
        </div>
        <span
          className="font-mono font-bold text-base shrink-0"
          style={{ color: opp.profitPercentage >= 0 ? 'var(--success)' : 'var(--muted)' }}
        >
          {opp.profitPercentage >= 0 ? '+' : ''}
          {opp.profitPercentage.toFixed(2)}%
        </span>
      </div>

      {/* Event Info */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
          {opp.event.homeTeam}
        </div>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          vs {opp.event.awayTeam}
        </div>
        <div
          className={`text-xs mt-1 ${soon ? 'text-yellow-500' : ''}`}
          style={soon ? {} : { color: 'var(--muted-foreground)' }}
        >
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
              bookmakerKey={opp.outcome1.bookmakerKey}
              showRegion={globalMode}
              userRegion={userRegion}
            />
            <BetLineMobile
              name={opp.outcome2.name}
              odds={opp.outcome2.odds}
              bookmaker={opp.outcome2.bookmaker}
              bookmakerKey={opp.outcome2.bookmakerKey}
              showRegion={globalMode}
              userRegion={userRegion}
            />
            {opp.outcome3 && (
              <BetLineMobile
                name={opp.outcome3.name}
                odds={opp.outcome3.odds}
                bookmaker={opp.outcome3.bookmaker}
                bookmakerKey={opp.outcome3.bookmakerKey}
                showRegion={globalMode}
                userRegion={userRegion}
              />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <BetLineMobile
              name={`Back ${opp.backOutcome.name}`}
              odds={opp.backOutcome.odds}
              bookmaker={opp.backOutcome.bookmaker}
              bookmakerKey={opp.backOutcome.bookmakerKey}
              showRegion={globalMode}
              userRegion={userRegion}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookLogo bookKey="betfair_ex_au" size={20} />
                <div>
                  <span className="text-purple-400 text-xs">Lay</span>
                  <span className="text-[10px] ml-1" style={{ color: 'var(--muted-foreground)' }}>
                    Betfair
                  </span>
                </div>
              </div>
              <span className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>
                {formatDecimalOddsForRegion(opp.layOutcome.odds, userRegion)}
              </span>
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
            color: 'var(--background)',
          }}
        >
          Calculate Stakes
        </button>
      </div>
    </div>
  );
}

// Mobile-optimized bet line - links to bookmaker homepage
function BetLineMobile({
  name,
  odds,
  bookmaker,
  bookmakerKey,
  showRegion,
  userRegion = 'AU',
}: {
  name: string;
  odds: number;
  bookmaker: string;
  bookmakerKey: string;
  showRegion?: boolean;
  userRegion?: UserRegion;
}) {
  const href = buildBookmakerSearchUrl(bookmakerKey, {}) || buildBookmakerSearchUrl(bookmaker, {}) || undefined;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <BookLogo bookKey={bookmakerKey} size={24} />
        <div className="min-w-0">
          <div className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>
            {name}
          </div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            {href ? (
              <a href={href} target="_blank" rel="noreferrer" className="hover:underline truncate">
                {getBookmakerName(bookmakerKey)}
              </a>
            ) : (
              <span className="truncate">{getBookmakerName(bookmakerKey)}</span>
            )}
            {showRegion && <RegionBadge bookmaker={bookmakerKey} />}
          </div>
        </div>
      </div>
      <span className="font-mono text-sm font-medium shrink-0" style={{ color: 'var(--foreground)' }}>
        {formatDecimalOddsForRegion(odds, userRegion)}
      </span>
    </div>
  );
}

// Desktop Row Component
function ArbRow({
  opp,
  onSelect,
  globalMode,
  userRegion,
}: {
  opp: ArbOpportunity;
  onSelect: (arb: ArbOpportunity) => void;
  globalMode: boolean;
  userRegion: UserRegion;
}) {
  const eventDate = new Date(opp.event.commenceTime);
  const soon = isEventSoon(eventDate);
  const timeUntil = getTimeUntil(eventDate);

  return (
    <tr className="hover:bg-[var(--background)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
      <td className="px-4 py-3">
        <TypeBadge type={opp.type} />
        {opp.mode === 'book-vs-betfair' && (
          <span className="ml-1 text-xs px-1.5 py-0.5 bg-purple-900/50 text-purple-400 rounded">BF</span>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="font-medium" style={{ color: 'var(--foreground)' }}>
          {opp.event.homeTeam}
        </div>
        <div style={{ color: 'var(--muted)' }}>vs {opp.event.awayTeam}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {opp.event.sportTitle}
        </div>
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
              bookmakerKey={opp.outcome1.bookmakerKey}
              showRegion={globalMode}
              userRegion={userRegion}
            />
            <BetLine
              name={opp.outcome2.name}
              odds={opp.outcome2.odds}
              bookmaker={opp.outcome2.bookmaker}
              bookmakerKey={opp.outcome2.bookmakerKey}
              showRegion={globalMode}
              userRegion={userRegion}
            />
            {opp.outcome3 && (
              <BetLine
                name={opp.outcome3.name}
                odds={opp.outcome3.odds}
                bookmaker={opp.outcome3.bookmaker}
                bookmakerKey={opp.outcome3.bookmakerKey}
                showRegion={globalMode}
                userRegion={userRegion}
              />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <BetLine
              name={`Back ${opp.backOutcome.name}`}
              odds={opp.backOutcome.odds}
              bookmaker={opp.backOutcome.bookmaker}
              bookmakerKey={opp.backOutcome.bookmakerKey}
              showRegion={globalMode}
              userRegion={userRegion}
            />
            <div className="flex items-center gap-2">
              <BookLogo bookKey="betfair_ex_au" size={24} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">Lay</span>
                  <span className="font-mono" style={{ color: 'var(--foreground)' }}>
                    {formatDecimalOddsForRegion(opp.layOutcome.odds, userRegion)}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Betfair Exchange
                </div>
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
          {opp.profitPercentage >= 0 ? '+' : ''}
          {opp.profitPercentage.toFixed(2)}%
        </span>
      </td>

      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onSelect(opp)}
          className="px-3 py-1 text-xs font-medium rounded transition-colors"
          style={{
            backgroundColor: 'var(--foreground)',
            color: 'var(--background)',
          }}
        >
          Calculate
        </button>
      </td>
    </tr>
  );
}

// Desktop bet line - links to bookmaker homepage
function BetLine({
  name,
  odds,
  bookmaker,
  bookmakerKey,
  showRegion,
  userRegion = 'AU',
}: {
  name: string;
  odds: number;
  bookmaker: string;
  bookmakerKey: string;
  showRegion?: boolean;
  userRegion?: UserRegion;
}) {
  const href = buildBookmakerSearchUrl(bookmakerKey, {}) || buildBookmakerSearchUrl(bookmaker, {}) || undefined;

  return (
    <div className="flex items-center gap-2">
      <BookLogo bookKey={bookmakerKey} size={28} />
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: 'var(--foreground)' }}>
            {name}
          </span>
          <span className="font-mono" style={{ color: 'var(--foreground)' }}>
            {formatDecimalOddsForRegion(odds, userRegion)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {href ? (
            <a href={href} target="_blank" rel="noreferrer" className="hover:underline">
              {getBookmakerName(bookmakerKey)}
            </a>
          ) : (
            <span>{getBookmakerName(bookmakerKey)}</span>
          )}
          {showRegion && <RegionBadge bookmaker={bookmakerKey} />}
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
          color: 'var(--background)',
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
        color: 'var(--muted)',
      }}
    >
      NEAR
    </span>
  );
}
