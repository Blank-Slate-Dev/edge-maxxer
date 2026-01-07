// src/components/ArbTable.tsx
'use client';

import { format } from 'date-fns';
import type { ArbOpportunity, BookVsBookArb } from '@/lib/types';

interface ArbTableProps {
  opportunities: ArbOpportunity[];
  onSelectArb: (arb: ArbOpportunity) => void;
}

export function ArbTable({ opportunities, onSelectArb }: ArbTableProps) {
  if (opportunities.length === 0) {
    return (
      <div className="border border-[#222] bg-[#0a0a0a] p-12 text-center">
        <p className="text-[#888] mb-2">No opportunities found</p>
        <p className="text-xs text-[#555]">
          Try adjusting filters or scan again later. True arbs are rare and close quickly.
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
              Time
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
            <ArbRow key={`${opp.event.id}-${idx}`} opp={opp} onSelect={onSelectArb} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArbRow({ opp, onSelect }: { opp: ArbOpportunity; onSelect: (arb: ArbOpportunity) => void }) {
  const isThreeWay = opp.mode === 'book-vs-book' && (opp as BookVsBookArb).outcomes === 3;
  
  return (
    <tr className="border-b border-[#222] hover:bg-[#111] transition-colors">
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <TypeBadge type={opp.type} />
          {isThreeWay && (
            <span className="text-xs text-[#555]">3-way</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium">{opp.event.homeTeam}</div>
        <div className="text-[#666]">vs {opp.event.awayTeam}</div>
        <div className="text-xs text-[#555] mt-1">{opp.event.sportTitle}</div>
      </td>
      <td className="px-4 py-3 text-[#888]">
        {format(new Date(opp.event.commenceTime), 'MMM d, HH:mm')}
      </td>
      <td className="px-4 py-3">
        {opp.mode === 'book-vs-book' ? (
          <BookVsBookBets arb={opp as BookVsBookArb} />
        ) : (
          <BetfairBets arb={opp} />
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`font-mono font-medium ${
          opp.profitPercentage >= 0 
            ? 'text-white' 
            : opp.profitPercentage >= -1 
              ? 'text-[#888]' 
              : 'text-[#666]'
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

function BookVsBookBets({ arb }: { arb: BookVsBookArb }) {
  const isThreeWay = arb.outcomes === 3;
  
  return (
    <div className="space-y-2">
      <BetLine name={arb.outcome1.name} odds={arb.outcome1.odds} bookmaker={arb.outcome1.bookmaker} />
      <BetLine name={arb.outcome2.name} odds={arb.outcome2.odds} bookmaker={arb.outcome2.bookmaker} />
      {isThreeWay && arb.outcome3 && (
        <BetLine name={arb.outcome3.name} odds={arb.outcome3.odds} bookmaker={arb.outcome3.bookmaker} />
      )}
    </div>
  );
}

function BetfairBets({ arb }: { arb: ArbOpportunity }) {
  if (arb.mode !== 'book-vs-betfair') return null;
  
  return (
    <div className="space-y-2">
      <div>
        <div className="font-mono">{arb.backOutcome.odds.toFixed(2)}</div>
        <div className="text-xs text-[#666]">Back {arb.backOutcome.name}</div>
        <div className="text-xs text-[#555]">@ {arb.backOutcome.bookmaker}</div>
      </div>
      <div>
        <div className="font-mono">{arb.layOutcome.odds.toFixed(2)}</div>
        <div className="text-xs text-[#666]">Lay {arb.layOutcome.name}</div>
        <div className="text-xs text-[#555]">@ Betfair</div>
      </div>
    </div>
  );
}

function BetLine({ name, odds, bookmaker }: { name: string; odds: number; bookmaker: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-white">{odds.toFixed(2)}</span>
        <span className="text-[#666]">{name}</span>
      </div>
      <div className="text-xs text-[#555]">@ {bookmaker}</div>
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
