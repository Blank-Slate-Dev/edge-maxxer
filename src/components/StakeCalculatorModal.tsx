// src/components/StakeCalculatorModal.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Star } from 'lucide-react';
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
  onLogBet: (bet: Omit<PlacedBet, 'id' | 'createdAt'>) => void;
}

function RiskBadge({ bookmaker }: { bookmaker: string }) {
  const profile = getBookmakerProfile(bookmaker);
  
  if (!profile) {
    return (
      <span 
        className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded"
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
      className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded font-medium"
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
  const [stealthMode, setStealthMode] = useState<boolean>(false);
  const [favourMode, setFavourMode] = useState<boolean>(false);
  const [favouredOutcome, setFavouredOutcome] = useState<number | null>(null);
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
      setFavourMode(false);
      setFavouredOutcome(null);
    }
  }, [arb]);

  // Calculate optimal stakes for given odds and total stake
  const calculateOptimalStakes = useCallback((oddsArray: number[], total: number, outcomes: { bookmaker: string }[]) => {
    if (total <= 0 || oddsArray.some(o => o <= 1)) {
      return { stakes: [], naturalized: [] as NaturalizedStake[] };
    }

    let stakes: number[];

    // Favour mode calculation
    if (favourMode && favouredOutcome !== null && outcomes.length === 2) {
      const favouredIdx = favouredOutcome;
      const nonFavouredIdx = favouredOutcome === 0 ? 1 : 0;
      const nonFavouredOdds = oddsArray[nonFavouredIdx];
      
      const stakeNonFavoured = total / nonFavouredOdds;
      const stakeFavoured = total - stakeNonFavoured;
      
      stakes = [];
      stakes[favouredIdx] = stakeFavoured;
      stakes[nonFavouredIdx] = stakeNonFavoured;
    } else if (favourMode && favouredOutcome !== null && outcomes.length === 3) {
      const favouredIdx = favouredOutcome;
      const otherIdxs = [0, 1, 2].filter(i => i !== favouredIdx);
      
      const odds1 = oddsArray[otherIdxs[0]];
      const odds2 = oddsArray[otherIdxs[1]];
      
      const stakeFavoured = total * (1 - 1/odds1 - 1/odds2);
      
      if (stakeFavoured < 0) {
        const totalImplied = oddsArray.reduce((sum, odds) => sum + (1 / odds), 0);
        stakes = oddsArray.map((odds) => {
          const impliedProb = 1 / odds;
          return (total * impliedProb) / totalImplied;
        });
      } else {
        stakes = [];
        stakes[favouredIdx] = stakeFavoured;
        stakes[otherIdxs[0]] = total / odds1;
        stakes[otherIdxs[1]] = total / odds2;
      }
    } else {
      const totalImplied = oddsArray.reduce((sum, odds) => sum + (1 / odds), 0);
      
      stakes = oddsArray.map((odds) => {
        const impliedProb = 1 / odds;
        return (total * impliedProb) / totalImplied;
      });
    }

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
  }, [stealthMode, favourMode, favouredOutcome]);

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
    setFavourMode(false);
    setFavouredOutcome(null);
  };

  const handleRecalculateOptimal = () => {
    setStakesModified(false);
  };

  const handleFavourToggle = () => {
    if (favourMode) {
      setFavourMode(false);
      setFavouredOutcome(null);
    } else {
      setFavourMode(true);
      setFavouredOutcome(0);
    }
    setStakesModified(false);
  };

  const handleFavouredOutcomeChange = (index: number) => {
    setFavouredOutcome(index);
    setStakesModified(false);
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

  // FIX: Don't generate id or createdAt here — useBets.addBet() handles that.
  // This prevents the mismatch where StakeCalculatorModal generates a non-ObjectId
  // string like "bet_123_abc" that later fails on PUT/DELETE in MongoDB.
  const handleLogBet = () => {
    const bet: Omit<PlacedBet, 'id' | 'createdAt'> = {
      event: {
        homeTeam: arb.event.homeTeam,
        awayTeam: arb.event.awayTeam,
        sportKey: arb.event.sportKey,
        commenceTime: arb.event.commenceTime instanceof Date 
          ? arb.event.commenceTime.toISOString() 
          : String(arb.event.commenceTime),
      },
      mode: arb.mode,
      expectedProfit: minProfit,
      status: 'pending',
    };

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
      if (outcomes[2]) {
        bet.bet3 = {
          bookmaker: outcomes[2].bookmaker,
          outcome: outcomes[2].name,
          odds: oddsToUse[2],
          stake: stakesToUse[2] || 0,
        };
      }
    } else {
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
      <div className="min-h-full flex items-start justify-center p-2 sm:p-4 py-4 sm:py-8">
        <div 
          className="w-full max-w-xl border relative rounded-lg"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border)'
          }}
        >
          {/* Header */}
          <div 
            className="sticky top-0 z-10 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b rounded-t-lg"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="min-w-0 flex-1 mr-2">
              <h2 className="text-base sm:text-lg font-semibold truncate" style={{ color: 'var(--foreground)' }}>Stake Calculator</h2>
              <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--muted)' }}>{eventName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-[var(--surface)] shrink-0"
              style={{ color: 'var(--muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Arb Status Indicator */}
            <div 
              className="p-2 sm:p-3 rounded-lg border"
              style={{
                backgroundColor: isArb ? 'color-mix(in srgb, var(--success) 10%, transparent)' : 'color-mix(in srgb, var(--danger) 10%, transparent)',
                borderColor: isArb ? 'color-mix(in srgb, var(--success) 30%, transparent)' : 'color-mix(in srgb, var(--danger) 30%, transparent)'
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-lg" style={{ color: isArb ? 'var(--success)' : 'var(--danger)' }}>
                    {isArb ? '✓' : '✗'}
                  </span>
                  <span className="font-medium text-sm sm:text-base" style={{ color: isArb ? 'var(--success)' : 'var(--danger)' }}>
                    {isArb ? 'Arbitrage' : 'No Arb'}
                  </span>
                </div>
                <div className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                  {(totalImplied * 100).toFixed(2)}% implied
                </div>
              </div>
            </div>

            {/* Mode Toggles Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Stealth Mode Toggle */}
              <div 
                className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)'
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>🥷 Stealth</span>
                    <span 
                      className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: stealthMode ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'var(--surface-secondary)',
                        color: stealthMode ? 'var(--success)' : 'var(--muted)'
                      }}
                    >
                      {stealthMode ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-xs mt-1 hidden sm:block" style={{ color: 'var(--muted)' }}>
                    Round stakes naturally
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStealthMode(!stealthMode);
                    setStakesModified(false);
                  }}
                  className="relative w-11 sm:w-12 h-6 rounded-full transition-colors shrink-0"
                  style={{
                    backgroundColor: stealthMode ? 'var(--success)' : 'var(--border)'
                  }}
                >
                  <span 
                    className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                    style={{
                      left: stealthMode ? '1.5rem' : '0.25rem'
                    }}
                  />
                </button>
              </div>

              {/* Favour Mode Toggle */}
              <div 
                className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: favourMode ? 'var(--warning)' : 'var(--border)'
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>
                      <Star className="w-4 h-4 inline mr-1" style={{ color: 'var(--warning)' }} />
                      Favour
                    </span>
                    <span 
                      className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: favourMode ? 'color-mix(in srgb, var(--warning) 20%, transparent)' : 'var(--surface-secondary)',
                        color: favourMode ? 'var(--warning)' : 'var(--muted)'
                      }}
                    >
                      {favourMode ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-xs mt-1 hidden sm:block" style={{ color: 'var(--muted)' }}>
                    Double profit or break even
                  </p>
                </div>
                <button
                  onClick={handleFavourToggle}
                  className="relative w-11 sm:w-12 h-6 rounded-full transition-colors shrink-0"
                  style={{
                    backgroundColor: favourMode ? 'var(--warning)' : 'var(--border)'
                  }}
                >
                  <span 
                    className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                    style={{
                      left: favourMode ? '1.5rem' : '0.25rem'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Favour Mode Outcome Selector */}
            {favourMode && (
              <div 
                className="p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)'
                }}
              >
                <h4 className="font-medium mb-2 text-sm" style={{ color: 'var(--warning)' }}>
                  <Star className="w-4 h-4 inline mr-1" />
                  Select Favoured Outcome
                </h4>
                <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                  If your pick wins → double profit. Other outcomes → break even.
                </p>
                <div className="flex flex-wrap gap-2">
                  {outcomes.map((outcome, index) => (
                    <button
                      key={index}
                      onClick={() => handleFavouredOutcomeChange(index)}
                      className="flex-1 min-w-[120px] px-3 py-2 text-sm font-medium rounded-lg transition-all border"
                      style={{
                        backgroundColor: favouredOutcome === index 
                          ? 'var(--warning)' 
                          : 'var(--surface)',
                        borderColor: favouredOutcome === index 
                          ? 'var(--warning)' 
                          : 'var(--border)',
                        color: favouredOutcome === index 
                          ? 'black' 
                          : 'var(--foreground)'
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {favouredOutcome === index && <Star className="w-3 h-3" />}
                        <span className="truncate">{outcome.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Total Stake Input */}
            <div>
              <label className="block text-xs sm:text-sm mb-1.5 sm:mb-2" style={{ color: 'var(--muted)' }}>Total Stake</label>
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
                  className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2.5 sm:py-3 text-base sm:text-lg font-medium focus:outline-none rounded-lg border"
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
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                {[50, 100, 250, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setTotalStake(amount.toString());
                      setStakesModified(false);
                    }}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded transition-colors hover:bg-[var(--surface-hover)]"
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
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-3 rounded-lg border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--info) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--info) 30%, transparent)'
                }}
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: 'var(--info)' }}>
                  <span>✏️</span>
                  <span>
                    {oddsModified && stakesModified 
                      ? 'Odds & stakes modified' 
                      : oddsModified 
                        ? 'Odds modified' 
                        : 'Stakes adjusted'}
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
                      Recalculate
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
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Stakes Breakdown */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>Individual Stakes</h3>
              
              {outcomes.map((outcome, index) => {
                const originalOdds = getOutcomesFromArb(arb)[index].odds;
                const currentOdds = oddsToUse[index];
                const isOddsChanged = Math.abs(currentOdds - originalOdds) > 0.001;
                
                const currentStake = stakesToUse[index];
                const optimalStake = optimalStakes[index] || 0;
                const isStakeChanged = stakesModified && Math.abs(currentStake - optimalStake) > 0.01;
                
                const isFavoured = favourMode && favouredOutcome === index;
                
                return (
                  <div 
                    key={index}
                    className="p-3 sm:p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: isFavoured ? 'var(--warning)' : 'var(--border)'
                    }}
                  >
                    {/* Outcome Header */}
                    <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isFavoured && <Star className="w-4 h-4 shrink-0" style={{ color: 'var(--warning)' }} />}
                          <div className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--foreground)' }}>{outcome.name}</div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>{outcome.bookmaker}</span>
                          <RiskBadge bookmaker={outcome.bookmaker} />
                          {isFavoured && (
                            <span 
                              className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{ 
                                backgroundColor: 'color-mix(in srgb, var(--warning) 20%, transparent)',
                                color: 'var(--warning)'
                              }}
                            >
                              FAVOURED
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-[10px] sm:text-xs hidden sm:inline" style={{ color: 'var(--muted-foreground)' }}>Odds:</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={customOddsStrings[index] || ''}
                            onChange={(e) => handleOddsChange(index, e.target.value)}
                            className="w-16 sm:w-20 text-right text-base sm:text-lg font-bold rounded px-1.5 sm:px-2 py-0.5 sm:py-1 focus:outline-none border"
                            style={{
                              backgroundColor: 'var(--surface-secondary)',
                              borderColor: isOddsChanged ? 'var(--info)' : 'var(--border)',
                              color: 'var(--info)'
                            }}
                          />
                        </div>
                        <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {((1 / currentOdds) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Stake and Returns */}
                    <div className="flex items-end justify-between gap-2">
                      <div className="space-y-0.5 sm:space-y-1">
                        <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>Stake:</div>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <span style={{ color: 'var(--muted)' }}>$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={customStakeStrings[index] || ''}
                            onChange={(e) => handleStakeChange(index, e.target.value)}
                            className="w-20 sm:w-28 text-lg sm:text-xl font-bold rounded px-1.5 sm:px-2 py-0.5 sm:py-1 focus:outline-none border"
                            style={{
                              backgroundColor: 'var(--surface-secondary)',
                              borderColor: isStakeChanged ? 'var(--success)' : 'var(--border)',
                              color: 'var(--foreground)'
                            }}
                          />
                        </div>
                        {isStakeChanged && (
                          <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            Optimal: ${optimalStake.toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>Returns</div>
                        <div className="font-medium text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>
                          ${getReturn(index).toFixed(2)}
                        </div>
                        <div 
                          className="text-xs sm:text-sm font-medium"
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
              className="p-3 sm:p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-[10px] sm:text-xs uppercase mb-0.5 sm:mb-1" style={{ color: 'var(--muted-foreground)' }}>Staked</div>
                  <div className="text-base sm:text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    ${totalStaked.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs uppercase mb-0.5 sm:mb-1" style={{ color: 'var(--muted-foreground)' }}>
                    {favourMode ? 'Min Profit' : 'Profit'}
                  </div>
                  <div 
                    className="text-base sm:text-lg font-bold"
                    style={{ color: minProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {minProfit >= 0 ? '+' : ''}${minProfit.toFixed(2)}
                  </div>
                  {favourMode && maxProfit > minProfit && (
                    <div className="text-[10px] sm:text-xs" style={{ color: 'var(--warning)' }}>
                      Max: +${maxProfit.toFixed(2)}
                    </div>
                  )}
                  {!favourMode && profitVariance > 0.01 && (
                    <div className="text-[10px] sm:text-xs text-yellow-400">
                      ±${(profitVariance / 2).toFixed(2)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs uppercase mb-0.5 sm:mb-1" style={{ color: 'var(--muted-foreground)' }}>ROI</div>
                  <div 
                    className="text-base sm:text-lg font-bold"
                    style={{ color: profitPercent >= 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Favour Mode Explanation */}
            {favourMode && favouredOutcome !== null && (
              <div 
                className="p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)'
                }}
              >
                <h4 className="font-medium mb-2 text-sm" style={{ color: 'var(--warning)' }}>
                  <Star className="w-4 h-4 inline mr-1" />
                  Favour Mode Active
                </h4>
                <div className="space-y-1 text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                  <div className="flex justify-between">
                    <span>If <strong style={{ color: 'var(--warning)' }}>{outcomes[favouredOutcome].name}</strong> wins:</span>
                    <span style={{ color: 'var(--success)' }}>+${maxProfit.toFixed(2)}</span>
                  </div>
                  {outcomes.map((outcome, i) => {
                    if (i === favouredOutcome) return null;
                    return (
                      <div key={i} className="flex justify-between">
                        <span>If {outcome.name} wins:</span>
                        <span style={{ color: getProfit(i) >= 0 ? 'var(--success)' : 'var(--muted)' }}>
                          {getProfit(i) >= 0 ? '+' : ''}${getProfit(i).toFixed(2)}
                          {Math.abs(getProfit(i)) < 0.50 && ' (break even)'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Profit Breakdown per Outcome (only show when not in favour mode) */}
            {!favourMode && profitVariance > 0.01 && (
              <div 
                className="p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)'
                }}
              >
                <h4 className="font-medium mb-1.5 sm:mb-2 text-sm sm:text-base text-yellow-400">⚠️ Unbalanced Stakes</h4>
                <p className="text-xs sm:text-sm mb-2" style={{ color: 'var(--muted)' }}>
                  Different profits per outcome:
                </p>
                <div className="space-y-1">
                  {outcomes.map((outcome, i) => (
                    <div key={i} className="flex justify-between text-xs sm:text-sm">
                      <span className="truncate mr-2" style={{ color: 'var(--muted)' }}>{outcome.name}:</span>
                      <span className="shrink-0" style={{ color: getProfit(i) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {getProfit(i) >= 0 ? '+' : ''}${getProfit(i).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRecalculateOptimal}
                  className="mt-2 sm:mt-3 w-full py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-colors"
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
            {stealthMode && !stakesModified && !favourMode && (
              <div 
                className="p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)'
                }}
              >
                <h4 className="font-medium mb-1.5 sm:mb-2 text-sm" style={{ color: 'var(--muted)' }}>🥷 Stealth Tips</h4>
                <ul className="text-xs sm:text-sm space-y-1" style={{ color: 'var(--muted-foreground)' }}>
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
                  <li>• Place bets 1-2 hours before event</li>
                  <li>• Consider a mug bet after</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div 
            className="sticky bottom-0 px-3 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3 border-t rounded-b-lg"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)'
            }}
          >
            <button
              onClick={onClose}
              className="flex-1 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors border hover:bg-[var(--surface)]"
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
              className="flex-1 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors"
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
