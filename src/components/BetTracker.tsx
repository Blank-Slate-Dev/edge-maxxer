// src/components/BetTracker.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, ChevronDown, ChevronUp, TrendingUp, DollarSign, Target, Percent, Calendar, Clock } from 'lucide-react';
import type { PlacedBet } from '@/lib/bets';
import { calculateBetStats } from '@/lib/bets';

interface BetTrackerProps {
  bets: PlacedBet[];
  onUpdateBet: (id: string, updates: Partial<PlacedBet>) => void;
  onDeleteBet: (id: string) => void;
  onClearAll: () => void;
}

// Format date in AEST
function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Check if event is in the past
function isEventPast(dateString: string): boolean {
  return new Date(dateString) < new Date();
}

// Check if event is starting soon (within 2 hours)
function isEventSoon(dateString: string): boolean {
  const eventTime = new Date(dateString);
  const now = new Date();
  const twoHours = 2 * 60 * 60 * 1000;
  return eventTime > now && eventTime.getTime() - now.getTime() < twoHours;
}

// Get mode badge
function ModeBadge({ mode }: { mode: PlacedBet['mode'] }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    'book-vs-book': { bg: 'bg-[#222]', text: 'text-[#888]', label: 'H2H' },
    'book-vs-betfair': { bg: 'bg-purple-900/50', text: 'text-purple-400', label: 'Betfair' },
    'value-bet': { bg: 'bg-blue-900/50', text: 'text-blue-400', label: 'Value' },
    'spread': { bg: 'bg-orange-900/50', text: 'text-orange-400', label: 'Spread' },
    'totals': { bg: 'bg-cyan-900/50', text: 'text-cyan-400', label: 'Totals' },
    'middle': { bg: 'bg-yellow-900/50', text: 'text-yellow-400', label: 'Middle' },
  };
  const style = styles[mode] || styles['book-vs-book'];
  
  return (
    <span className={`text-xs px-1.5 py-0.5 ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

export function BetTracker({ bets, onUpdateBet, onDeleteBet, onClearAll }: BetTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const stats = calculateBetStats(bets);

  if (bets.length === 0) {
    return (
      <div className="border border-[#222] bg-[#0a0a0a]">
        <div className="px-6 py-8 text-center">
          <p className="text-[#666] mb-2">No bets logged yet</p>
          <p className="text-xs text-[#444]">
            Use the calculator to log your bets and track performance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#222] bg-[#0a0a0a]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#111] transition-colors border-b border-[#222]"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium">Bet History</span>
          <span className="text-xs px-2 py-0.5 bg-[#222] text-[#888]">
            {bets.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#666]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#666]" />
        )}
      </button>

      {isExpanded && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#222] border-b border-[#222]">
            <StatCard
              icon={<Target className="w-4 h-4" />}
              label="Total Bets"
              value={stats.totalBets.toString()}
            />
            <StatCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Total Staked"
              value={`$${stats.totalStaked.toFixed(0)}`}
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Actual Profit"
              value={`$${stats.totalActualProfit.toFixed(2)}`}
              highlight={stats.totalActualProfit > 0}
              negative={stats.totalActualProfit < 0}
            />
            <StatCard
              icon={<Percent className="w-4 h-4" />}
              label="ROI"
              value={`${stats.roi.toFixed(1)}%`}
              highlight={stats.roi > 0}
              negative={stats.roi < 0}
            />
          </div>

          {/* Bet List */}
          <div className="divide-y divide-[#222] max-h-96 overflow-y-auto">
            {bets.map(bet => (
              <BetRow
                key={bet.id}
                bet={bet}
                onUpdate={updates => onUpdateBet(bet.id, updates)}
                onDelete={() => onDeleteBet(bet.id)}
              />
            ))}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3 border-t border-[#222] flex justify-end">
            {showConfirmClear ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#888]">Clear all bets?</span>
                <button
                  onClick={() => {
                    onClearAll();
                    setShowConfirmClear(false);
                  }}
                  className="text-xs px-3 py-1 bg-white text-black hover:bg-[#eee] transition-colors"
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="text-xs px-3 py-1 border border-[#333] text-[#888] hover:border-[#555] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="text-xs text-[#666] hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
  negative,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="bg-[#0a0a0a] px-4 py-3">
      <div className="flex items-center gap-2 text-[#666] mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-lg font-mono font-medium ${
        highlight ? 'text-white' : negative ? 'text-[#888]' : 'text-[#888]'
      }`}>
        {value}
      </div>
    </div>
  );
}

