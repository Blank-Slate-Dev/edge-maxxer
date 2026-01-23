// src/components/TotalsTable.tsx
'use client';

import type { TotalsArb, MiddleOpportunity } from '@/lib/types';
import { getBookmakerName, getBookmakerRegion } from '@/lib/config';
import { buildBookmakerSearchUrl } from '@/lib/bookmakerLinks';
import { BookLogo } from './BookLogo';

interface TotalsTableProps {
  totals: TotalsArb[];
  middles: MiddleOpportunity[];
  onSelectTotals: (totals: TotalsArb) => void;
  onSelectMiddle: (middle: MiddleOpportunity) => void;
  showMiddles: boolean;
  globalMode?: boolean;
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

export function TotalsTable({ totals, middles, onSelectTotals, onSelectMiddle, showMiddles, globalMode = false }: TotalsTableProps) {
  const hasContent = totals.length > 0 || (showMiddles && middles.length > 0);
  const totalsMiddles = middles.filter(m => m.marketType === 'totals');

  if (!hasContent) {
    return (
      <div 
        className="border p-8 sm:p-12 text-center rounded-lg"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)'
        }}
      >
        <p style={{ color: 'var(--muted)' }} className="mb-2 text-sm">No totals opportunities found</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Over/Under markets are mainly available for US sports. 
          Check back when NBA, NFL, or MLB games are scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Totals Arbs */}
      {totals.length > 0 && (
        <div>
          {/* Section Header */}
          <div 
            className="px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg border border-b-0"
            style={{ 
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface-secondary)'
            }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Totals Arbitrage</span>
            <span className="text-xs ml-2 hidden sm:inline" style={{ color: 'var(--muted)' }}>Over/Under at same line</span>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 border border-t-0 rounded-b-lg p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            {totals.map((total, idx) => (
              <TotalsCard key={`${total.event.id}-${idx}`} total={total} onSelect={onSelectTotals} globalMode={globalMode} />
            ))}
          </div>

          {/* Desktop Table View */}
          <div 
            className="hidden md:block border border-t-0 overflow-x-auto rounded-b-lg"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)'
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Type</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Event</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Time (AEST)</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Line</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Bets Required</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Profit</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {totals.map((total, idx) => (
                  <TotalsRow key={`${total.event.id}-${idx}`} total={total} onSelect={onSelectTotals} globalMode={globalMode} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Middles */}
      {showMiddles && totalsMiddles.length > 0 && (
        <div>
          {/* Section Header */}
          <div 
            className="px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg border border-b-0"
            style={{ 
              borderColor: 'var(--border)',
              backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--surface))'
            }}
          >
            <span className="text-sm font-medium text-yellow-400">🎯 Totals Middles</span>
            <span className="text-xs ml-2 hidden sm:inline" style={{ color: 'var(--muted)' }}>Different lines create win-win zone</span>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 border border-t-0 rounded-b-lg p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            {totalsMiddles.map((middle, idx) => (
              <MiddleCard key={`${middle.event.id}-totals-middle-${idx}`} middle={middle} onSelect={onSelectMiddle} globalMode={globalMode} />
            ))}
          </div>

          {/* Desktop Table View */}
          <div 
            className="hidden md:block border border-t-0 overflow-x-auto rounded-b-lg"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)'
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Event</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Time</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Middle Zone</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Bets Required</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Max Loss</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>If Middle Hits</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {totalsMiddles.map((middle, idx) => (
                  <MiddleRow key={`${middle.event.id}-totals-middle-${idx}`} middle={middle} onSelect={onSelectMiddle} globalMode={globalMode} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile Totals Card
function TotalsCard({ total, onSelect, globalMode }: { total: TotalsArb; onSelect: (t: TotalsArb) => void; globalMode: boolean }) {
  const eventDate = new Date(total.event.commenceTime);
  const soon = isEventSoon(eventDate);
  const timeUntil = getTimeUntil(eventDate);

  return (
    <div 
      className="border rounded-lg overflow-hidden"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--background)'
      }}
    >
      {/* Header */}
      <div 
        className="px-3 py-2 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <TypeBadge type={total.type} />
          <span className="font-mono text-sm font-bold" style={{ color: 'var(--foreground)' }}>
            {total.line} <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>pts</span>
          </span>
        </div>
        <span 
          className="font-mono font-bold text-base"
          style={{ color: total.profitPercentage >= 0 ? 'var(--success)' : 'var(--muted)' }}
        >
          {total.profitPercentage >= 0 ? '+' : ''}{total.profitPercentage.toFixed(2)}%
        </span>
      </div>

      {/* Event Info */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
          {total.event.homeTeam} vs {total.event.awayTeam}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{total.event.sportTitle}</span>
          <span className={`text-xs ${soon ? 'text-yellow-500' : ''}`} style={soon ? {} : { color: 'var(--muted)' }}>
            {formatEventTimeShort(eventDate)} ({timeUntil})
          </span>
        </div>
      </div>

      {/* Bets */}
      <div className="px-3 py-2 space-y-2">
        <TotalsBetLineMobile 
          type="over"
          line={total.line}
          odds={total.over.odds}
          bookmaker={total.over.bookmaker}
          showRegion={globalMode}
          event={total.event}
        />
        <TotalsBetLineMobile 
          type="under"
          line={total.line}
          odds={total.under.odds}
          bookmaker={total.under.bookmaker}
          showRegion={globalMode}
          event={total.event}
        />
      </div>

      {/* Action */}
      <div className="px-3 py-2" style={{ backgroundColor: 'var(--surface)' }}>
        <button
          onClick={() => onSelect(total)}
          className="w-full py-2 text-sm font-medium rounded-lg transition-colors"
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

// Mobile Middle Card
function MiddleCard({ middle, onSelect, globalMode }: { middle: MiddleOpportunity; onSelect: (m: MiddleOpportunity) => void; globalMode: boolean }) {
  const eventDate = new Date(middle.event.commenceTime);
  const soon = isEventSoon(eventDate);

  return (
    <div 
      className="border rounded-lg overflow-hidden"
      style={{
        borderColor: 'color-mix(in srgb, var(--warning) 50%, var(--border))',
        backgroundColor: 'var(--background)'
      }}
    >
      {/* Header */}
      <div 
        className="px-3 py-2 flex items-center justify-between"
        style={{ 
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)'
        }}
      >
        <span className="text-yellow-400 font-medium text-sm">🎯 Middle</span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          ~{middle.middleProbability.toFixed(0)}% chance
        </span>
      </div>

      {/* Event Info */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
          {middle.event.homeTeam} vs {middle.event.awayTeam}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{middle.event.sportTitle}</span>
          <span className={`text-xs ${soon ? 'text-yellow-500' : ''}`} style={soon ? {} : { color: 'var(--muted)' }}>
            {formatEventTimeShort(eventDate)}
          </span>
        </div>
      </div>

      {/* Middle Zone */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-yellow-400 font-medium text-sm">
          {middle.middleRange.description}
        </div>
      </div>

      {/* Bets */}
      <div className="px-3 py-2 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookLogo bookKey={middle.side1.bookmaker} size={20} />
            <div className="flex items-center gap-1">
              <span className="text-green-400 font-medium">Over</span>
              <span className="font-mono" style={{ color: 'var(--foreground)' }}>{middle.side1.point}</span>
              <span style={{ color: 'var(--muted)' }}>@ {middle.side1.odds.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span style={{ color: 'var(--muted-foreground)' }}>{getBookmakerName(middle.side1.bookmaker)}</span>
            {globalMode && <RegionBadge bookmaker={middle.side1.bookmaker} />}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookLogo bookKey={middle.side2.bookmaker} size={20} />
            <div className="flex items-center gap-1">
              <span className="text-red-400 font-medium">Under</span>
              <span className="font-mono" style={{ color: 'var(--foreground)' }}>{middle.side2.point}</span>
              <span style={{ color: 'var(--muted)' }}>@ {middle.side2.odds.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span style={{ color: 'var(--muted-foreground)' }}>{getBookmakerName(middle.side2.bookmaker)}</span>
            {globalMode && <RegionBadge bookmaker={middle.side2.bookmaker} />}
          </div>
        </div>
      </div>

      {/* Outcomes */}
      <div 
        className="px-3 py-2 grid grid-cols-2 gap-2 text-center"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div>
          <div className="text-[10px] uppercase" style={{ color: 'var(--muted-foreground)' }}>Max Loss</div>
          <div className="font-mono text-sm" style={{ color: 'var(--danger)' }}>-${middle.guaranteedLoss.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase" style={{ color: 'var(--muted-foreground)' }}>If Middle Hits</div>
          <div className="font-mono text-sm text-green-400">+${middle.potentialProfit.toFixed(2)}</div>
        </div>
      </div>

      {/* Action */}
      <div className="px-3 py-2" style={{ backgroundColor: 'var(--surface)' }}>
        <button
          onClick={() => onSelect(middle)}
          className="w-full py-2 text-sm font-medium rounded-lg border border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black transition-colors"
        >
          Calculate Stakes
        </button>
      </div>
    </div>
  );
}

// Mobile Bet Line for Totals
function TotalsBetLineMobile({
  type,
  line,
  odds,
  bookmaker,
  showRegion,
  event,
}: {
  type: 'over' | 'under';
  line: number;
  odds: number;
  bookmaker: string;
  showRegion?: boolean;
  event: { homeTeam: string; awayTeam: string; sportTitle?: string; sportKey?: string; commenceTime?: any };
}) {
  const href = buildBookmakerSearchUrl(bookmaker, {
    home_team: event.homeTeam,
    away_team: event.awayTeam,
    sport_title: event.sportTitle,
    commence_time: String(event.commenceTime),
  }) ?? undefined;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <BookLogo bookKey={bookmaker} size={24} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${type === 'over' ? 'text-green-400' : 'text-red-400'}`}>
              {type === 'over' ? 'Over' : 'Under'}
            </span>
            <span className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>{line}</span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline truncate"
            >
              {getBookmakerName(bookmaker)}
            </a>
            {showRegion && <RegionBadge bookmaker={bookmaker} />}
          </div>
        </div>
      </div>
      <span className="font-mono text-sm shrink-0" style={{ color: 'var(--muted)' }}>@ {odds.toFixed(2)}</span>
    </div>
  );
}

// Desktop Totals Row
function TotalsRow({ total, onSelect, globalMode }: { total: TotalsArb; onSelect: (t: TotalsArb) => void; globalMode: boolean }) {
  const eventDate = new Date(total.event.commenceTime);
  const soon = isEventSoon(eventDate);
  const timeUntil = getTimeUntil(eventDate);

  const overHref = buildBookmakerSearchUrl(total.over.bookmaker, {
    home_team: total.event.homeTeam,
    away_team: total.event.awayTeam,
    sport_title: total.event.sportTitle,
    commence_time: String(total.event.commenceTime),
  }) ?? undefined;

  const underHref = buildBookmakerSearchUrl(total.under.bookmaker, {
    home_team: total.event.homeTeam,
    away_team: total.event.awayTeam,
    sport_title: total.event.sportTitle,
    commence_time: String(total.event.commenceTime),
  }) ?? undefined;

  return (
    <tr 
      className="hover:bg-[var(--background)] transition-colors"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <td className="px-4 py-3">
        <TypeBadge type={total.type} />
      </td>
      <td className="px-4 py-3">
        <div className="font-medium" style={{ color: 'var(--foreground)' }}>{total.event.homeTeam}</div>
        <div style={{ color: 'var(--muted)' }}>vs {total.event.awayTeam}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{total.event.sportTitle}</div>
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
        <span className="font-mono text-lg" style={{ color: 'var(--foreground)' }}>{total.line}</span>
        <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>pts</span>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookLogo bookKey={total.over.bookmaker} size={28} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-medium">Over</span>
                <span className="font-mono" style={{ color: 'var(--foreground)' }}>{total.line}</span>
                <span style={{ color: 'var(--muted)' }}>@ {total.over.odds.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <a
                  href={overHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: 'var(--muted-foreground)' }}
                  title="Open bookmaker search"
                >
                  {getBookmakerName(total.over.bookmaker)}
                </a>
                {globalMode && <RegionBadge bookmaker={total.over.bookmaker} />}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookLogo bookKey={total.under.bookmaker} size={28} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-medium">Under</span>
                <span className="font-mono" style={{ color: 'var(--foreground)' }}>{total.line}</span>
                <span style={{ color: 'var(--muted)' }}>@ {total.under.odds.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <a
                  href={underHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: 'var(--muted-foreground)' }}
                  title="Open bookmaker search"
                >
                  {getBookmakerName(total.under.bookmaker)}
                </a>
                {globalMode && <RegionBadge bookmaker={total.under.bookmaker} />}
              </div>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span 
          className="font-mono font-medium"
          style={{ color: total.profitPercentage >= 0 ? 'var(--foreground)' : 'var(--muted)' }}
        >
          {total.profitPercentage >= 0 ? '+' : ''}{total.profitPercentage.toFixed(2)}%
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onSelect(total)}
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

// Desktop Middle Row
function MiddleRow({ middle, onSelect, globalMode }: { middle: MiddleOpportunity; onSelect: (m: MiddleOpportunity) => void; globalMode: boolean }) {
  const eventDate = new Date(middle.event.commenceTime);
  const soon = isEventSoon(eventDate);

  return (
    <tr 
      className="hover:bg-[var(--background)] transition-colors"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <td className="px-4 py-3">
        <div className="font-medium" style={{ color: 'var(--foreground)' }}>{middle.event.homeTeam}</div>
        <div style={{ color: 'var(--muted)' }}>vs {middle.event.awayTeam}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{middle.event.sportTitle}</div>
      </td>
      <td className="px-4 py-3">
        <div className={soon ? 'text-yellow-500' : ''} style={soon ? {} : { color: 'var(--muted)' }}>
          {formatEventTime(eventDate)}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-yellow-400 font-medium text-sm">
          {middle.middleRange.description}
        </div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          ~{middle.middleProbability.toFixed(0)}% chance
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <BookLogo bookKey={middle.side1.bookmaker} size={24} />
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-green-400 font-medium">Over</span>
              <span className="font-mono" style={{ color: 'var(--foreground)' }}>{middle.side1.point}</span>
              <span style={{ color: 'var(--muted)' }}>@ {middle.side1.odds.toFixed(2)}</span>
              <span style={{ color: 'var(--muted-foreground)' }}>({getBookmakerName(middle.side1.bookmaker)})</span>
              {globalMode && <RegionBadge bookmaker={middle.side1.bookmaker} />}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookLogo bookKey={middle.side2.bookmaker} size={24} />
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-red-400 font-medium">Under</span>
              <span className="font-mono" style={{ color: 'var(--foreground)' }}>{middle.side2.point}</span>
              <span style={{ color: 'var(--muted)' }}>@ {middle.side2.odds.toFixed(2)}</span>
              <span style={{ color: 'var(--muted-foreground)' }}>({getBookmakerName(middle.side2.bookmaker)})</span>
              {globalMode && <RegionBadge bookmaker={middle.side2.bookmaker} />}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono" style={{ color: 'var(--danger)' }}>
          -${middle.guaranteedLoss.toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-green-400">
          +${middle.potentialProfit.toFixed(2)}
        </span>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          EV: {middle.expectedValue >= 0 ? '+' : ''}${middle.expectedValue.toFixed(2)}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onSelect(middle)}
          className="px-3 py-1 text-xs border border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black transition-colors rounded"
        >
          Calculate
        </button>
      </td>
    </tr>
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