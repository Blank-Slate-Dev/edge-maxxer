// src/components/ValueBetCalculatorModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, TrendingUp } from 'lucide-react';
import type { ValueBet } from '@/lib/types';
import type { PlacedBet } from '@/lib/bets';
import { generateBetId } from '@/lib/bets';

interface ValueBetCalculatorModalProps {
  valueBet: ValueBet | null;
  onClose: () => void;
  onLogBet?: (bet: PlacedBet) => void;
}

export function ValueBetCalculatorModal({ valueBet, onClose, onLogBet }: ValueBetCalculatorModalProps) {
  const [stake, setStake] = useState(100);
  const [copied, setCopied] = useState(false);
  const [betLogged, setBetLogged] = useState(false);

  useEffect(() => {
    if (valueBet) {
      setBetLogged(false);
    }
  }, [valueBet]);

  if (!valueBet) return null;

  const odds = valueBet.outcome.odds;
  const marketAvg = valueBet.marketAverage;
  const edge = valueBet.valuePercentage;
  
  // Potential return if bet wins
  const potentialReturn = stake * odds;
  const potentialProfit = potentialReturn - stake;
  
  // Implied probability from the odds you're getting
  const impliedProb = (1 / odds) * 100;
  
  // "Fair" probability based on market average
  const fairProb = (1 / marketAvg) * 100;
  
  // Expected Value calculation
  // EV = (probability of winning × profit if win) - (probability of losing × stake)
  // Using fair probability as estimate of true probability
  const winProb = fairProb / 100;
  const loseProb = 1 - winProb;
  const expectedValue = (winProb * potentialProfit) - (loseProb * stake);
  const evPercentage = (expectedValue / stake) * 100;

  const handleCopy = () => {
    const text = `${valueBet.event.homeTeam} vs ${valueBet.event.awayTeam}
VALUE BET

${valueBet.outcome.name} @ ${odds.toFixed(2)} (${valueBet.outcome.bookmaker})
Market Average: ${marketAvg.toFixed(2)}
Edge: +${edge.toFixed(1)}%

Stake: $${stake.toFixed(2)}
Potential Return: $${potentialReturn.toFixed(2)}
Potential Profit: $${potentialProfit.toFixed(2)}

Expected Value: ${expectedValue >= 0 ? '+' : ''}$${expectedValue.toFixed(2)} (${evPercentage >= 0 ? '+' : ''}${evPercentage.toFixed(1)}% EV)

⚠️ This is a VALUE BET, not an arbitrage. Profit is NOT guaranteed.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogBet = () => {
    if (!onLogBet) return;

    const bet: PlacedBet = {
      id: generateBetId(),
      createdAt: new Date().toISOString(),
      event: {
        homeTeam: valueBet.event.homeTeam,
        awayTeam: valueBet.event.awayTeam,
        sportKey: valueBet.event.sportKey,
        commenceTime: valueBet.event.commenceTime.toISOString(),
      },
      mode: 'value-bet' as any,
      expectedProfit: expectedValue,
      status: 'pending',
      bet1: {
        bookmaker: valueBet.outcome.bookmaker,
        outcome: valueBet.outcome.name,
        odds: odds,
        stake: stake,
      },
    };

    onLogBet(bet);
    setBetLogged(true);
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
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#888]" />
              <h2 className="font-medium">Value Bet Calculator</h2>
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
            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-[#111] border border-[#333]">
              <TrendingUp className="w-5 h-5 text-[#888] shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-[#888]">Value Bet (Not Guaranteed)</div>
                <div className="text-sm text-[#666]">
                  This is a single bet with better-than-market odds. You could still lose if the outcome doesn&apos;t happen. The edge represents how much better the odds are compared to other bookmakers.
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="text-center pb-4 border-b border-[#222]">
              <div className="font-medium text-lg">{valueBet.event.homeTeam}</div>
              <div className="text-[#666]">vs</div>
              <div className="font-medium text-lg">{valueBet.event.awayTeam}</div>
              <div className="text-xs text-[#555] mt-2">{valueBet.event.sportTitle}</div>
            </div>

            {/* Stake Input */}
            <div>
              <label className="block text-xs text-[#666] uppercase tracking-wide mb-2">
                Stake Amount
              </label>
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[120px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]">$</span>
                  <input
                    type="number"
                    value={stake}
                    onChange={e => setStake(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#111] border border-[#333] px-3 py-2 pl-7 font-mono focus:border-white focus:outline-none"
                  />
                </div>
                {[50, 100, 250, 500].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setStake(amount)}
                    className={`px-3 py-2 text-sm border transition-colors ${
                      stake === amount
                        ? 'bg-white text-black border-white'
                        : 'border-[#333] text-[#888] hover:border-[#555]'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* The Bet */}
            <div className="bg-[#111] border border-[#222] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#666] uppercase tracking-wide">Your Bet</span>
                <span className="text-xs text-[#555]">{valueBet.outcome.bookmaker}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#888]">{valueBet.outcome.name}</span>
                <span className="font-mono text-white text-lg">@ {odds.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-lg">
                <span className="font-medium">Stake</span>
                <span className="font-mono font-medium">${stake.toFixed(2)}</span>
              </div>
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111] border border-[#222] p-4">
                <div className="text-xs text-[#666] uppercase tracking-wide mb-1">Your Odds</div>
                <div className="font-mono text-xl text-white">{odds.toFixed(2)}</div>
                <div className="text-xs text-[#555]">Implied: {impliedProb.toFixed(1)}%</div>
              </div>
              <div className="bg-[#111] border border-[#222] p-4">
                <div className="text-xs text-[#666] uppercase tracking-wide mb-1">Market Avg</div>
                <div className="font-mono text-xl text-[#666]">{marketAvg.toFixed(2)}</div>
                <div className="text-xs text-[#555]">Implied: {fairProb.toFixed(1)}%</div>
              </div>
            </div>

            {/* Edge Highlight */}
            <div className="bg-[#0a1a0a] border border-[#1a3a1a] p-4 text-center">
              <div className="text-xs text-[#4a8a4a] uppercase tracking-wide mb-1">Your Edge</div>
              <div className="font-mono text-2xl text-[#6aba6a]">+{edge.toFixed(1)}%</div>
              <div className="text-xs text-[#4a8a4a] mt-1">Better odds than market average</div>
            </div>

            {/* Outcomes */}
            <div className="space-y-3">
              <div className="bg-[#161616] border border-[#333] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#888]">If {valueBet.outcome.name} wins</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#666]">Return</span>
                  <span className="font-mono text-white">${potentialReturn.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#666]">Profit</span>
                  <span className="font-mono text-white">+${potentialProfit.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-[#1a1616] border border-[#332222] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#888]">If {valueBet.outcome.name} loses</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#666]">Loss</span>
                  <span className="font-mono text-[#aa6666]">-${stake.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Expected Value */}
            <div className="bg-[#161616] border border-[#333] p-4">
              <div className="text-xs text-[#666] uppercase tracking-wide mb-2">Expected Value (EV)</div>
              <div className="flex items-center justify-between">
                <span className="text-[#888]">Based on market probability</span>
                <div className="text-right">
                  <span className={`font-mono font-medium text-lg ${expectedValue >= 0 ? 'text-white' : 'text-[#888]'}`}>
                    {expectedValue >= 0 ? '+' : ''}${expectedValue.toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm text-[#888]">({evPercentage >= 0 ? '+' : ''}{evPercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="text-xs text-[#555] mt-2">
                EV = ({(fairProb).toFixed(0)}% × ${potentialProfit.toFixed(0)}) - ({(100 - fairProb).toFixed(0)}% × ${stake.toFixed(0)})
              </div>
            </div>

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
              {onLogBet && (
                <button
                  onClick={handleLogBet}
                  disabled={betLogged}
                  className={`flex-1 px-4 py-2.5 font-medium transition-colors ${
                    betLogged
                      ? 'bg-[#222] text-[#666] cursor-not-allowed'
                      : 'bg-white text-black hover:bg-[#eee]'
                  }`}
                >
                  {betLogged ? 'Bet Logged' : 'Log Bet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