// Get all possible outcomes for a bet
function getBetOutcomes(bet: PlacedBet): { id: string; label: string; profit: number }[] {
  const outcomes: { id: string; label: string; profit: number }[] = [];
  
  // Value bet
  if (bet.mode === 'value-bet' && bet.bet1) {
    const totalStake = bet.bet1.stake;
    const winReturn = bet.bet1.stake * bet.bet1.odds;
    outcomes.push({ 
      id: 'won', 
      label: `${bet.bet1.outcome} won`, 
      profit: winReturn - totalStake 
    });
    outcomes.push({ 
      id: 'lost', 
      label: `${bet.bet1.outcome} lost`, 
      profit: -totalStake 
    });
  }
  // Middle bet
  else if (bet.mode === 'middle' && bet.bet1 && bet.bet2) {
    const totalStake = bet.bet1.stake + bet.bet2.stake;
    const bothWinReturn = (bet.bet1.stake * bet.bet1.odds) + (bet.bet2.stake * bet.bet2.odds);
    const side1WinReturn = bet.bet1.stake * bet.bet1.odds;
    const side2WinReturn = bet.bet2.stake * bet.bet2.odds;
    
    outcomes.push({
      id: 'middle_hit',
      label: `Middle hit! Both won`,
      profit: bothWinReturn - totalStake,
    });
    outcomes.push({
      id: 'side1_won',
      label: `${bet.bet1.outcome} won`,
      profit: side1WinReturn - totalStake,
    });
    outcomes.push({
      id: 'side2_won',
      label: `${bet.bet2.outcome} won`,
      profit: side2WinReturn - totalStake,
    });
  }
  // Spread/Totals/Book-vs-Book (2-way)
  else if ((bet.mode === 'book-vs-book' || bet.mode === 'spread' || bet.mode === 'totals') && bet.bet1 && bet.bet2) {
    const bets = [bet.bet1, bet.bet2];
    if (bet.bet3) bets.push(bet.bet3);
    
    const totalStake = bets.reduce((sum, b) => sum + b.stake, 0);
    
    bets.forEach((b, index) => {
      const returnAmount = b.stake * b.odds;
      outcomes.push({
        id: `outcome_${index}`,
        label: b.outcome,
        profit: returnAmount - totalStake,
      });
    });
  }
  // Book vs Betfair
  else if (bet.mode === 'book-vs-betfair' && bet.backBet && bet.layBet) {
    const totalStake = bet.backBet.stake + bet.layBet.liability;
    const backReturn = bet.backBet.stake * bet.backBet.odds;
    
    outcomes.push({
      id: 'back_won',
      label: `${bet.backBet.outcome} won`,
      profit: backReturn - totalStake,
    });
    outcomes.push({
      id: 'lay_won',
      label: `${bet.backBet.outcome} lost`,
      profit: bet.layBet.stake - bet.layBet.liability,
    });
  }
  
  return outcomes;
}

