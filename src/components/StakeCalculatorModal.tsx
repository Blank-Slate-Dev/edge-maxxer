// src/components/StakeCalculatorModal.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { 
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
      <span 
        className="text-xs px-1.5 py-0.5 rounded"
        style={{
          backgroundColor: 'var(--border)',
          color: 'var(--muted)'
        }}
      >
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
  const [naturalizedStakes, setNaturalizedStakes] = useState<NaturalizedStake[]>([]);
  const [customOddsStrings, setCustomOddsStrings] = useState<string[]>([]);
  const [customStakeStrings, setCustomStakeStrings] = useState<string[]>([]);
  const [oddsModified, setOddsModified] = useState<boolean>(false);
  const [stakesModified, setStakesModified] = useState<boolean>(false);

  // Initialize when arb changes
  useEffect(() => {
    if (arb) {
      const outcomes = getOutcomesFromArb(arb);
      setCustomOddsStrings(outcomes.map(o => o.odds.toFixed(2)));
      setCustomStakeStrings([]);
      setOddsModified(false);
      setStakesModified(false);
    }
  }, [arb]);

  // Calculate optimal stakes for given odds and total stake
  const calculateOptimalStakes = useCallback((oddsArray: number[], total: number, outcomes: { bookmaker: string }[]) => {
    if (total <= 0 || oddsArray.some(o => o <= 1)) {
      return { stakes: [], naturalized: [] as NaturalizedStake[] };
    }

    const totalImplied = oddsArray.reduce((sum, odds) => sum + (1 / odds), 0);
    
    const stakes = oddsArray.map((odds) => {
      const impliedProb = 1 / odds;
      return (total * impliedProb) / totalImplied;
    });

    // Calculate naturalized stakes if stealth mode
    let naturalized: NaturalizedStake[] = [];
    if (stealthMode && outcomes.length === 2) {
      const result = naturalizeArbStakes(
        stakes[0],
        stakes[1],
        outcomes[0].bookmaker,
        outcomes[1].bookmaker,
        total
      );
      naturalized = [result.stake1, result.stake2];
    } else if (stealthMode && outcomes.length === 3) {
      const result = naturalize3WayArbStakes(
        stakes[0],
        stakes[1],
        stakes[2],
        outcomes[0].bookmaker,
        outcomes[1].bookmaker,
        outcomes[2].bookmaker,
        total
      );
      naturalized = [result.stake1, result.stake2, result.stake3];
    }

    return { stakes, naturalized };
  }, [stealthMode]);

  // Recalculate stakes when not manually modified
  const recalculateStakes = useCallback(() => {
    if (!arb || customOddsStrings.length === 0) return;
    
    const stake = parseFloat(totalStake) || 0;
    const outcomes = getOutcomesFromArb(arb);
    
    const oddsToUse = customOddsStrings.map((s, i) => {
      const parsed = parseFloat(s);
      return !isNaN(parsed) && parsed > 1 ? parsed : outcomes[i].odds;
    });
    
    const { stakes, naturalized } = calculateOptimalStakes(oddsToUse, stake, outcomes);
    
    setNaturalizedStakes(naturalized);
    
    if (stealthMode && naturalized.length > 0) {
      setCustomStakeStrings(naturalized.map(n => n.naturalized.toFixed(2)));
    } else {
      setCustomStakeStrings(stakes.map(s => s.toFixed(2)));
    }
  }, [arb, totalStake, customOddsStrings, calculateOptimalStakes, stealthMode]);

  // Auto-recalculate when inputs change and stakes aren't manually modified
  useEffect(() => {
    if (!stakesModified) {
      recalculateStakes();
    }
  }, [recalculateStakes, stakesModified]);

  // Don't render if no arb selected
  if (!arb) return null;

  const outcomes = getOutcomesFromArb(arb);
  
  // Parse values for calculations
  const oddsToUse = customOddsStrings.map((s, i) => {
    const parsed = parseFloat(s);
    return !isNaN(parsed) && parsed > 1 ? parsed : outcomes[i].odds;
  });
  
  const stakesToUse = customStakeStrings.map((s) => {
    const parsed = parseFloat(s);
    return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
  });
  
  // Calculate returns and profit using custom values
  const getReturn = (index: number) => {
    const stake = stakesToUse[index] || 0;
    return stake * oddsToUse[index];
  };
  
  const getTotalStaked = () => {
    return stakesToUse.reduce((sum, s) => sum + (s || 0), 0);
  };
  
  const getProfit = (index: number) => {
    return getReturn(index) - getTotalStaked();
  };

  // Calculate min profit across all outcomes
  const profits = outcomes.map((_, i) => getProfit(i));
  const minProfit = profits.length > 0 ? Math.min(...profits) : 0;
  const maxProfit = profits.length > 0 ? Math.max(...profits) : 0;
  const profitVariance = maxProfit - minProfit;

  const totalStaked = getTotalStaked();
  const profitPercent = totalStaked > 0 ? (minProfit / totalStaked) * 100 : 0;

  // Check if current stakes are optimal
  const totalImplied = oddsToUse.reduce((sum, odds) => sum + (1 / odds), 0);
  const isArb = totalImplied < 1;

  // Get event display name
  const eventName = `${arb.event.homeTeam} vs ${arb.event.awayTeam}`;

  const handleOddsChange = (index: number, value: string) => {
    const updated = [...customOddsStrings];
    updated[index] = value;
    setCustomOddsStrings(updated);
    
    const parsed = parseFloat(value);
    const originalOdds = getOutcomesFromArb(arb)[index].odds;
    if (!isNaN(parsed) && Math.abs(parsed - originalOdds) > 0.001) {
      setOddsModified(true);
    }
    
    // Auto-recalculate stakes when odds change (unless manually locked)
    if (!stakesModified) {
      // Will trigger via useEffect
    }
  };

  const handleStakeChange = (index: number, value: string) => {
    const updated = [...customStakeStrings];
    updated[index] = value;
    setCustomStakeStrings(updated);
    setStakesModified(true);
  };

  const resetAll = () => {
    const outcomes = getOutcomesFromArb(arb);
    setCustomOddsStrings(outcomes.map(o => o.odds.toFixed(2)));
    setOddsModified(false);
    setStakesModified(false);
    // Stakes will auto-recalculate via useEffect
  };

  const handleRecalculateOptimal = () => {
    setStakesModified(false);
    // This will trigger useEffect to recalculate
  };

  // Calculate what optimal stakes would be (for comparison)
  const getOptimalStakes = () => {
    const stake = parseFloat(totalStake) || 0;
    const { stakes, naturalized } = calculateOptimalStakes(oddsToUse, stake, outcomes);
    
    if (stealthMode && naturalized.length > 0) {
      return naturalized.map(n => n.naturalized);
    }
    return stakes;
  };
  
  const optimalStakes = getOptimalStakes();

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

    // Add stakes based on mode - use custom values
    if (arb.mode === 'book-vs-book') {
      bet.bet1 = {
        bookmaker: outcomes[0].bookmaker,
        outcome: outcomes[0].name,
        odds: oddsToUse[0],
        stake: stakesToUse[0] || 0,
      };
      bet.bet2 = {
        bookmaker: outcomes[1].bookmaker,
        outcome: outcomes[1].name,
        odds: oddsToUse[1],
        stake: stakesToUse[1] || 0,
      };
      // 3-way market
      if (outcomes[2]) {
        bet.bet3 = {
          bookmaker: outcomes[2].bookmaker,
          outcome: outcomes[2].name,
          odds: oddsToUse[2],
          stake: stakesToUse[2] || 0,
        };
      }
    } else {
      // book-vs-betfair
      bet.backBet = {
        bookmaker: outcomes[0].bookmaker,
        outcome: outcomes[0].name,
        odds: oddsToUse[0],
        stake: stakesToUse[0] || 0,
      };
      bet.layBet = {
        odds: oddsToUse[1],
        stake: stakesToUse[1] || 0,
        liability: 0,
      };
    }
    
    onLogBet(bet);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-start justify-center p-4 py-8">
        <div 
          className="w-full max-w-xl border relative rounded-lg"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border)'
          }}
        >
          {/* Header */}
          <div 
            className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b rounded-t-lg"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)'
            }}
          >
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Stake Calculator</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{eventName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
              style={{ color: 'var(--muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Arb Status Indicator */}
            <div 
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: isArb ? 'color-mix(in srgb, var(--success) 10%, transparent)' : 'color-mix(in srgb, var(--danger) 10%, transparent)',
                borderColor: isArb ? 'color-mix(in srgb, var(--success) 30%, transparent)' : 'color-mix(in srgb, var(--danger) 30%, transparent)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg" style={{ color: isArb ? 'var(--success)' : 'var(--danger)' }}>
                    {isArb ? '✓' : '✗'}
                  </span>
                  <span className="font-medium" style={{ color: isArb ? 'var(--success)' : 'var(--danger)' }}>
                    {isArb ? 'Arbitrage Opportunity' : 'No Arbitrage'}
                  </span>
                </div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  Combined implied: {(totalImplied * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Stealth Mode Toggle */}
            <div 
              className="flex items-center justify-between p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>🥷 Stealth Mode</span>
                  <span 
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: stealthMode ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'var(--surface-secondary)',
                      color: stealthMode ? 'var(--success)' : 'var(--muted)'
                    }}
                  >
                    {stealthMode ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  Rounds stakes to look natural and avoid detection
                </p>
              </div>
              <button
                onClick={() => {
                  setStealthMode(!stealthMode);
                  setStakesModified(false);
                }}
                className="relative w-12 h-6 rounded-full transition-colors"
                style={{
                  backgroundColor: stealthMode ? 'var(--success)' : 'var(--border)'
                }}
              >
                <span 
                  className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                  style={{
                    left: stealthMode ? '1.75rem' : '0.25rem'
                  }}
                />
              </button>
            </div>

            {/* Total Stake Input */}
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Total Stake (for optimal calculation)</label>
              <div className="relative">
                <span 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted)' }}
                >$</span>
                <input
                  type="number"
                  value={totalStake}
                  onChange={(e) => {
                    setTotalStake(e.target.value);
                    setStakesModified(false);
                  }}
                  className="w-full pl-8 pr-4 py-3 text-lg font-medium focus:outline-none rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                  placeholder="100"
                  min="0"
                  step="10"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[50, 100, 250, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setTotalStake(amount.toString());
                      setStakesModified(false);
                    }}
                    className="px-3 py-1 text-sm border rounded transition-colors hover:bg-[var(--surface-hover)]"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--muted)'
                    }}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Modified Warning */}
            {(oddsModified || stakesModified) && (
              <div 
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--info) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--info) 30%, transparent)'
                }}
              >
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--info)' }}>
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
                      className="text-xs px-2 py-1 rounded transition-colors"
                      style={{
                        backgroundColor: 'var(--success)',
                        color: 'white'
                      }}
                    >
                      Recalculate Optimal
                    </button>
                  )}
                  <button
                    onClick={resetAll}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{
                      backgroundColor: 'var(--surface)',
                      color: 'var(--foreground)'
                    }}
                  >
                    Reset All
                  </button>
                </div>
              </div>
            )}

            {/* Stakes Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm" style={{ color: 'var(--muted)' }}>Individual Stakes</h3>
              
              {outcomes.map((outcome, index) => {
                const originalOdds = getOutcomesFromArb(arb)[index].odds;
                const currentOdds = oddsToUse[index];
                const isOddsChanged = Math.abs(currentOdds - originalOdds) > 0.001;
                
                const currentStake = stakesToUse[index];
                const optimalStake = optimalStakes[index] || 0;
                const isStakeChanged = stakesModified && Math.abs(currentStake - optimalStake) > 0.01;
                
                return (
                  <div 
                    key={index}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium" style={{ color: 'var(--foreground)' }}>{outcome.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm" style={{ color: 'var(--muted)' }}>{outcome.bookmaker}</span>
                          <RiskBadge bookmaker={outcome.bookmaker} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Odds:</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={customOddsStrings[index] || ''}
                            onChange={(e) => handleOddsChange(index, e.target.value)}
                            className="w-20 text-right text-lg font-bold rounded px-2 py-1 focus:outline-none border"
                            style={{
                              backgroundColor: 'var(--surface-secondary)',
                              borderColor: isOddsChanged ? 'var(--info)' : 'var(--border)',
                              color: 'var(--info)'
                            }}
                          />
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {((1 / currentOdds) * 100).toFixed(1)}% implied
                          {isOddsChanged && (
                            <span className="ml-1" style={{ color: 'var(--muted)' }}>
                              (was {originalOdds.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Stake:</div>
                        <div className="flex items-center gap-1">
                          <span style={{ color: 'var(--muted)' }}>$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={customStakeStrings[index] || ''}
                            onChange={(e) => handleStakeChange(index, e.target.value)}
                            className="w-28 text-xl font-bold rounded px-2 py-1 focus:outline-none border"
                            style={{
                              backgroundColor: 'var(--surface-secondary)',
                              borderColor: isStakeChanged ? 'var(--success)' : 'var(--border)',
                              color: 'var(--foreground)'
                            }}
                          />
                        </div>
                        {isStakeChanged && (
                          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            Optimal: ${optimalStake.toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Returns</div>
                        <div className="font-medium" style={{ color: 'var(--foreground)' }}>
                          ${getReturn(index).toFixed(2)}
                        </div>
                        <div 
                          className="text-sm font-medium"
                          style={{ color: getProfit(index) >= 0 ? 'var(--success)' : 'var(--danger)' }}
                        >
                          {getProfit(index) >= 0 ? '+' : ''}${getProfit(index).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs uppercase mb-1" style={{ color: 'var(--muted-foreground)' }}>Total Staked</div>
                  <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    ${totalStaked.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase mb-1" style={{ color: 'var(--muted-foreground)' }}>Guaranteed Profit</div>
                  <div 
                    className="text-lg font-bold"
                    style={{ color: minProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {minProfit >= 0 ? '+' : ''}${minProfit.toFixed(2)}
                  </div>
                  {profitVariance > 0.01 && (
                    <div className="text-xs text-yellow-400">
                      ⚠️ Varies by ${profitVariance.toFixed(2)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase mb-1" style={{ color: 'var(--muted-foreground)' }}>ROI</div>
                  <div 
                    className="text-lg font-bold"
                    style={{ color: profitPercent >= 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Breakdown per Outcome */}
            {profitVariance > 0.01 && (
              <div 
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)'
                }}
              >
                <h4 className="font-medium mb-2 text-yellow-400">⚠️ Unbalanced Stakes</h4>
                <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
                  Your custom stakes create different profits depending on which outcome wins:
                </p>
                <div className="space-y-1">
                  {outcomes.map((outcome, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--muted)' }}>If {outcome.name} wins:</span>
                      <span style={{ color: getProfit(i) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {getProfit(i) >= 0 ? '+' : ''}${getProfit(i).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRecalculateOptimal}
                  className="mt-3 w-full py-2 text-sm font-medium rounded transition-colors"
                  style={{
                    backgroundColor: 'var(--warning)',
                    color: 'black'
                  }}
                >
                  Recalculate Optimal Stakes
                </button>
              </div>
            )}

            {/* Stealth Tips */}
            {stealthMode && !stakesModified && (
              <div 
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)'
                }}
              >
                <h4 className="font-medium mb-2" style={{ color: 'var(--muted)' }}>🥷 Stealth Tips</h4>
                <ul className="text-sm space-y-1" style={{ color: 'var(--muted-foreground)' }}>
                  {outcomes.map((outcome, i) => {
                    const profile = getBookmakerProfile(outcome.bookmaker);
                    if (profile?.riskLevel === 'extreme' || profile?.riskLevel === 'high') {
                      return (
                        <li key={i}>
                          • <strong style={{ color: 'var(--muted)' }}>{outcome.bookmaker}</strong>: {profile.recommendations[0]}
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
          <div 
            className="sticky bottom-0 px-6 py-4 flex gap-3 border-t rounded-b-lg"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)'
            }}
          >
            <button
              onClick={onClose}
              className="flex-1 py-3 font-medium rounded-lg transition-colors border hover:bg-[var(--surface)]"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleLogBet}
              className="flex-1 py-3 font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--info)',
                color: 'white'
              }}
            >
              Log Bet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
