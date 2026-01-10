// src/components/LineCalculatorModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { SpreadArb, TotalsArb, MiddleOpportunity } from '@/lib/types';
import type { PlacedBet } from '@/lib/bets';
import { generateBetId } from '@/lib/bets';

interface LineCalculatorModalProps {
  opportunity: SpreadArb | TotalsArb | MiddleOpportunity | null;
  onClose: () => void;
  onLogBet?: (bet: PlacedBet) => void;
}

export function LineCalculatorModal({ opportunity, onClose, onLogBet }: LineCalculatorModalProps) {
  const [totalStake, setTotalStake] = useState(100);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (opportunity) {
      setTotalStake(100);
    }
  }, [opportunity]);

  if (!opportunity) return null;

  const isMiddle = opportunity.mode === 'middle';
  const isSpread = opportunity.mode === 'spread';
  const isTotals = opportunity.mode === 'totals';

  // Calculate stakes
  let stake1 = 0;
  let stake2 = 0;
  let return1 = 0;
  let return2 = 0;
  let profit1 = 0;
  let profit2 = 0;
  let odds1 = 0;
  let odds2 = 0;

  if (isMiddle) {
    // For middles, equal stakes on both sides
    stake1 = totalStake / 2;
    stake2 = totalStake / 2;
    odds1 = opportunity.side1.odds;
    odds2 = opportunity.side2.odds;
    return1 = stake1 * odds1;
    return2 = stake2 * odds2;
    // If middle misses, one wins
    profit1 = return1 - totalStake;
    profit2 = return2 - totalStake;
  } else if (isSpread) {
    odds1 = opportunity.favorite.odds;
    odds2 = opportunity.underdog.odds;
    const impliedSum = (1 / odds1) + (1 / odds2);
    stake1 = totalStake * (1 / odds1) / impliedSum;
    stake2 = totalStake * (1 / odds2) / impliedSum;
    return1 = stake1 * odds1;
    return2 = stake2 * odds2;
    profit1 = return1 - totalStake;
    profit2 = return2 - totalStake;
  } else if (isTotals) {
    odds1 = opportunity.over.odds;
    odds2 = opportunity.under.odds;
    const impliedSum = (1 / odds1) + (1 / odds2);
    stake1 = totalStake * (1 / odds1) / impliedSum;
    stake2 = totalStake * (1 / odds2) / impliedSum;
    return1 = stake1 * odds1;
    return2 = stake2 * odds2;
    profit1 = return1 - totalStake;
    profit2 = return2 - totalStake;
  }

  const guaranteedProfit = Math.min(profit1, profit2);
  const profitPercent = (guaranteedProfit / totalStake) * 100;

  const handleCopy = () => {
    let text = '';
    
    if (isMiddle) {
      text = `MIDDLE OPPORTUNITY
${opportunity.event.homeTeam} vs ${opportunity.event.awayTeam}

${opportunity.side1.name}: $${stake1.toFixed(2)} @ ${odds1.toFixed(2)} (${opportunity.side1.bookmaker})
${opportunity.side2.name}: $${stake2.toFixed(2)} @ ${odds2.toFixed(2)} (${opportunity.side2.bookmaker})

Middle Zone: ${opportunity.middleRange.description}
If middle hits: +$${opportunity.potentialProfit.toFixed(2)}
If middle misses: -$${Math.abs(guaranteedProfit).toFixed(2)}
Expected Value: ${opportunity.expectedValue >= 0 ? '+' : ''}$${opportunity.expectedValue.toFixed(2)}`;
    } else if (isSpread) {
      text = `SPREAD ARB
${opportunity.event.homeTeam} vs ${opportunity.event.awayTeam}
Line: ${opportunity.line}

${opportunity.favorite.name} ${opportunity.favorite.point}: $${stake1.toFixed(2)} @ ${odds1.toFixed(2)} (${opportunity.favorite.bookmaker})
${opportunity.underdog.name} ${opportunity.underdog.point}: $${stake2.toFixed(2)} @ ${odds2.toFixed(2)} (${opportunity.underdog.bookmaker})

Guaranteed Profit: $${guaranteedProfit.toFixed(2)} (${profitPercent.toFixed(2)}%)`;
    } else {
      text = `TOTALS ARB
${opportunity.event.homeTeam} vs ${opportunity.event.awayTeam}
Line: ${opportunity.line}

Over ${opportunity.line}: $${stake1.toFixed(2)} @ ${odds1.toFixed(2)} (${opportunity.over.bookmaker})
Under ${opportunity.line}: $${stake2.toFixed(2)} @ ${odds2.toFixed(2)} (${opportunity.under.bookmaker})

Guaranteed Profit: $${guaranteedProfit.toFixed(2)} (${profitPercent.toFixed(2)}%)`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-start justify-center p-4 py-8">
        <div className="w-full max-w-xl bg-[#0a0a0a] border border-[#222] relative">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#0a0a0a]">
            <div>
              <h2 className="font-medium">
                {isMiddle ? '🎯 Middle Calculator' : isSpread ? 'Spread Calculator' : 'Totals Calculator'}
              </h2>
              <p className="text-sm text-[#666]">
                {opportunity.event.homeTeam} vs {opportunity.event.awayTeam}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#666] hover:text-white hover:bg-[#222] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Middle Warning */}
            {isMiddle && (
              <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-700/50">
                <span className="text-yellow-400">⚠️</span>
                <div>
                  <div className="font-medium text-yellow-400">Middle Opportunity</div>
                  <div className="text-sm text-[#888]">
                    This is NOT a guaranteed arb. You win big if the middle hits, but lose if it doesn&apos;t.
                    EV: {opportunity.expectedValue >= 0 ? '+' : ''}${opportunity.expectedValue.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Total Stake */}
            <div>
              <label className="block text-xs text-[#666] uppercase tracking-wide mb-2">
                Total Stake
              </label>
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[120px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]">$</span>
                  <input
                    type="number"
                    value={totalStake}
                    onChange={e => setTotalStake(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#111] border border-[#333] px-3 py-2 pl-7 font-mono focus:border-white focus:outline-none"
                  />
                </div>
                {[50, 100, 250, 500].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setTotalStake(amount)}
                    className={`px-3 py-2 text-sm border transition-colors ${
                      totalStake === amount
                        ? 'bg-white text-black border-white'
                        : 'border-[#333] text-[#888] hover:border-[#555]'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Stakes Breakdown */}
            <div className="space-y-4">
              {/* Bet 1 */}
              <div className="bg-[#111] border border-[#222] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    {isMiddle && <span className="text-sm text-[#888]">{opportunity.side1.name}</span>}
                    {isSpread && (
                      <span className="text-sm">
                        <span className="text-[#888]">{opportunity.favorite.name}</span>
                        <span className="font-mono text-white ml-2">{opportunity.favorite.point}</span>
                      </span>
                    )}
                    {isTotals && (
                      <span className="text-sm">
                        <span className="text-green-400">Over</span>
                        <span className="font-mono text-white ml-2">{opportunity.line}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#555]">
                    {isMiddle ? opportunity.side1.bookmaker : isSpread ? opportunity.favorite.bookmaker : opportunity.over.bookmaker}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-mono">
                    <span className="text-[#666]">$</span>
                    <span className="text-white">{stake1.toFixed(2)}</span>
                    <span className="text-[#666] text-sm ml-2">@ {odds1.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#666]">Returns</div>
                    <div className="font-mono text-white">${return1.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Bet 2 */}
              <div className="bg-[#111] border border-[#222] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    {isMiddle && <span className="text-sm text-[#888]">{opportunity.side2.name}</span>}
                    {isSpread && (
                      <span className="text-sm">
                        <span className="text-[#888]">{opportunity.underdog.name}</span>
                        <span className="font-mono text-white ml-2">+{opportunity.underdog.point}</span>
                      </span>
                    )}
                    {isTotals && (
                      <span className="text-sm">
                        <span className="text-red-400">Under</span>
                        <span className="font-mono text-white ml-2">{opportunity.line}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#555]">
                    {isMiddle ? opportunity.side2.bookmaker : isSpread ? opportunity.underdog.bookmaker : opportunity.under.bookmaker}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-mono">
                    <span className="text-[#666]">$</span>
                    <span className="text-white">{stake2.toFixed(2)}</span>
                    <span className="text-[#666] text-sm ml-2">@ {odds2.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#666]">Returns</div>
                    <div className="font-mono text-white">${return2.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            {isMiddle ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0a1a0a] border border-[#1a3a1a] p-4 text-center">
                  <div className="text-xs text-[#4a8a4a] uppercase tracking-wide mb-1">If Middle Hits</div>
                  <div className="font-mono text-2xl text-green-400">
                    +${((stake1 * odds1) + (stake2 * odds2) - totalStake).toFixed(2)}
                  </div>
                </div>
                <div className="bg-[#1a0a0a] border border-[#3a1a1a] p-4 text-center">
                  <div className="text-xs text-[#8a4a4a] uppercase tracking-wide mb-1">If Middle Misses</div>
                  <div className="font-mono text-2xl text-red-400">
                    ${guaranteedProfit.toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0a1a0a] border border-[#1a3a1a] p-4 text-center">
                <div className="text-xs text-[#4a8a4a] uppercase tracking-wide mb-1">Guaranteed Profit</div>
                <div className="font-mono text-2xl text-green-400">
                  +${guaranteedProfit.toFixed(2)}
                </div>
                <div className="text-sm text-[#4a8a4a] mt-1">
                  {profitPercent.toFixed(2)}% return
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#333] text-[#888] hover:bg-[#111] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white text-black font-medium hover:bg-[#eee] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}