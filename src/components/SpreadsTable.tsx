// src/components/SpreadsTable.tsx
'use client';

import type { SpreadArb, MiddleOpportunity } from '@/lib/types';
import { getBookmakerName, getBookmakerRegion } from '@/lib/config';

interface SpreadsTableProps {
  spreads: SpreadArb[];
  middles: MiddleOpportunity[];
  onSelectSpread: (spread: SpreadArb) => void;
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

export function SpreadsTable({ spreads, middles, onSelectSpread, onSelectMiddle, showMiddles, globalMode = false }: SpreadsTableProps) {
  const hasContent = spreads.length > 0 || (showMiddles && middles.length > 0);

  if (!hasContent) {
    return (
      <div className="border border-[#222] bg-[#0a0a0a] p-12 text-center">
        <p className="text-[#888] mb-2">No spread opportunities found</p>
        <p className="text-xs text-[#555]">
          Spreads/lines are mainly available for US sports (NBA, NFL, NHL, MLB). 
          AU coverage is limited.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Spread Arbs */}
      {spreads.length > 0 && (
        <div className="border border-[#222] bg-[#0a0a0a] overflow-x-auto">
          <div className="px-4 py-3 border-b border-[#222] bg-[#111]">
            <span className="text-sm font-medium">Spread Arbitrage</span>
            <span className="text-xs text-[#666] ml-2">Same line across bookies</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Type</th>
                <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Event</th>
                <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Time (AEST)</th>
                <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Line</th>
                <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Bets Required</th>
                <th className="text-right px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Profit</th>
                <th className="text-right px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {spreads.map((spread, idx) => (
                <SpreadRow key={`${spread.event.id}-${idx}`} spread={spread} onSelect={onSelectSpread} globalMode={globalMode} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Middles */}
      {showMiddles && middles.filter(m => m.marketType === 'spreads').length > 0 && (
        <div className="border border-[#222] bg-[#0a0a0a] overflow-x-auto">
          <div className="px-4 py-3 border-b border-[#222] bg-[#1a1a16]">
            <span className="text-sm font-medium text-yellow-400">🎯 Middle Opportunities</span>
            <span className="text-xs text-[#666] ml-2">Different lines create win-win zone</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Event</th>
                <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Time</th>
                <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Middle Zone</th>
                <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Bets Required</th>
                <th className="text-right px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Max Loss</th>
                <th className="text-right px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">If Middle Hits</th>
                <th className="text-right px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {middles.filter(m => m.marketType === 'spreads').map((middle, idx) => (
                <MiddleRow key={`${middle.event.id}-middle-${idx}`} middle={middle} onSelect={onSelectMiddle} globalMode={globalMode} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SpreadRow({ spread, onSelect, globalMode }: { spread: SpreadArb; onSelect: (s: SpreadArb) => void; globalMode: boolean }) {
  const eventDate = new Date(spread.event.commenceTime);
  const soon = isEventSoon(eventDate);
  const timeUntil = getTimeUntil(eventDate);

  return (
    <tr className="border-b border-[#222] hover:bg-[#111] transition-colors">
      <td className="px-4 py-3">
        <TypeBadge type={spread.type} />
      </td>
      <td className="px-4 py-3">
        <div className="font-medium">{spread.event.homeTeam}</div>
        <div className="text-[#666]">vs {spread.event.awayTeam}</div>
        <div className="text-xs text-[#555] mt-1">{spread.event.sportTitle}</div>
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
        <span className="font-mono text-lg text-white">{spread.line > 0 ? '+' : ''}{spread.line}</span>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <BetLine 
            name={spread.favorite.name} 
            odds={spread.favorite.odds} 
            bookmaker={spread.favorite.bookmaker}
            point={spread.favorite.point}
            showRegion={globalMode}
          />
          <BetLine 
            name={spread.underdog.name} 
            odds={spread.underdog.odds} 
            bookmaker={spread.underdog.bookmaker}
            point={spread.underdog.point}
            showRegion={globalMode}
          />
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`font-mono font-medium ${
          spread.profitPercentage >= 0 ? 'text-white' : 'text-[#666]'
        }`}>
          {spread.profitPercentage >= 0 ? '+' : ''}{spread.profitPercentage.toFixed(2)}%
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onSelect(spread)}
          className="px-3 py-1 text-xs border border-[#333] text-[#888] hover:bg-white hover:text-black hover:border-white transition-colors"
        >
          Calculate
        </button>
      </td>
    </tr>
  );
}

function MiddleRow({ middle, onSelect, globalMode }: { middle: MiddleOpportunity; onSelect: (m: MiddleOpportunity) => void; globalMode: boolean }) {
  const eventDate = new Date(middle.event.commenceTime);
  const soon = isEventSoon(eventDate);

  return (
    <tr className="border-b border-[#222] hover:bg-[#111] transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium">{middle.event.homeTeam}</div>
        <div className="text-[#666]">vs {middle.event.awayTeam}</div>
        <div className="text-xs text-[#555] mt-1">{middle.event.sportTitle}</div>
      </td>
      <td className="px-4 py-3">
        <div className={`${soon ? 'text-yellow-500' : 'text-[#888]'}`}>
          {formatEventTime(eventDate)}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-yellow-400 font-medium text-sm">
          {middle.middleRange.description}
        </div>
        <div className="text-xs text-[#666]">
          ~{middle.middleProbability.toFixed(0)}% chance
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-mono text-white">{middle.side1.point > 0 ? '+' : ''}{middle.side1.point}</span>
            <span className="text-[#666]">@ {middle.side1.odds.toFixed(2)}</span>
            <span className="text-[#555]">({getBookmakerName(middle.side1.bookmaker)})</span>
            {globalMode && <RegionBadge bookmaker={middle.side1.bookmaker} />}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-mono text-white">{middle.side2.point > 0 ? '+' : ''}{middle.side2.point}</span>
            <span className="text-[#666]">@ {middle.side2.odds.toFixed(2)}</span>
            <span className="text-[#555]">({getBookmakerName(middle.side2.bookmaker)})</span>
            {globalMode && <RegionBadge bookmaker={middle.side2.bookmaker} />}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-[#aa6666]">
          -${middle.guaranteedLoss.toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-green-400">
          +${middle.potentialProfit.toFixed(2)}
        </span>
        <div className="text-xs text-[#666]">
          EV: {middle.expectedValue >= 0 ? '+' : ''}${middle.expectedValue.toFixed(2)}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onSelect(middle)}
          className="px-3 py-1 text-xs border border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black transition-colors"
        >
          Calculate
        </button>
      </td>
    </tr>
  );
}

function BetLine({ name, odds, bookmaker, point, showRegion }: { name: string; odds: number; bookmaker: string; point: number; showRegion?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-white">{point > 0 ? '+' : ''}{point}</span>
        <span className="text-[#888]">@ {odds.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-[#555]">
        <span>{name} ({getBookmakerName(bookmaker)})</span>
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