// Calculate profits for display
function calculateBetProfits(bet: PlacedBet): { 
  totalStake: number; 
  minProfit: number;
  maxProfit: number;
  isMiddle: boolean;
  isValueBet: boolean;
  middleProfit?: number;
} {
  // Value bet
  if (bet.mode === 'value-bet' && bet.bet1) {
    const totalStake = bet.bet1.stake;
    const potentialReturn = bet.bet1.stake * bet.bet1.odds;
    const winProfit = potentialReturn - totalStake;
    const loseProfit = -totalStake;
    
    return {
      totalStake,
      minProfit: loseProfit,
      maxProfit: winProfit,
      isMiddle: false,
      isValueBet: true,
    };
  }
  
  // Middle bet
  if (bet.mode === 'middle' && bet.bet1 && bet.bet2) {
    const totalStake = bet.bet1.stake + bet.bet2.stake;
    const bothWinReturn = (bet.bet1.stake * bet.bet1.odds) + (bet.bet2.stake * bet.bet2.odds);
    const side1WinReturn = bet.bet1.stake * bet.bet1.odds;
    const side2WinReturn = bet.bet2.stake * bet.bet2.odds;
    
    const middleProfit = bothWinReturn - totalStake;
    const missProfit = Math.max(side1WinReturn, side2WinReturn) - totalStake;
    
    return {
      totalStake,
      minProfit: missProfit,
      maxProfit: middleProfit,
      isMiddle: true,
      isValueBet: false,
      middleProfit,
    };
  }
  
  // Spread/Totals/Book-vs-Book
  if ((bet.mode === 'book-vs-book' || bet.mode === 'spread' || bet.mode === 'totals') && bet.bet1 && bet.bet2) {
    const bets = [bet.bet1, bet.bet2];
    if (bet.bet3) bets.push(bet.bet3);
    
    const totalStake = bets.reduce((sum, b) => sum + b.stake, 0);
    const returns = bets.map(b => b.stake * b.odds);
    const profits = returns.map(r => r - totalStake);
    
    return {
      totalStake,
      minProfit: Math.min(...profits),
      maxProfit: Math.max(...profits),
      isMiddle: false,
      isValueBet: false,
    };
  }
  
  // Book vs Betfair
  if (bet.backBet && bet.layBet) {
    const totalStake = bet.backBet.stake + bet.layBet.liability;
    const backReturn = bet.backBet.stake * bet.backBet.odds;
    
    const backProfit = backReturn - totalStake;
    const layProfit = bet.layBet.stake - bet.layBet.liability;
    
    return {
      totalStake,
      minProfit: Math.min(backProfit, layProfit),
      maxProfit: Math.max(backProfit, layProfit),
      isMiddle: false,
      isValueBet: false,
    };
  }
  
  return { totalStake: 0, minProfit: 0, maxProfit: 0, isMiddle: false, isValueBet: false };
}

