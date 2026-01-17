// src/components/ArbTable.tsx
'use client';

import type { ArbOpportunity } from '@/lib/types';
import { getBookmakerName, getBookmakerRegion } from '@/lib/config';

interface ArbTableProps {
  opportunities: ArbOpportunity[];
  onSelectArb: (arb: ArbOpportunity) => void;
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
    <span className={`text-xs px-1 py-0.5 rounded ${colors[region] || colors.INT}`}>
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

export function ArbTable({ opportunities, onSelectArb, globalMode = false }: ArbTableProps) {
  if (opportunities.length === 0) {
    return (
      <div 
        className="border p-12 text-center rounded-lg"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)'
        }}
      >
        <p style={{ color: 'var(--muted)' }} className="mb-2">No arbitrage opportunities found</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Click Scan to search for opportunities, or adjust filters
        </p>
      </div>
    );
  }

  return (
    <div 
      className="border overflow-x-auto rounded-lg"
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
  );
}

function ArbRow({ opp, onSelect, globalMode }: { opp: ArbOpportunity; onSelect: (arb: ArbOpportunity) => void; globalMode: boolean }) {
  const eventDate = new Date(opp.event.commenceTime);
  const soon = isEventSoon(eventDate);
  const timeUntil = getTimeUntil(eventDate);

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
            />
            <BetLine 
              name={opp.outcome2.name} 
              odds={opp.outcome2.odds} 
              bookmaker={opp.outcome2.bookmaker}
              showRegion={globalMode}
            />
            {opp.outcome3 && (
              <BetLine 
                name={opp.outcome3.name} 
                odds={opp.outcome3.odds} 
                bookmaker={opp.outcome3.bookmaker}
                showRegion={globalMode}
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
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">Lay</span>
                <span className="font-mono" style={{ color: 'var(--foreground)' }}>{opp.layOutcome.odds.toFixed(2)}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Betfair Exchange</div>
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

function BetLine({ name, odds, bookmaker, showRegion }: { name: string; odds: number; bookmaker: string; showRegion?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{name}</span>
        <span className="font-mono" style={{ color: 'var(--foreground)' }}>{odds.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        <span>{getBookmakerName(bookmaker)}</span>
        {showRegion && <RegionBadge bookmaker={bookmaker} />}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'arb') {
    return (
      <span 
        className="inline-block px-2 py-0.5 text-xs font-medium rounded"
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
      className="inline-block px-2 py-0.5 text-xs font-medium rounded"
      style={{
        backgroundColor: 'var(--surface-secondary)',
        color: 'var(--muted)'
      }}
    >
      NEAR
    </span>
  );
}
