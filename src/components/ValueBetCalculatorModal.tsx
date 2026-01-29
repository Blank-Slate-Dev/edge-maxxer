// src/components/ValueBetCalculatorModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import type { ValueBet } from '@/lib/types';
import type { PlacedBet } from '@/lib/bets';
import { getBookmakerProfile, getRiskColor } from '@/lib/stealth/bookmakerProfiles';

interface ValueBetCalculatorModalProps {
  valueBet: ValueBet | null;
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

// Simple stake naturalization for single bets
function naturalizeStake(stake: number): number {
  if (stake <= 0) return 0;
  
  if (stake < 20) {
    return Math.round(stake);
  } else if (stake < 100) {
    return Math.round(stake / 5) * 5;
  } else if (stake < 500) {
    return Math.round(stake / 10) * 10;
  } else {
    return Math.round(stake / 25) * 25;
  }
}

export function ValueBetCalculatorModal({ valueBet, onClose, onLogBet }: ValueBetCalculatorModalProps) {
  const [stakeInput, setStakeInput] = useState<string>('100');
  const [stealthMode, setStealthMode] = useState<boolean>(false);

  useEffect(() => {
    if (valueBet) {
      setStakeInput('100');
    }
  }, [valueBet]);

  if (!valueBet) return null;

  const odds = valueBet.outcome.odds;
  const marketAvg = valueBet.marketAverage;
  const edge = valueBet.valuePercentage;
  
  // Parse stake and apply stealth if needed
  const rawStake = parseFloat(stakeInput) || 0;
  const stake = stealthMode ? naturalizeStake(rawStake) : rawStake;
  
  // Potential return if bet wins
  const potentialReturn = stake * odds;
  const potentialProfit = potentialReturn - stake;
  
  // Implied probability from the odds you're getting
  const impliedProb = (1 / odds) * 100;
  
  // "Fair" probability based on market average
  const fairProb = (1 / marketAvg) * 100;
  
  // Expected Value calculation
  const winProb = fairProb / 100;
  const loseProb = 1 - winProb;
  const expectedValue = (winProb * potentialProfit) - (loseProb * stake);
  const evPercentage = stake > 0 ? (expectedValue / stake) * 100 : 0;

  // Event name
  const eventName = `${valueBet.event.homeTeam} vs ${valueBet.event.awayTeam}`;

  const handleLogBet = () => {
    if (!onLogBet) return;

    const bet: Omit<PlacedBet, 'id' | 'createdAt'> = {
      event: {
        homeTeam: valueBet.event.homeTeam,
        awayTeam: valueBet.event.awayTeam,
        sportKey: valueBet.event.sportKey,
        commenceTime: valueBet.event.commenceTime.toISOString(),
      },
      mode: 'value-bet',
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
              <h2 className="text-base sm:text-lg font-semibold truncate flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--success)' }} />
                Value Bet Calculator
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
            {/* Warning */}
            <div 
              className="p-2 sm:p-3 rounded-lg border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)'
              }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg">⚠️</span>
                <span className="font-medium text-sm sm:text-base text-yellow-400">
                  Not Guaranteed
                </span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                Value bets have better-than-market odds but you can still lose. The edge shows how much better your odds are compared to other bookmakers.
              </p>
            </div>

            {/* Edge Highlight */}
            <div 
              className="p-3 sm:p-4 rounded-lg border text-center"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)'
              }}
            >
              <div className="text-[10px] sm:text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--success)' }}>Your Edge</div>
              <div className="font-mono text-2xl sm:text-3xl" style={{ color: 'var(--success)' }}>+{edge.toFixed(1)}%</div>
              <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--muted)' }}>Better odds than market average</div>
            </div>

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
                  Round stake naturally
                </p>
              </div>
              <button
                onClick={() => setStealthMode(!stealthMode)}
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

            {/* Stake Input */}
            <div>
              <label className="block text-xs sm:text-sm mb-1.5 sm:mb-2" style={{ color: 'var(--muted)' }}>Stake Amount</label>
              <div className="relative">
                <span 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted)' }}
                >$</span>
                <input
                  type="number"
                  value={stakeInput}
                  onChange={(e) => setStakeInput(e.target.value)}
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
                    onClick={() => setStakeInput(amount.toString())}
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
              {stealthMode && stake !== rawStake && (
                <div className="text-xs mt-2" style={{ color: 'var(--success)' }}>
                  🥷 Rounded: ${rawStake.toFixed(2)} → ${stake.toFixed(2)}
                </div>
              )}
            </div>

            {/* The Bet */}
            <div 
              className="p-3 sm:p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--foreground)' }}>
                    {valueBet.outcome.name}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>{valueBet.outcome.bookmaker}</span>
                    <RiskBadge bookmaker={valueBet.outcome.bookmaker} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base sm:text-lg font-bold" style={{ color: 'var(--info)' }}>
                    @ {odds.toFixed(2)}
                  </div>
                  <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {impliedProb.toFixed(1)}% implied
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between gap-2 pt-2 sm:pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div>
                  <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>Stake</div>
                  <div className="text-lg sm:text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                    ${stake.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>Market Avg</div>
                  <div className="font-mono text-sm sm:text-base" style={{ color: 'var(--muted)' }}>
                    {marketAvg.toFixed(2)} ({fairProb.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Outcomes */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>Possible Outcomes</h3>
              
              {/* Win */}
              <div 
                className="p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--success) 5%, var(--surface))',
                  borderColor: 'color-mix(in srgb, var(--success) 30%, var(--border))'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                    ✓ If {valueBet.outcome.name} wins
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>Return</div>
                    <div className="font-mono text-base sm:text-lg" style={{ color: 'var(--foreground)' }}>${potentialReturn.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>Profit</div>
                    <div className="font-mono text-base sm:text-lg" style={{ color: 'var(--success)' }}>+${potentialProfit.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Lose */}
              <div 
                className="p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--danger) 5%, var(--surface))',
                  borderColor: 'color-mix(in srgb, var(--danger) 30%, var(--border))'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                    ✗ If {valueBet.outcome.name} loses
                  </span>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>Loss</div>
                  <div className="font-mono text-base sm:text-lg" style={{ color: 'var(--danger)' }}>-${stake.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Summary / Expected Value */}
            <div 
              className="p-3 sm:p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-[10px] sm:text-xs uppercase mb-0.5 sm:mb-1" style={{ color: 'var(--muted-foreground)' }}>Stake</div>
                  <div className="text-base sm:text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    ${stake.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs uppercase mb-0.5 sm:mb-1" style={{ color: 'var(--muted-foreground)' }}>Expected Value</div>
                  <div 
                    className="text-base sm:text-lg font-bold"
                    style={{ color: expectedValue >= 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {expectedValue >= 0 ? '+' : ''}${expectedValue.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs uppercase mb-0.5 sm:mb-1" style={{ color: 'var(--muted-foreground)' }}>EV %</div>
                  <div 
                    className="text-base sm:text-lg font-bold"
                    style={{ color: evPercentage >= 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {evPercentage >= 0 ? '+' : ''}{evPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="text-[10px] sm:text-xs text-center mt-2 sm:mt-3" style={{ color: 'var(--muted-foreground)' }}>
                EV = ({fairProb.toFixed(0)}% × ${potentialProfit.toFixed(0)}) - ({(100 - fairProb).toFixed(0)}% × ${stake.toFixed(0)})
              </div>
            </div>

            {/* Stealth Tips */}
            {stealthMode && (
              <div 
                className="p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)'
                }}
              >
                <h4 className="font-medium mb-1.5 sm:mb-2 text-sm" style={{ color: 'var(--muted)' }}>🥷 Stealth Tips</h4>
                <ul className="text-xs sm:text-sm space-y-1" style={{ color: 'var(--muted-foreground)' }}>
                  {(() => {
                    const profile = getBookmakerProfile(valueBet.outcome.bookmaker);
                    if (profile?.riskLevel === 'extreme' || profile?.riskLevel === 'high') {
                      return (
                        <li>
                          • <strong style={{ color: 'var(--muted)' }}>{valueBet.outcome.bookmaker}</strong>: {profile.recommendations[0]}
                        </li>
                      );
                    }
                    return null;
                  })()}
                  <li>• Don&apos;t always bet on value - mix in some losing bets</li>
                  <li>• Vary your stake amounts over time</li>
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
