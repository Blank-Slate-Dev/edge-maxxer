// src/components/StakeCalculatorModal.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  naturalizeStake, 
  naturalizeArbStakes,
  naturalize3WayArbStakes,
  NaturalizedStake 
} from '@/lib/stealth/stakeNaturalizer';
import { 
  getBookmakerProfile, 
  getRiskColor 
} from '@/lib/stealth/bookmakerProfiles';
import { ArbOpportunity } from '@/lib/types';
import { PlacedBet } from '@/lib/bets';

interface StakeCalculatorModalProps {
  arb: ArbOpportunity | null;
  onClose: () => void;
  onLogBet: (bet: PlacedBet) => void;
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

function StakeDisplay({ 
  original, 
  naturalized, 
  stealthMode,
  bookmaker 
}: { 
  original: number; 
  naturalized: NaturalizedStake | null;
  stealthMode: boolean;
  bookmaker: string;
}) {
  const displayStake = stealthMode && naturalized ? naturalized.naturalized : original;
  const hasChange = naturalized && Math.abs(naturalized.difference) > 0.01;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-white">
          ${displayStake.toFixed(2)}
        </span>
        <RiskBadge bookmaker={bookmaker} />
      </div>
      
      {stealthMode && hasChange && naturalized && (
        <div className="text-xs text-zinc-400">
          <span className="line-through">${original.toFixed(2)}</span>
          <span className="mx-1">→</span>
          <span className={naturalized.difference > 0 ? 'text-yellow-400' : 'text-green-400'}>
            {naturalized.difference > 0 ? '+' : ''}{naturalized.differencePercent.toFixed(1)}%
          </span>
        </div>
      )}
      
      {stealthMode && naturalized?.warning && (
        <div className="text-xs text-yellow-400">
          ⚠️ {naturalized.warning}
        </div>
      )}
    </div>
  );
}

// Helper to get outcomes array from the arb
function getOutcomesFromArb(arb: ArbOpportunity): { name: string; bookmaker: string; odds: number }[] {
  if (arb.mode === 'book-vs-book') {
    const outcomes = [arb.outcome1, arb.outcome2];
    if (arb.outcome3) {
      outcomes.push(arb.outcome3);
    }
    return outcomes;
  } else {
    // book-vs-betfair
    return [
      arb.backOutcome,
      { name: arb.layOutcome.name, bookmaker: 'Betfair', odds: arb.layOutcome.odds }
    ];
  }
}

