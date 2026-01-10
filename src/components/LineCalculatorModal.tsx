// src/components/LineCalculatorModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, AlertTriangle } from 'lucide-react';
import type { SpreadArb, TotalsArb, MiddleOpportunity } from '@/lib/types';
import type { PlacedBet } from '@/lib/bets';
import { generateBetId } from '@/lib/bets';
import { getBookmakerProfile, getRiskColor } from '@/lib/stealth/bookmakerProfiles';

interface LineCalculatorModalProps {
  opportunity: SpreadArb | TotalsArb | MiddleOpportunity | null;
  onClose: () => void;
  onLogBet?: (bet: PlacedBet) => void;
}

function RiskBadge({ bookmaker }: { bookmaker: string }) {
  const profile = getBookmakerProfile(bookmaker);
  
  if (!profile) {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">
        Unknown
      </span>
    );
  }
  
  return (
    <span 
      className="text-xs px-1.5 py-0.5 rounded font-medium"
      style={{ 
        backgroundColor: getRiskColor(profile.riskLevel) + '30',
        color: getRiskColor(profile.riskLevel)
      }}
      title={`${profile.riskLevel} risk - ${profile.limitingSpeed} to limit`}
    >
      {profile.riskLevel.toUpperCase()}
    </span>
  );
}

