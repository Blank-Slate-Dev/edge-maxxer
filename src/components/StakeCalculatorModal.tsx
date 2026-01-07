// src/components/StakeCalculatorModal.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check, AlertTriangle, Edit2 } from 'lucide-react';
import type { ArbOpportunity, BookVsBookArb, BookVsBetfairArb, BookVsBookStakes } from '@/lib/types';
import type { PlacedBet } from '@/lib/bets';
import { generateBetId } from '@/lib/bets';

interface StakeCalculatorModalProps {
  arb: ArbOpportunity | null;
  onClose: () => void;
  onLogBet?: (bet: PlacedBet) => void;
}

export function StakeCalculatorModal({ arb, onClose, onLogBet }: StakeCalculatorModalProps) {
  const [totalStake, setTotalStake] = useState(100);
  const [copied, setCopied] = useState(false);
  const [betLogged, setBetLogged] = useState(false);
  
  // Editable odds state
  const [odds1, setOdds1] = useState(0);
  const [odds2, setOdds2] = useState(0);
  const [odds3, setOdds3] = useState(0);
  const [oddsChanged, setOddsChanged] = useState(false);

  useEffect(() => {
    if (arb) {
      setBetLogged(false);
      setOddsChanged(false);
      if (arb.mode === 'book-vs-book') {
        const a = arb as BookVsBookArb;
        setOdds1(a.outcome1.odds);
        setOdds2(a.outcome2.odds);
        if (a.outcome3) {
          setOdds3(a.outcome3.odds);
        }
      }
    }
  }, [arb]);

  const isBookVsBook = arb?.mode === 'book-vs-book';
  const isThreeWay = isBookVsBook && (arb as BookVsBookArb).outcomes === 3;

  // Calculate with current (possibly edited) odds
  const calc = useMemo(() => {
    if (!arb || !isBookVsBook) return null;
    
    const w1 = 1 / odds1;
    const w2 = 1 / odds2;
    const w3 = isThreeWay ? 1 / odds3 : 0;
    const totalWeight = w1 + w2 + w3;
    
    const stake1 = totalStake * (w1 / totalWeight);
    const stake2 = totalStake * (w2 / totalWeight);
    const stake3 = isThreeWay ? totalStake * (w3 / totalWeight) : 0;
    
    const returnOnOutcome1 = stake1 * odds1;
    const returnOnOutcome2 = stake2 * odds2;
    const returnOnOutcome3 = isThreeWay ? stake3 * odds3 : 0;
    
    const impliedSum = w1 + w2 + w3;
    const guaranteedProfit = returnOnOutcome1 - totalStake;
    const profitPercentage = (guaranteedProfit / totalStake) * 100;
    
    return {
      stake1: Math.round(stake1 * 100) / 100,
      stake2: Math.round(stake2 * 100) / 100,
      stake3: isThreeWay ? Math.round(stake3 * 100) / 100 : undefined,
      returnOnOutcome1: Math.round(returnOnOutcome1 * 100) / 100,
      returnOnOutcome2: Math.round(returnOnOutcome2 * 100) / 100,
      returnOnOutcome3: isThreeWay ? Math.round(returnOnOutcome3 * 100) / 100 : undefined,
      impliedSum,
      guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
      profitPercentage: Math.round(profitPercentage * 100) / 100,
      isProfitable: impliedSum < 1,
    };
  }, [arb, isBookVsBook, isThreeWay, odds1, odds2, odds3, totalStake]);

  if (!arb || !isBookVsBook) return null;

  const a = arb as BookVsBookArb;

  const handleOddsChange = (outcome: 1 | 2 | 3, value: string) => {
    const numValue = parseFloat(value) || 0;
    setOddsChanged(true);
    if (outcome === 1) setOdds1(numValue);
    else if (outcome === 2) setOdds2(numValue);
    else setOdds3(numValue);
  };

  const handleCopy = () => {
    if (!calc) return;
    
    let text = `${a.event.homeTeam} vs ${a.event.awayTeam}
${isThreeWay ? '(3-WAY MARKET - ALL 3 BETS REQUIRED)\n' : ''}${oddsChanged ? '⚠️ ODDS MANUALLY ADJUSTED\n' : ''}
BET 1: $${calc.stake1.toFixed(2)} on ${a.outcome1.name} @ ${odds1.toFixed(2)} (${a.outcome1.bookmaker})
→ Returns $${calc.returnOnOutcome1.toFixed(2)} if ${a.outcome1.name} wins

BET 2: $${calc.stake2.toFixed(2)} on ${a.outcome2.name} @ ${odds2.toFixed(2)} (${a.outcome2.bookmaker})
→ Returns $${calc.returnOnOutcome2.toFixed(2)} if ${a.outcome2.name} wins`;

    if (isThreeWay && a.outcome3 && calc.stake3 && calc.returnOnOutcome3) {
      text += `

BET 3: $${calc.stake3.toFixed(2)} on ${a.outcome3.name} @ ${odds3.toFixed(2)} (${a.outcome3.bookmaker})
→ Returns $${calc.returnOnOutcome3.toFixed(2)} if ${a.outcome3.name}`;
    }

    text += `

Total Staked: $${totalStake.toFixed(2)}
${calc.isProfitable ? 'Guaranteed Profit' : 'Expected Loss'}: $${calc.guaranteedProfit.toFixed(2)} (${calc.profitPercentage.toFixed(2)}% ROI)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogBet = () => {
    if (!onLogBet || !calc) return;

    const bet: PlacedBet = {
      id: generateBetId(),
      createdAt: new Date().toISOString(),
      event: {
        homeTeam: a.event.homeTeam,
        awayTeam: a.event.awayTeam,
        sportKey: a.event.sportKey,
        commenceTime: a.event.commenceTime.toISOString(),
      },
      mode: 'book-vs-book',
      expectedProfit: calc.guaranteedProfit,
      status: 'pending',
      bet1: {
        bookmaker: a.outcome1.bookmaker,
        outcome: a.outcome1.name,
        odds: odds1, // Use edited odds
        stake: calc.stake1,
      },
      bet2: {
        bookmaker: a.outcome2.bookmaker,
        outcome: a.outcome2.name,
        odds: odds2, // Use edited odds
        stake: calc.stake2,
      },
    };

    if (isThreeWay && a.outcome3 && calc.stake3) {
      bet.bet3 = {
        bookmaker: a.outcome3.bookmaker,
        outcome: a.outcome3.name,
        odds: odds3, // Use edited odds
        stake: calc.stake3,
      };
    }

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
            <div>
              <h2 className="font-medium">Stake Calculator</h2>
              {isThreeWay && (
                <span className="text-xs text-[#888]">3-Way Market (Soccer)</span>
              )}
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
            {/* Warning for 3-way */}
            {isThreeWay && (
              <div className="flex items-start gap-3 p-4 bg-[#1a1a00] border border-[#333300]">
                <AlertTriangle className="w-5 h-5 text-[#ffcc00] shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-[#ffcc00]">3-Way Market</div>
                  <div className="text-sm text-[#999966]">
                    You must place <strong>ALL 3 BETS</strong> to guarantee profit.
                  </div>
                </div>
              </div>
            )}

            {/* Not profitable warning */}
            {calc && !calc.isProfitable && (
              <div className="flex items-start gap-3 p-4 bg-[#1a1616] border border-[#332222]">
                <AlertTriangle className="w-5 h-5 text-[#aa6666] shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-[#aa6666]">Not Profitable</div>
                  <div className="text-sm text-[#996666]">
                    With current odds, this bet will result in a loss of ${Math.abs(calc.guaranteedProfit).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Odds changed notice */}
            {oddsChanged && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#333] text-xs text-[#888]">
                <Edit2 className="w-3 h-3" />
                Odds manually adjusted from original values
              </div>
            )}

            {/* Event Info */}
            <div className="text-center pb-4 border-b border-[#222]">
              <div className="font-medium text-lg">{a.event.homeTeam}</div>
              <div className="text-[#666]">vs</div>
              <div className="font-medium text-lg">{a.event.awayTeam}</div>
              <div className="text-xs text-[#555] mt-2">{a.event.sportTitle}</div>
            </div>

            {/* Stake Input */}
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

            {/* Bet Cards with Editable Odds */}
            {calc && (
              <div className="space-y-4">
                <EditableBetCard 
                  betNumber={1}
                  outcome={a.outcome1.name}
                  bookmaker={a.outcome1.bookmaker}
                  originalOdds={a.outcome1.odds}
                  currentOdds={odds1}
                  onOddsChange={(value) => handleOddsChange(1, value)}
                  stake={calc.stake1}
                  returnAmount={calc.returnOnOutcome1}
                />

                <EditableBetCard 
                  betNumber={2}
                  outcome={a.outcome2.name}
                  bookmaker={a.outcome2.bookmaker}
                  originalOdds={a.outcome2.odds}
                  currentOdds={odds2}
                  onOddsChange={(value) => handleOddsChange(2, value)}
                  stake={calc.stake2}
                  returnAmount={calc.returnOnOutcome2}
                />

                {isThreeWay && a.outcome3 && calc.stake3 && calc.returnOnOutcome3 && (
                  <EditableBetCard 
                    betNumber={3}
                    outcome={a.outcome3.name}
                    bookmaker={a.outcome3.bookmaker}
                    originalOdds={a.outcome3.odds}
                    currentOdds={odds3}
                    onOddsChange={(value) => handleOddsChange(3, value)}
                    stake={calc.stake3}
                    returnAmount={calc.returnOnOutcome3}
                  />
                )}

                {/* Summary */}
                <div className={`border p-4 ${calc.isProfitable ? 'bg-[#161616] border-[#333]' : 'bg-[#1a1616] border-[#332222]'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#888]">Total Staked ({isThreeWay ? '3' : '2'} bets)</span>
                    <span className="font-mono">${totalStake.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#888]">Return (any outcome)</span>
                    <span className="font-mono">${calc.returnOnOutcome1.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#888]">Implied Probability</span>
                    <span className={`font-mono ${calc.isProfitable ? 'text-[#66aa66]' : 'text-[#aa6666]'}`}>
                      {(calc.impliedSum * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#333]">
                    <span className="font-medium text-lg">
                      {calc.isProfitable ? 'Guaranteed Profit' : 'Expected Loss'}
                    </span>
                    <div className="text-right">
                      <span className={`font-mono font-medium text-lg ${calc.isProfitable ? 'text-[#66aa66]' : 'text-[#aa6666]'}`}>
                        {calc.guaranteedProfit >= 0 ? '+' : ''}${calc.guaranteedProfit.toFixed(2)}
                      </span>
                      <span className="ml-2 text-sm text-[#888]">({calc.profitPercentage.toFixed(2)}%)</span>
                    </div>
                  </div>
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

function EditableBetCard({
  betNumber,
  outcome,
  bookmaker,
  originalOdds,
  currentOdds,
  onOddsChange,
  stake,
  returnAmount
}: {
  betNumber: number;
  outcome: string;
  bookmaker: string;
  originalOdds: number;
  currentOdds: number;
  onOddsChange: (value: string) => void;
  stake: number;
  returnAmount: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const hasChanged = currentOdds !== originalOdds;

  return (
    <div className={`border p-4 ${hasChanged ? 'bg-[#111a11] border-[#224422]' : 'bg-[#111] border-[#222]'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#666] uppercase tracking-wide">Bet {betNumber}</span>
        <span className="text-xs text-[#555]">{bookmaker}</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#888]">{outcome}</span>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              value={currentOdds}
              onChange={e => onOddsChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={e => e.key === 'Enter' && setIsEditing(false)}
              autoFocus
              className="w-20 bg-[#0a0a0a] border border-white px-2 py-1 font-mono text-right focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 font-mono text-white hover:text-[#888] transition-colors"
            >
              @ {currentOdds.toFixed(2)}
              <Edit2 className="w-3 h-3 text-[#666]" />
            </button>
          )}
        </div>
      </div>
      {hasChanged && (
        <div className="text-xs text-[#666] mb-2">
          Original: {originalOdds.toFixed(2)} → Now: {currentOdds.toFixed(2)}
        </div>
      )}
      <div className="flex items-center justify-between text-lg">
        <span className="font-medium">Stake</span>
        <span className="font-mono font-medium">${stake.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#222]">
        <span className="text-sm text-[#666]">If {outcome} wins →</span>
        <span className="font-mono text-sm text-[#888]">Returns ${returnAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
