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
      <div className="border border-[#222] bg-[#0a0a0a] p-12 text-center">
        <p className="text-[#888] mb-2">No arbitrage opportunities found</p>
        <p className="text-xs text-[#555]">
          Click Scan to search for opportunities, or adjust filters
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#222] bg-[#0a0a0a] overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#222]">
            <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Type
            </th>
            <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Event
            </th>
            <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Time (AEST)
            </th>
            <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Bets Required
            </th>
            <th className="text-right px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Profit
            </th>
            <th className="text-right px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
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
    <tr className="border-b border-[#222] hover:bg-[#111] transition-colors">
      <td className="px-4 py-3">
        <TypeBadge type={opp.type} />
        {opp.mode === 'book-vs-betfair' && (
          <span className="ml-1 text-xs px-1.5 py-0.5 bg-purple-900/50 text-purple-400">
            BF
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium">{opp.event.homeTeam}</div>
        <div className="text-[#666]">vs {opp.event.awayTeam}</div>
        <div className="text-xs text-[#555] mt-1">{opp.event.sportTitle}</div>
      </td>
      <td className="px-4 py-3">
        <div className={`${soon ? 'text-yellow-500' : 'text-[#888]'}`}>
          {formatEventTime(eventDate)}
        </div>
        <div className={`text-xs mt-0.5 ${soon ? 'text-yellow-500' : 'text-[#555]'}`}>
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
                <span className="font-mono text-white">{opp.layOutcome.odds.toFixed(2)}</span>
              </div>
              <div className="text-xs text-[#555]">Betfair Exchange</div>
            </div>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`font-mono font-medium ${
          opp.profitPercentage >= 0 ? 'text-white' : 'text-[#666]'
        }`}>
          {opp.profitPercentage >= 0 ? '+' : ''}{opp.profitPercentage.toFixed(2)}%
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onSelect(opp)}
          className="px-3 py-1 text-xs border border-[#333] text-[#888] hover:bg-white hover:text-black hover:border-white transition-colors"
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
        <span className="text-white font-medium">{name}</span>
        <span className="font-mono text-white">{odds.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-[#555]">
        <span>{getBookmakerName(bookmaker)}</span>
        {showRegion && <RegionBadge bookmaker={bookmaker} />}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'arb') {
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white text-black">
        ARB
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-[#333] text-[#888]">
      NEAR
    </span>
  );
}
