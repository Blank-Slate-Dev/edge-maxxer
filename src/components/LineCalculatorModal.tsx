// src/components/LineCalculatorModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Star } from 'lucide-react';
import type { SpreadArb, TotalsArb, MiddleOpportunity } from '@/lib/types';
import type { PlacedBet } from '@/lib/bets';
import { generateBetId } from '@/lib/bets';
import { getBookmakerProfile, getRiskColor } from '@/lib/stealth/bookmakerProfiles';
import { naturalizeArbStakes, NaturalizedStake } from '@/lib/stealth/stakeNaturalizer';

interface LineCalculatorModalProps {
  opportunity: SpreadArb | TotalsArb | MiddleOpportunity | null;
  onClose: () => void;
  onLogBet?: (bet: Omit<PlacedBet, 'id' | 'createdAt'>) => void;
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

export function LineCalculatorModal({ opportunity, onClose, onLogBet }: LineCalculatorModalProps) {
  const [totalStake, setTotalStake] = useState<string>('100');
  const [stealthMode, setStealthMode] = useState<boolean>(false);
  const [favourMode, setFavourMode] = useState<boolean>(false);
  const [favouredOutcome, setFavouredOutcome] = useState<number | null>(null);
  const [naturalizedStakes, setNaturalizedStakes] = useState<NaturalizedStake[]>([]);
  
  // Editable odds
  const [odds1String, setOdds1String] = useState<string>('');
  const [odds2String, setOdds2String] = useState<string>('');
  
  // Editable stakes
  const [stake1String, setStake1String] = useState<string>('');
  const [stake2String, setStake2String] = useState<string>('');
  const [stakesModified, setStakesModified] = useState(false);
  const [oddsModified, setOddsModified] = useState(false);

  // Initialize when opportunity changes
  useEffect(() => {
    if (opportunity) {
      setStakesModified(false);
      setOddsModified(false);
      setFavourMode(false);
      setFavouredOutcome(null);
      
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

  // Get bookmaker names
  const getBookmakers = useCallback(() => {
    if (!opportunity) return { bookmaker1: '', bookmaker2: '' };
    
    if (opportunity.mode === 'middle') {
      return { 
        bookmaker1: opportunity.side1.bookmaker, 
        bookmaker2: opportunity.side2.bookmaker 
      };
    } else if (opportunity.mode === 'spread') {
      return { 
        bookmaker1: opportunity.favorite.bookmaker, 
        bookmaker2: opportunity.underdog.bookmaker 
      };
    } else {
      return { 
        bookmaker1: opportunity.over.bookmaker, 
        bookmaker2: opportunity.under.bookmaker 
      };
    }
  }, [opportunity]);

  // Get bet labels
  const getLabels = useCallback(() => {
    if (!opportunity) return { label1: '', label2: '' };
    
    if (opportunity.mode === 'middle') {
      return { 
        label1: opportunity.side1.name, 
        label2: opportunity.side2.name 
      };
    } else if (opportunity.mode === 'spread') {
      return { 
        label1: `${opportunity.favorite.name} ${opportunity.favorite.point > 0 ? '+' : ''}${opportunity.favorite.point}`, 
        label2: `${opportunity.underdog.name} +${Math.abs(opportunity.underdog.point)}` 
      };
    } else {
      return { 
        label1: `Over ${opportunity.line}`, 
        label2: `Under ${opportunity.line}` 
      };
    }
  }, [opportunity]);

  // Calculate optimal stakes
  const calculateOptimalStakes = useCallback((o1: number, o2: number, total: number, bm1: string, bm2: string) => {
    if (total <= 0 || o1 <= 1 || o2 <= 1) {
      return { stake1: 0, stake2: 0, naturalized: [] as NaturalizedStake[] };
    }

    let stake1: number;
    let stake2: number;

    // Favour mode calculation (only for non-middles)
    if (favourMode && favouredOutcome !== null) {
      const favouredIdx = favouredOutcome;
      const nonFavouredIdx = favouredOutcome === 0 ? 1 : 0;
      const nonFavouredOdds = nonFavouredIdx === 0 ? o1 : o2;
      
      // For break-even on non-favoured: stake_nf * odds_nf = total
      const stakeNonFavoured = total / nonFavouredOdds;
      const stakeFavoured = total - stakeNonFavoured;
      
      if (favouredIdx === 0) {
        stake1 = stakeFavoured;
        stake2 = stakeNonFavoured;
      } else {
        stake1 = stakeNonFavoured;
        stake2 = stakeFavoured;
      }
    } else {
      // Standard arb calculation
      const impliedSum = (1 / o1) + (1 / o2);
      stake1 = total * (1 / o1) / impliedSum;
      stake2 = total * (1 / o2) / impliedSum;
    }

    // Apply stealth mode naturalization
    let naturalized: NaturalizedStake[] = [];
    if (stealthMode) {
      const result = naturalizeArbStakes(stake1, stake2, bm1, bm2, total);
      naturalized = [result.stake1, result.stake2];
      stake1 = result.stake1.naturalized;
      stake2 = result.stake2.naturalized;
    }

    return { stake1, stake2, naturalized };
  }, [stealthMode, favourMode, favouredOutcome]);

  // Recalculate stakes when inputs change
  useEffect(() => {
    if (!opportunity || stakesModified) return;
    
    const total = parseFloat(totalStake) || 0;
    const o1 = parseFloat(odds1String) || 0;
    const o2 = parseFloat(odds2String) || 0;
    const { bookmaker1, bookmaker2 } = getBookmakers();
    
    if (opportunity.mode === 'middle') {
      // For middles, equal stakes (no favour mode)
      if (stealthMode) {
        const result = naturalizeArbStakes(total / 2, total / 2, bookmaker1, bookmaker2, total);
        setNaturalizedStakes([result.stake1, result.stake2]);
        setStake1String(result.stake1.naturalized.toFixed(2));
        setStake2String(result.stake2.naturalized.toFixed(2));
      } else {
        setNaturalizedStakes([]);
        setStake1String((total / 2).toFixed(2));
        setStake2String((total / 2).toFixed(2));
      }
    } else {
      const { stake1, stake2, naturalized } = calculateOptimalStakes(o1, o2, total, bookmaker1, bookmaker2);
      setNaturalizedStakes(naturalized);
      setStake1String(stake1.toFixed(2));
      setStake2String(stake2.toFixed(2));
    }
  }, [opportunity, totalStake, odds1String, odds2String, stakesModified, calculateOptimalStakes, getBookmakers, stealthMode]);

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

  const { bookmaker1, bookmaker2 } = getBookmakers();
  const { label1, label2 } = getLabels();

  // Calculate returns and profits
  const return1 = stake1 * odds1;
  const return2 = stake2 * odds2;
  const profit1 = return1 - total;
  const profit2 = return2 - total;
  
  // Min/max profits
  const minProfit = Math.min(profit1, profit2);
  const maxProfit = Math.max(profit1, profit2);
  const profitVariance = maxProfit - minProfit;
  const profitPercent = total > 0 ? (minProfit / total) * 100 : 0;
  
  // For middles: potential profit if middle hits
  const middleProfit = return1 + return2 - total;
  const middleLoss = Math.min(profit1, profit2);
  
  // Calculate implied probability
  const impliedSum = odds1 > 1 && odds2 > 1 ? (1 / odds1) + (1 / odds2) : 2;
  const isArb = impliedSum < 1;

  // Check if odds have been modified
  const oddsChanged = Math.abs(odds1 - originalOdds1) > 0.001 || Math.abs(odds2 - originalOdds2) > 0.001;

  // Get optimal stakes for comparison
  const getOptimalStakes = () => {
    const t = parseFloat(totalStake) || 0;
    const { stake1: opt1, stake2: opt2 } = calculateOptimalStakes(odds1, odds2, t, bookmaker1, bookmaker2);
    return [opt1, opt2];
  };
  const optimalStakes = getOptimalStakes();

  // Event name
  const eventName = `${opportunity.event.homeTeam} vs ${opportunity.event.awayTeam}`;

  // Outcomes array for favour mode
  const outcomes = [
    { name: label1, bookmaker: bookmaker1, odds: odds1 },
    { name: label2, bookmaker: bookmaker2, odds: odds2 }
  ];

  const handleOdds1Change = (value: string) => {
    setOdds1String(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && Math.abs(parsed - originalOdds1) > 0.001) {
      setOddsModified(true);
    }
    setStakesModified(false);
  };

  const handleOdds2Change = (value: string) => {
    setOdds2String(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && Math.abs(parsed - originalOdds2) > 0.001) {
      setOddsModified(true);
    }
    setStakesModified(false);
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
    setFavourMode(false);
    setFavouredOutcome(null);
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

  const handleLogBet = () => {
    if (!onLogBet) return;

    const bet: Omit<PlacedBet, 'id' | 'createdAt'> = {
      event: {
        homeTeam: opportunity.event.homeTeam,
        awayTeam: opportunity.event.awayTeam,
        sportKey: opportunity.event.sportKey,
        commenceTime: opportunity.event.commenceTime.toISOString(),
      },
      mode: opportunity.mode,
      expectedProfit: isMiddle ? opportunity.expectedValue : minProfit,
      potentialProfit: isMiddle ? middleProfit : (favourMode ? maxProfit : undefined),
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
              <h2 className="text-base sm:text-lg font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                {isMiddle ? '🎯 Middle Calculator' : isSpread ? 'Spread Calculator' : 'Totals Calculator'}
              </h2>
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
            {/* Arb/Middle Status Indicator */}
            {isMiddle ? (
              <div 
                className="p-2 sm:p-3 rounded-lg border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)'
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-base sm:text-lg">🎯</span>
                    <span className="font-medium text-sm sm:text-base text-yellow-400">
                      Middle Opportunity
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                    ~{opportunity.middleProbability.toFixed(0)}% chance
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                  NOT guaranteed. Win big if middle hits, small loss if it doesn&apos;t.
                </p>
              </div>
            ) : (
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
                    {(impliedSum * 100).toFixed(2)}% implied
                  </div>
                </div>
              </div>
            )}

            {/* Mode Toggles Row - Only show for non-middles */}
            {!isMiddle && (
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
            )}

            {/* Stealth Toggle for Middles (single toggle) */}
            {isMiddle && (
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
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
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
            )}

            {/* Favour Mode Outcome Selector */}
            {!isMiddle && favourMode && (
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
                  If your pick wins → double profit. Other outcome → break even.
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
              
              {/* Bet 1 */}
              <div 
                className="p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: (favourMode && favouredOutcome === 0) ? 'var(--warning)' : 'var(--border)'
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {favourMode && favouredOutcome === 0 && <Star className="w-4 h-4 shrink-0" style={{ color: 'var(--warning)' }} />}
                      <div className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--foreground)' }}>{label1}</div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>{bookmaker1}</span>
                      <RiskBadge bookmaker={bookmaker1} />
                      {favourMode && favouredOutcome === 0 && (
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
                        value={odds1String}
                        onChange={(e) => handleOdds1Change(e.target.value)}
                        className="w-16 sm:w-20 text-right text-base sm:text-lg font-bold rounded px-1.5 sm:px-2 py-0.5 sm:py-1 focus:outline-none border"
                        style={{
                          backgroundColor: 'var(--surface-secondary)',
                          borderColor: Math.abs(odds1 - originalOdds1) > 0.001 ? 'var(--info)' : 'var(--border)',
                          color: 'var(--info)'
                        }}
                      />
                    </div>
                    <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {((1 / odds1) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>Stake:</div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <span style={{ color: 'var(--muted)' }}>$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={stake1String}
                        onChange={(e) => handleStake1Change(e.target.value)}
                        className="w-20 sm:w-28 text-lg sm:text-xl font-bold rounded px-1.5 sm:px-2 py-0.5 sm:py-1 focus:outline-none border"
                        style={{
                          backgroundColor: 'var(--surface-secondary)',
                          borderColor: stakesModified ? 'var(--success)' : 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                      />
                    </div>
                    {stakesModified && Math.abs(stake1 - optimalStakes[0]) > 0.5 && (
                      <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        Optimal: ${optimalStakes[0].toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>Returns</div>
                    <div className="font-medium text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>
                      ${return1.toFixed(2)}
                    </div>
                    <div 
                      className="text-xs sm:text-sm font-medium"
                      style={{ color: profit1 >= 0 ? 'var(--success)' : 'var(--danger)' }}
                    >
                      {profit1 >= 0 ? '+' : ''}${profit1.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bet 2 */}
              <div 
                className="p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: (favourMode && favouredOutcome === 1) ? 'var(--warning)' : 'var(--border)'
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {favourMode && favouredOutcome === 1 && <Star className="w-4 h-4 shrink-0" style={{ color: 'var(--warning)' }} />}
                      <div className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--foreground)' }}>{label2}</div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>{bookmaker2}</span>
                      <RiskBadge bookmaker={bookmaker2} />
                      {favourMode && favouredOutcome === 1 && (
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
                        value={odds2String}
                        onChange={(e) => handleOdds2Change(e.target.value)}
                        className="w-16 sm:w-20 text-right text-base sm:text-lg font-bold rounded px-1.5 sm:px-2 py-0.5 sm:py-1 focus:outline-none border"
                        style={{
                          backgroundColor: 'var(--surface-secondary)',
                          borderColor: Math.abs(odds2 - originalOdds2) > 0.001 ? 'var(--info)' : 'var(--border)',
                          color: 'var(--info)'
                        }}
                      />
                    </div>
                    <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {((1 / odds2) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>Stake:</div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <span style={{ color: 'var(--muted)' }}>$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={stake2String}
                        onChange={(e) => handleStake2Change(e.target.value)}
                        className="w-20 sm:w-28 text-lg sm:text-xl font-bold rounded px-1.5 sm:px-2 py-0.5 sm:py-1 focus:outline-none border"
                        style={{
                          backgroundColor: 'var(--surface-secondary)',
                          borderColor: stakesModified ? 'var(--success)' : 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                      />
                    </div>
                    {stakesModified && Math.abs(stake2 - optimalStakes[1]) > 0.5 && (
                      <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        Optimal: ${optimalStakes[1].toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>Returns</div>
                    <div className="font-medium text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>
                      ${return2.toFixed(2)}
                    </div>
                    <div 
                      className="text-xs sm:text-sm font-medium"
                      style={{ color: profit2 >= 0 ? 'var(--success)' : 'var(--danger)' }}
                    >
                      {profit2 >= 0 ? '+' : ''}${profit2.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            {isMiddle ? (
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className="p-3 sm:p-4 text-center rounded-lg border"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)'
                  }}
                >
                  <div className="text-[10px] sm:text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--success)' }}>If Middle Hits</div>
                  <div className="font-mono text-xl sm:text-2xl text-green-400">
                    +${middleProfit.toFixed(2)}
                  </div>
                  <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--success)' }}>
                    ~{opportunity.middleProbability.toFixed(0)}% chance
                  </div>
                </div>
                <div 
                  className="p-3 sm:p-4 text-center rounded-lg border"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--danger) 10%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)'
                  }}
                >
                  <div className="text-[10px] sm:text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--danger)' }}>If Middle Misses</div>
                  <div className="font-mono text-xl sm:text-2xl text-red-400">
                    ${middleLoss.toFixed(2)}
                  </div>
                  <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--danger)' }}>
                    ~{(100 - opportunity.middleProbability).toFixed(0)}% chance
                  </div>
                </div>
              </div>
            ) : (
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
                      ${total.toFixed(2)}
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
            )}

            {/* Middle Zone Info */}
            {isMiddle && (
              <div 
                className="p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)'
                }}
              >
                <div className="text-[10px] sm:text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Middle Zone</div>
                <div className="text-yellow-400 font-medium">
                  {opportunity.middleRange.description}
                </div>
                <div className="text-xs sm:text-sm mt-2" style={{ color: 'var(--muted)' }}>
                  If the final margin lands in this range, both bets win!
                </div>
              </div>
            )}

            {/* Favour Mode Explanation */}
            {!isMiddle && favourMode && favouredOutcome !== null && (
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
                    const profit = i === 0 ? profit1 : profit2;
                    return (
                      <div key={i} className="flex justify-between">
                        <span>If {outcome.name} wins:</span>
                        <span style={{ color: profit >= 0 ? 'var(--success)' : 'var(--muted)' }}>
                          {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                          {Math.abs(profit) < 0.50 && ' (break even)'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unbalanced Stakes Warning (only when not in favour mode) */}
            {!isMiddle && !favourMode && profitVariance > 0.01 && (
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
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="truncate mr-2" style={{ color: 'var(--muted)' }}>{label1}:</span>
                    <span className="shrink-0" style={{ color: profit1 >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {profit1 >= 0 ? '+' : ''}${profit1.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="truncate mr-2" style={{ color: 'var(--muted)' }}>{label2}:</span>
                    <span className="shrink-0" style={{ color: profit2 >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {profit2 >= 0 ? '+' : ''}${profit2.toFixed(2)}
                    </span>
                  </div>
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
                  {[bookmaker1, bookmaker2].map((bm, i) => {
                    const profile = getBookmakerProfile(bm);
                    if (profile?.riskLevel === 'extreme' || profile?.riskLevel === 'high') {
                      return (
                        <li key={i}>
                          • <strong style={{ color: 'var(--muted)' }}>{bm}</strong>: {profile.recommendations[0]}
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
            {onLogBet && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}