function BetRow({
  bet,
  onUpdate,
  onDelete,
}: {
  bet: PlacedBet;
  onUpdate: (updates: Partial<PlacedBet>) => void;
  onDelete: () => void;
}) {
  const [isEditingProfit, setIsEditingProfit] = useState(false);
  const [manualProfit, setManualProfit] = useState(bet.actualProfit?.toString() || '');

  const outcomes = getBetOutcomes(bet);
  const { totalStake, minProfit, maxProfit, isMiddle, isValueBet, middleProfit } = calculateBetProfits(bet);
  const is3Way = bet.mode === 'book-vs-book' && bet.bet3;
  
  const eventPast = isEventPast(bet.event.commenceTime);
  const eventSoon = isEventSoon(bet.event.commenceTime);

  const handleOutcomeSelect = (outcomeId: string) => {
    if (outcomeId === 'pending') {
      onUpdate({ status: 'pending', actualProfit: undefined });
    } else if (outcomeId === 'manual') {
      setIsEditingProfit(true);
    } else {
      const selectedOutcome = outcomes.find(o => o.id === outcomeId);
      if (selectedOutcome) {
        let status: PlacedBet['status'] = 'won';
        if (outcomeId === 'middle_hit') {
          status = 'middle-hit';
        } else if (isMiddle && outcomeId !== 'middle_hit') {
          status = 'middle-miss';
        } else if (selectedOutcome.profit < 0) {
          status = 'lost';
        }
        onUpdate({ 
          status,
          actualProfit: selectedOutcome.profit 
        });
      }
    }
  };

  const handleManualProfitSave = () => {
    const profit = parseFloat(manualProfit);
    if (!isNaN(profit)) {
      onUpdate({ status: 'partial', actualProfit: profit });
    }
    setIsEditingProfit(false);
  };

  // Determine current selection
  const getCurrentOutcomeId = (): string => {
    if (bet.status === 'pending') return 'pending';
    if (bet.status === 'partial') return 'manual';
    
    if (bet.actualProfit !== undefined) {
      const matching = outcomes.find(o => Math.abs(o.profit - bet.actualProfit!) < 0.01);
      if (matching) return matching.id;
    }
    
    return 'pending';
  };

  return (
    <div className="px-6 py-4 hover:bg-[#111] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Event Title */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium truncate">
              {bet.event.homeTeam} vs {bet.event.awayTeam}
            </span>
            <ModeBadge mode={bet.mode} />
            {is3Way && (
              <span className="text-xs px-1.5 py-0.5 bg-[#222] text-[#888]">
                3-way
              </span>
            )}
          </div>
          
          {/* Event Time */}
          <div className="flex items-center gap-3 mb-2 text-xs flex-wrap">
            <div className={`flex items-center gap-1 ${
              eventPast 
                ? 'text-[#666]' 
                : eventSoon 
                  ? 'text-yellow-500' 
                  : 'text-[#888]'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{formatEventTime(bet.event.commenceTime)}</span>
              {eventPast && <span className="text-[#555]">(finished)</span>}
              {eventSoon && <span className="text-yellow-500">(soon!)</span>}
            </div>
            <div className="flex items-center gap-1 text-[#555]">
              <Calendar className="w-3 h-3" />
              <span>Placed {format(new Date(bet.createdAt), 'MMM d, h:mm a')}</span>
            </div>
          </div>
          
          {/* Individual Bets */}
          <div className="text-xs space-y-1 mb-2">
            {/* Value Bet */}
            {bet.mode === 'value-bet' && bet.bet1 && (
              <BetLine 
                stake={bet.bet1.stake} 
                outcome={bet.bet1.outcome} 
                odds={bet.bet1.odds} 
                bookmaker={bet.bet1.bookmaker} 
              />
            )}
            
            {/* Spread/Totals/Middle/Book-vs-Book */}
            {(bet.mode === 'book-vs-book' || bet.mode === 'spread' || bet.mode === 'totals' || bet.mode === 'middle') && bet.bet1 && bet.bet2 && (
              <>
                <BetLine 
                  stake={bet.bet1.stake} 
                  outcome={bet.bet1.outcome} 
                  odds={bet.bet1.odds} 
                  bookmaker={bet.bet1.bookmaker}
                  point={bet.bet1.point}
                />
                <BetLine 
                  stake={bet.bet2.stake} 
                  outcome={bet.bet2.outcome} 
                  odds={bet.bet2.odds} 
                  bookmaker={bet.bet2.bookmaker}
                  point={bet.bet2.point}
                />
                {bet.bet3 && (
                  <BetLine 
                    stake={bet.bet3.stake} 
                    outcome={bet.bet3.outcome} 
                    odds={bet.bet3.odds} 
                    bookmaker={bet.bet3.bookmaker} 
                  />
                )}
              </>
            )}
            
            {/* Book vs Betfair */}
            {bet.mode === 'book-vs-betfair' && bet.backBet && bet.layBet && (
              <>
                <BetLine 
                  stake={bet.backBet.stake} 
                  outcome={bet.backBet.outcome} 
                  odds={bet.backBet.odds} 
                  bookmaker={bet.backBet.bookmaker}
                  prefix="Back"
                />
                <div className="flex justify-between text-[#666]">
                  <span>
                    Lay ${bet.layBet.stake.toFixed(2)} @ {bet.layBet.odds} (liability: ${bet.layBet.liability.toFixed(2)})
                  </span>
                  <span className="text-[#888]">
                    Return: ${(bet.layBet.stake + bet.layBet.liability).toFixed(2)}
                  </span>
                </div>
              </>
            )}

            {/* Middle Range */}
            {bet.mode === 'middle' && bet.middleRange && (
              <div className="text-yellow-400 mt-1">
                🎯 {bet.middleRange.description}
              </div>
            )}
          </div>

          {/* Summary Line */}
          <div className="flex items-center gap-4 text-xs pt-1 border-t border-[#1a1a1a] flex-wrap">
            <span className="text-[#555]">
              Total: ${totalStake.toFixed(2)}
            </span>
            {isValueBet ? (
              <span className="text-blue-400">
                EV: +${bet.expectedProfit.toFixed(2)} · If win: +${maxProfit.toFixed(2)}
              </span>
            ) : isMiddle ? (
              <span className="text-yellow-400">
                If middle: +${middleProfit?.toFixed(2)} · If miss: ${minProfit.toFixed(2)}
              </span>
            ) : (
              <span className={`font-medium ${minProfit >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                {Math.abs(maxProfit - minProfit) > 0.01 ? (
                  <>Profit: ${minProfit.toFixed(2)} – ${maxProfit.toFixed(2)}</>
                ) : (
                  <>Guaranteed: {minProfit >= 0 ? '+' : ''}${minProfit.toFixed(2)}</>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Outcome Selector */}
          <select
            value={getCurrentOutcomeId()}
            onChange={e => handleOutcomeSelect(e.target.value)}
            className="bg-[#111] border border-[#333] text-xs px-2 py-1 focus:outline-none focus:border-white max-w-[160px]"
          >
            <option value="pending">Pending</option>
            <optgroup label="Select Outcome">
              {outcomes.map(outcome => (
                <option key={outcome.id} value={outcome.id}>
                  {outcome.label} ({outcome.profit >= 0 ? '+' : ''}${outcome.profit.toFixed(2)})
                </option>
              ))}
            </optgroup>
            <option value="manual">Manual entry...</option>
          </select>

          {/* Actual Profit Display / Edit */}
          <div className="w-24 text-right">
            {bet.status === 'pending' ? (
              <div className="text-xs text-[#666]">
                Exp: ${bet.expectedProfit.toFixed(2)}
              </div>
            ) : isEditingProfit || getCurrentOutcomeId() === 'manual' ? (
              <div className="flex gap-1">
                <input
                  type="number"
                  value={manualProfit}
                  onChange={e => setManualProfit(e.target.value)}
                  className="w-16 bg-[#111] border border-[#333] text-xs px-2 py-1 font-mono focus:outline-none focus:border-white"
                  placeholder="0.00"
                  autoFocus
                  onBlur={handleManualProfitSave}
                  onKeyDown={e => e.key === 'Enter' && handleManualProfitSave()}
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  setManualProfit(bet.actualProfit?.toString() || '');
                  setIsEditingProfit(true);
                }}
                className="text-xs font-mono hover:text-white transition-colors"
                title="Click to edit manually"
              >
                {bet.actualProfit !== undefined ? (
                  <span className={bet.actualProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {bet.actualProfit >= 0 ? '+' : ''}${bet.actualProfit.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-[#666]">Set profit</span>
                )}
              </button>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-1 text-[#666] hover:text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Individual bet line with return calculation
function BetLine({ 
  stake, 
  outcome, 
  odds, 
  bookmaker,
  prefix,
  point,
}: { 
  stake: number; 
  outcome: string; 
  odds: number; 
  bookmaker: string;
  prefix?: string;
  point?: number;
}) {
  const returnAmount = stake * odds;
  
  return (
    <div className="flex justify-between text-[#666]">
      <span>
        {prefix && <span className="text-[#888]">{prefix} </span>}
        ${stake.toFixed(2)} on {outcome}
        {point !== undefined && <span className="text-[#888]"> ({point > 0 ? '+' : ''}{point})</span>}
        {' '}@ {odds.toFixed(2)} ({bookmaker})
      </span>
      <span className="text-[#888] ml-4 whitespace-nowrap">
        Return: ${returnAmount.toFixed(2)}
      </span>
    </div>
  );
}