export function StakeCalculatorModal({ arb, onClose, onLogBet }: StakeCalculatorModalProps) {
  const [totalStake, setTotalStake] = useState<string>('100');
  const [stealthMode, setStealthMode] = useState<boolean>(true);
  const [calculatedStakes, setCalculatedStakes] = useState<number[]>([]);
  const [naturalizedStakes, setNaturalizedStakes] = useState<NaturalizedStake[]>([]);
  const [profitImpact, setProfitImpact] = useState<string>('');

  const calculateStakes = useCallback(() => {
    if (!arb) return;
    
    const stake = parseFloat(totalStake) || 0;
    if (stake <= 0) {
      setCalculatedStakes([]);
      setNaturalizedStakes([]);
      return;
    }

    const outcomes = getOutcomesFromArb(arb);
    
    // Calculate optimal stakes for guaranteed profit
    const totalImplied = outcomes.reduce((sum, o) => sum + (1 / o.odds), 0);
    
    const stakes = outcomes.map((outcome) => {
      const impliedProb = 1 / outcome.odds;
      const optimalStake = (stake * impliedProb) / totalImplied;
      return optimalStake;
    });
    
    setCalculatedStakes(stakes);
    
    // Calculate naturalized stakes
    if (stealthMode && outcomes.length === 2) {
      const result = naturalizeArbStakes(
        stakes[0],
        stakes[1],
        outcomes[0].bookmaker,
        outcomes[1].bookmaker,
        stake
      );
      setNaturalizedStakes([result.stake1, result.stake2]);
      setProfitImpact(result.profitImpact);
    } else if (stealthMode && outcomes.length === 3) {
      const result = naturalize3WayArbStakes(
        stakes[0],
        stakes[1],
        stakes[2],
        outcomes[0].bookmaker,
        outcomes[1].bookmaker,
        outcomes[2].bookmaker,
        stake
      );
      setNaturalizedStakes([result.stake1, result.stake2, result.stake3]);
      setProfitImpact(result.profitImpact);
    } else {
      setNaturalizedStakes([]);
      setProfitImpact('');
    }
  }, [arb, totalStake, stealthMode]);

  useEffect(() => {
    calculateStakes();
  }, [calculateStakes]);

  // Don't render if no arb selected
  if (!arb) return null;

  const outcomes = getOutcomesFromArb(arb);
  const totalStakeNum = parseFloat(totalStake) || 0;
  
  // Calculate returns and profit
  const getReturn = (index: number) => {
    const stake = stealthMode && naturalizedStakes[index] 
      ? naturalizedStakes[index].naturalized 
      : calculatedStakes[index] || 0;
    return stake * outcomes[index].odds;
  };
  
  const getTotalStaked = () => {
    if (stealthMode && naturalizedStakes.length > 0) {
      return naturalizedStakes.reduce((sum, n) => sum + n.naturalized, 0);
    }
    return calculatedStakes.reduce((sum, s) => sum + s, 0);
  };
  
  const getProfit = (index: number) => {
    return getReturn(index) - getTotalStaked();
  };

  const minProfit = outcomes.reduce((min, _, i) => {
    const profit = getProfit(i);
    return profit < min ? profit : min;
  }, Infinity);

  const profitPercent = totalStakeNum > 0 ? (minProfit / getTotalStaked()) * 100 : 0;

  // Get event display name
  const eventName = `${arb.event.homeTeam} vs ${arb.event.awayTeam}`;

  const handleLogBet = () => {
    const bet: PlacedBet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      event: {
        homeTeam: arb.event.homeTeam,
        awayTeam: arb.event.awayTeam,
        sportKey: arb.event.sportKey,
        commenceTime: arb.event.commenceTime.toISOString(),
      },
      mode: arb.mode,
      expectedProfit: minProfit,
      status: 'pending',
    };

    // Add stakes based on mode
    if (arb.mode === 'book-vs-book') {
      bet.bet1 = {
        bookmaker: outcomes[0].bookmaker,
        outcome: outcomes[0].name,
        odds: outcomes[0].odds,
        stake: stealthMode && naturalizedStakes[0] 
          ? naturalizedStakes[0].naturalized 
          : calculatedStakes[0] || 0,
      };
      bet.bet2 = {
        bookmaker: outcomes[1].bookmaker,
        outcome: outcomes[1].name,
        odds: outcomes[1].odds,
        stake: stealthMode && naturalizedStakes[1] 
          ? naturalizedStakes[1].naturalized 
          : calculatedStakes[1] || 0,
      };
      // 3-way market
      if (outcomes[2]) {
        bet.bet3 = {
          bookmaker: outcomes[2].bookmaker,
          outcome: outcomes[2].name,
          odds: outcomes[2].odds,
          stake: stealthMode && naturalizedStakes[2] 
            ? naturalizedStakes[2].naturalized 
            : calculatedStakes[2] || 0,
        };
      }
    } else {
      // book-vs-betfair
      bet.backBet = {
        bookmaker: outcomes[0].bookmaker,
        outcome: outcomes[0].name,
        odds: outcomes[0].odds,
        stake: stealthMode && naturalizedStakes[0] 
          ? naturalizedStakes[0].naturalized 
          : calculatedStakes[0] || 0,
      };
      bet.layBet = {
        odds: outcomes[1].odds,
        stake: stealthMode && naturalizedStakes[1] 
          ? naturalizedStakes[1].naturalized 
          : calculatedStakes[1] || 0,
        liability: 0,
      };
    }
    
    onLogBet(bet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Stake Calculator</h2>
            <p className="text-sm text-zinc-400">{eventName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stealth Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">🥷 Stealth Mode</span>
                <span className={`text-xs px-2 py-0.5 rounded ${stealthMode ? 'bg-green-500/20 text-green-400' : 'bg-zinc-600 text-zinc-400'}`}>
                  {stealthMode ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                Rounds stakes to look natural and avoid detection
              </p>
            </div>
            <button
              onClick={() => setStealthMode(!stealthMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                stealthMode ? 'bg-green-500' : 'bg-zinc-600'
              }`}
            >
              <span 
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  stealthMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Total Stake Input */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Total Stake</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
              <input
                type="number"
                value={totalStake}
                onChange={(e) => setTotalStake(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-blue-500"
                placeholder="100"
                min="0"
                step="10"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[50, 100, 250, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTotalStake(amount.toString())}
                  className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-300 transition-colors"
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Stakes Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm text-zinc-400">Individual Stakes</h3>
            
            {outcomes.map((outcome, index) => (
              <div 
                key={index}
                className="p-4 bg-zinc-800 rounded-lg border border-zinc-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">{outcome.name}</div>
                    <div className="text-sm text-zinc-400">{outcome.bookmaker}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">{outcome.odds.toFixed(2)}</div>
                    <div className="text-xs text-zinc-500">
                      {((1 / outcome.odds) * 100).toFixed(1)}% implied
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <StakeDisplay
                    original={calculatedStakes[index] || 0}
                    naturalized={naturalizedStakes[index] || null}
                    stealthMode={stealthMode}
                    bookmaker={outcome.bookmaker}
                  />
                  
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Returns</div>
                    <div className="text-white font-medium">
                      ${getReturn(index).toFixed(2)}
                    </div>
                    <div className={`text-sm ${getProfit(index) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {getProfit(index) >= 0 ? '+' : ''}{getProfit(index).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-zinc-500 uppercase mb-1">Total Staked</div>
                <div className="text-lg font-bold text-white">
                  ${getTotalStaked().toFixed(2)}
                </div>
                {stealthMode && profitImpact && (
                  <div className="text-xs text-zinc-400">{profitImpact}</div>
                )}
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase mb-1">Guaranteed Profit</div>
                <div className={`text-lg font-bold ${minProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${minProfit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase mb-1">ROI</div>
                <div className={`text-lg font-bold ${profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profitPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Stealth Tips */}
          {stealthMode && (
            <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <h4 className="text-yellow-400 font-medium mb-2">🥷 Stealth Tips</h4>
              <ul className="text-sm text-yellow-300/80 space-y-1">
                {outcomes.map((outcome, i) => {
                  const profile = getBookmakerProfile(outcome.bookmaker);
                  if (profile?.riskLevel === 'extreme' || profile?.riskLevel === 'high') {
                    return (
                      <li key={i}>
                        • <strong>{outcome.bookmaker}</strong>: {profile.recommendations[0]}
                      </li>
                    );
                  }
                  return null;
                }).filter(Boolean)}
                <li>• Place bets 1-2 hours before event starts</li>
                <li>• Consider a mug bet after this arb</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-700 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors border border-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={handleLogBet}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Log Bet
          </button>
        </div>
      </div>
    </div>
  );
}