export function LineCalculatorModal({ opportunity, onClose, onLogBet }: LineCalculatorModalProps) {
  const [totalStake, setTotalStake] = useState<string>('100');
  const [copied, setCopied] = useState(false);
  const [betLogged, setBetLogged] = useState(false);
  
  // Editable odds
  const [odds1String, setOdds1String] = useState<string>('');
  const [odds2String, setOdds2String] = useState<string>('');
  
  // Editable stakes (for manual override)
  const [stake1String, setStake1String] = useState<string>('');
  const [stake2String, setStake2String] = useState<string>('');
  const [stakesModified, setStakesModified] = useState(false);
  const [oddsModified, setOddsModified] = useState(false);

  // Initialize when opportunity changes
  useEffect(() => {
    if (opportunity) {
      setBetLogged(false);
      setStakesModified(false);
      setOddsModified(false);
      
      if (opportunity.mode === 'middle') {
        setOdds1String(opportunity.side1.odds.toFixed(2));
        setOdds2String(opportunity.side2.odds.toFixed(2));
      } else if (opportunity.mode === 'spread') {
        setOdds1String(opportunity.favorite.odds.toFixed(2));
        setOdds2String(opportunity.underdog.odds.toFixed(2));
      } else if (opportunity.mode === 'totals') {
        setOdds1String(opportunity.over.odds.toFixed(2));
        setOdds2String(opportunity.under.odds.toFixed(2));
      }
    }
  }, [opportunity]);

  // Calculate optimal stakes
  const calculateOptimalStakes = useCallback((o1: number, o2: number, total: number) => {
    if (total <= 0 || o1 <= 1 || o2 <= 1) {
      return { stake1: 0, stake2: 0 };
    }
    const impliedSum = (1 / o1) + (1 / o2);
    const stake1 = total * (1 / o1) / impliedSum;
    const stake2 = total * (1 / o2) / impliedSum;
    return { stake1, stake2 };
  }, []);

  // Recalculate stakes when inputs change
  useEffect(() => {
    if (!opportunity || stakesModified) return;
    
    const total = parseFloat(totalStake) || 0;
    const o1 = parseFloat(odds1String) || 0;
    const o2 = parseFloat(odds2String) || 0;
    
    if (opportunity.mode === 'middle') {
      // For middles, equal stakes
      setStake1String((total / 2).toFixed(2));
      setStake2String((total / 2).toFixed(2));
    } else {
      const { stake1, stake2 } = calculateOptimalStakes(o1, o2, total);
      setStake1String(stake1.toFixed(2));
      setStake2String(stake2.toFixed(2));
    }
  }, [opportunity, totalStake, odds1String, odds2String, stakesModified, calculateOptimalStakes]);

  if (!opportunity) return null;

  const isMiddle = opportunity.mode === 'middle';
  const isSpread = opportunity.mode === 'spread';
  const isTotals = opportunity.mode === 'totals';

  // Parse current values
  const odds1 = parseFloat(odds1String) || 0;
  const odds2 = parseFloat(odds2String) || 0;
  const stake1 = parseFloat(stake1String) || 0;
  const stake2 = parseFloat(stake2String) || 0;
  const total = stake1 + stake2;

  // Get original odds for comparison
  const originalOdds1 = isMiddle 
    ? opportunity.side1.odds 
    : isSpread 
      ? opportunity.favorite.odds 
      : opportunity.over.odds;
  const originalOdds2 = isMiddle 
    ? opportunity.side2.odds 
    : isSpread 
      ? opportunity.underdog.odds 
      : opportunity.under.odds;

  // Calculate returns and profits
  const return1 = stake1 * odds1;
  const return2 = stake2 * odds2;
  const profit1 = return1 - total;
  const profit2 = return2 - total;
  
  // For non-middles: guaranteed profit
  const guaranteedProfit = Math.min(profit1, profit2);
  const profitPercent = total > 0 ? (guaranteedProfit / total) * 100 : 0;
  
  // For middles: potential profit if middle hits
  const middleProfit = return1 + return2 - total;
  const middleLoss = Math.min(profit1, profit2); // One side wins
  
  // Calculate implied probability
  const impliedSum = odds1 > 1 && odds2 > 1 ? (1 / odds1) + (1 / odds2) : 2;
  const isArb = impliedSum < 1;

  // Check if odds have been modified
  const oddsChanged = Math.abs(odds1 - originalOdds1) > 0.001 || Math.abs(odds2 - originalOdds2) > 0.001;

  // Get optimal stakes for comparison
  const optimalStakes = calculateOptimalStakes(odds1, odds2, total);
  const stakesDeviation = Math.abs(stake1 - optimalStakes.stake1) > 0.5 || Math.abs(stake2 - optimalStakes.stake2) > 0.5;

  // Get bookmaker names
  const bookmaker1 = isMiddle 
    ? opportunity.side1.bookmaker 
    : isSpread 
      ? opportunity.favorite.bookmaker 
      : opportunity.over.bookmaker;
  const bookmaker2 = isMiddle 
    ? opportunity.side2.bookmaker 
    : isSpread 
      ? opportunity.underdog.bookmaker 
      : opportunity.under.bookmaker;

  // Get bet labels
  const label1 = isMiddle 
    ? opportunity.side1.name 
    : isSpread 
      ? `${opportunity.favorite.name} ${opportunity.favorite.point}` 
      : `Over ${opportunity.line}`;
  const label2 = isMiddle 
    ? opportunity.side2.name 
    : isSpread 
      ? `${opportunity.underdog.name} +${Math.abs(opportunity.underdog.point)}` 
      : `Under ${opportunity.line}`;

  const handleOdds1Change = (value: string) => {
    setOdds1String(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && Math.abs(parsed - originalOdds1) > 0.001) {
      setOddsModified(true);
    }
    setStakesModified(false); // Recalculate stakes
  };

  const handleOdds2Change = (value: string) => {
    setOdds2String(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && Math.abs(parsed - originalOdds2) > 0.001) {
      setOddsModified(true);
    }
    setStakesModified(false); // Recalculate stakes
  };

  const handleStake1Change = (value: string) => {
    setStake1String(value);
    setStakesModified(true);
  };

  const handleStake2Change = (value: string) => {
    setStake2String(value);
    setStakesModified(true);
  };

  const handleRecalculateOptimal = () => {
    setStakesModified(false);
  };

  const resetAll = () => {
    setOdds1String(originalOdds1.toFixed(2));
    setOdds2String(originalOdds2.toFixed(2));
    setOddsModified(false);
    setStakesModified(false);
  };

  const handleCopy = () => {
    let text = '';
    
    if (isMiddle) {
      text = `MIDDLE OPPORTUNITY
${opportunity.event.homeTeam} vs ${opportunity.event.awayTeam}
${opportunity.event.sportTitle}

${label1}: $${stake1.toFixed(2)} @ ${odds1.toFixed(2)} (${bookmaker1})
${label2}: $${stake2.toFixed(2)} @ ${odds2.toFixed(2)} (${bookmaker2})

Middle Zone: ${opportunity.middleRange.description}
~${opportunity.middleProbability.toFixed(0)}% chance

If middle hits: +$${middleProfit.toFixed(2)}
If middle misses: $${middleLoss.toFixed(2)}
Expected Value: ${opportunity.expectedValue >= 0 ? '+' : ''}$${opportunity.expectedValue.toFixed(2)}`;
    } else if (isSpread) {
      text = `SPREAD ARBITRAGE
${opportunity.event.homeTeam} vs ${opportunity.event.awayTeam}
${opportunity.event.sportTitle}
Line: ${opportunity.line}

${label1}: $${stake1.toFixed(2)} @ ${odds1.toFixed(2)} (${bookmaker1})
${label2}: $${stake2.toFixed(2)} @ ${odds2.toFixed(2)} (${bookmaker2})

Total Staked: $${total.toFixed(2)}
Guaranteed Profit: $${guaranteedProfit.toFixed(2)} (${profitPercent.toFixed(2)}%)`;
    } else {
      text = `TOTALS ARBITRAGE
${opportunity.event.homeTeam} vs ${opportunity.event.awayTeam}
${opportunity.event.sportTitle}
Line: ${opportunity.line}

${label1}: $${stake1.toFixed(2)} @ ${odds1.toFixed(2)} (${bookmaker1})
${label2}: $${stake2.toFixed(2)} @ ${odds2.toFixed(2)} (${bookmaker2})

Total Staked: $${total.toFixed(2)}
Guaranteed Profit: $${guaranteedProfit.toFixed(2)} (${profitPercent.toFixed(2)}%)`;
    }

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
        homeTeam: opportunity.event.homeTeam,
        awayTeam: opportunity.event.awayTeam,
        sportKey: opportunity.event.sportKey,
        commenceTime: opportunity.event.commenceTime.toISOString(),
      },
      mode: opportunity.mode,
      expectedProfit: isMiddle ? opportunity.expectedValue : guaranteedProfit,
      potentialProfit: isMiddle ? middleProfit : undefined,
      status: 'pending',
      bet1: {
        bookmaker: bookmaker1,
        outcome: label1,
        odds: odds1,
        stake: stake1,
        point: isSpread ? opportunity.favorite.point : isTotals ? opportunity.line : isMiddle ? opportunity.side1.point : undefined,
      },
      bet2: {
        bookmaker: bookmaker2,
        outcome: label2,
        odds: odds2,
        stake: stake2,
        point: isSpread ? opportunity.underdog.point : isTotals ? opportunity.line : isMiddle ? opportunity.side2.point : undefined,
      },
      middleRange: isMiddle ? opportunity.middleRange : undefined,
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
            {/* Arb Status */}
            {!isMiddle && (
              <div className={`p-3 rounded-lg border ${isArb ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${isArb ? 'text-green-400' : 'text-red-400'}`}>
                      {isArb ? '✓' : '✗'}
                    </span>
                    <span className={`font-medium ${isArb ? 'text-green-400' : 'text-red-400'}`}>
                      {isArb ? 'Guaranteed Profit' : 'No Arbitrage'}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-400">
                    Combined implied: {(impliedSum * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            )}

            {/* Middle Warning */}
            {isMiddle && (
              <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-400">Middle Opportunity</div>
                  <div className="text-sm text-[#888]">
                    NOT guaranteed. Win big if middle hits (~{opportunity.middleProbability.toFixed(0)}% chance), 
                    lose if it doesn&apos;t. EV: {opportunity.expectedValue >= 0 ? '+' : ''}${opportunity.expectedValue.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Total Stake */}
            <div>
              <label className="block text-xs text-[#666] uppercase tracking-wide mb-2">
                Total Stake (for optimal calculation)
              </label>
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[120px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]">$</span>
                  <input
                    type="number"
                    value={totalStake}
                    onChange={e => {
                      setTotalStake(e.target.value);
                      setStakesModified(false);
                    }}
                    className="w-full bg-[#111] border border-[#333] px-3 py-2 pl-7 font-mono focus:border-white focus:outline-none"
                  />
                </div>
                {[50, 100, 250, 500].map(amount => (
                  <button
                    key={amount}
                    onClick={() => {
                      setTotalStake(amount.toString());
                      setStakesModified(false);
                    }}
                    className={`px-3 py-2 text-sm border transition-colors ${
                      parseFloat(totalStake) === amount
                        ? 'bg-white text-black border-white'
                        : 'border-[#333] text-[#888] hover:border-[#555]'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Modified Warning */}
            {(oddsModified || stakesModified) && (
              <div className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-300">
                  <span>✏️</span>
                  <span>
                    {oddsModified && stakesModified 
                      ? 'Odds and stakes modified' 
                      : oddsModified 
                        ? 'Odds modified from original' 
                        : 'Stakes manually adjusted'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {stakesModified && (
                    <button
                      onClick={handleRecalculateOptimal}
                      className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    >
                      Recalculate Optimal
                    </button>
                  )}
                  <button
                    onClick={resetAll}
                    className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            )}

            {/* Stakes Breakdown */}
            <div className="space-y-4">
              {/* Bet 1 */}
              <div className="bg-[#111] border border-[#222] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-white">{label1}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-[#666]">{bookmaker1}</span>
                      <RiskBadge bookmaker={bookmaker1} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Odds:</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={odds1String}
                        onChange={(e) => handleOdds1Change(e.target.value)}
                        className={`w-20 text-right text-lg font-bold bg-zinc-700 border rounded px-2 py-1 focus:outline-none focus:border-blue-500 ${
                          Math.abs(odds1 - originalOdds1) > 0.001
                            ? 'border-blue-500 text-blue-400' 
                            : 'border-zinc-600 text-blue-400'
                        }`}
                      />
                    </div>
                    {Math.abs(odds1 - originalOdds1) > 0.001 && (
                      <div className="text-xs text-zinc-500 mt-1">
                        Was {originalOdds1.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={stake1String}
                      onChange={(e) => handleStake1Change(e.target.value)}
                      className={`w-28 text-xl font-bold bg-zinc-700 border rounded px-2 py-1 focus:outline-none focus:border-green-500 ${
                        stakesModified
                          ? 'border-green-500 text-white' 
                          : 'border-zinc-600 text-white'
                      }`}
                    />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#666]">Returns</div>
                    <div className="font-mono text-white">${return1.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Bet 2 */}
              <div className="bg-[#111] border border-[#222] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-white">{label2}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-[#666]">{bookmaker2}</span>
                      <RiskBadge bookmaker={bookmaker2} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Odds:</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={odds2String}
                        onChange={(e) => handleOdds2Change(e.target.value)}
                        className={`w-20 text-right text-lg font-bold bg-zinc-700 border rounded px-2 py-1 focus:outline-none focus:border-blue-500 ${
                          Math.abs(odds2 - originalOdds2) > 0.001
                            ? 'border-blue-500 text-blue-400' 
                            : 'border-zinc-600 text-blue-400'
                        }`}
                      />
                    </div>
                    {Math.abs(odds2 - originalOdds2) > 0.001 && (
                      <div className="text-xs text-zinc-500 mt-1">
                        Was {originalOdds2.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={stake2String}
                      onChange={(e) => handleStake2Change(e.target.value)}
                      className={`w-28 text-xl font-bold bg-zinc-700 border rounded px-2 py-1 focus:outline-none focus:border-green-500 ${
                        stakesModified
                          ? 'border-green-500 text-white' 
                          : 'border-zinc-600 text-white'
                      }`}
                    />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#666]">Returns</div>
                    <div className="font-mono text-white">${return2.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Variance Warning */}
            {!isMiddle && stakesDeviation && stakesModified && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <h4 className="text-yellow-400 font-medium mb-2">⚠️ Unbalanced Stakes</h4>
                <p className="text-sm text-yellow-300/80 mb-2">
                  Your stakes create different profits depending on outcome:
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">If {label1} wins:</span>
                    <span className={profit1 >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {profit1 >= 0 ? '+' : ''}${profit1.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">If {label2} wins:</span>
                    <span className={profit2 >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {profit2 >= 0 ? '+' : ''}${profit2.toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRecalculateOptimal}
                  className="mt-3 w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-black text-sm font-medium rounded transition-colors"
                >
                  Recalculate Optimal Stakes
                </button>
              </div>
            )}

            {/* Results */}
            {isMiddle ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0a1a0a] border border-[#1a3a1a] p-4 text-center rounded-lg">
                  <div className="text-xs text-[#4a8a4a] uppercase tracking-wide mb-1">If Middle Hits</div>
                  <div className="font-mono text-2xl text-green-400">
                    +${middleProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-[#4a8a4a] mt-1">
                    ~{opportunity.middleProbability.toFixed(0)}% chance
                  </div>
                </div>
                <div className="bg-[#1a0a0a] border border-[#3a1a1a] p-4 text-center rounded-lg">
                  <div className="text-xs text-[#8a4a4a] uppercase tracking-wide mb-1">If Middle Misses</div>
                  <div className="font-mono text-2xl text-red-400">
                    ${middleLoss.toFixed(2)}
                  </div>
                  <div className="text-xs text-[#8a4a4a] mt-1">
                    ~{(100 - opportunity.middleProbability).toFixed(0)}% chance
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-zinc-500 uppercase mb-1">Total Staked</div>
                    <div className="text-lg font-bold text-white">
                      ${total.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase mb-1">Guaranteed Profit</div>
                    <div className={`text-lg font-bold ${guaranteedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {guaranteedProfit >= 0 ? '+' : ''}${guaranteedProfit.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase mb-1">ROI</div>
                    <div className={`text-lg font-bold ${profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Middle Zone Info */}
            {isMiddle && (
              <div className="bg-[#111] border border-[#333] p-4 rounded-lg">
                <div className="text-xs text-[#666] uppercase tracking-wide mb-2">Middle Zone</div>
                <div className="text-yellow-400 font-medium">
                  {opportunity.middleRange.description}
                </div>
                <div className="text-sm text-[#888] mt-2">
                  If the final margin lands in this range, both bets win!
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
                  {betLogged ? 'Bet Logged ✓' : 'Log Bet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}