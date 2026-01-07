// src/components/BetTracker.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, ChevronDown, ChevronUp, TrendingUp, DollarSign, Target, Percent } from 'lucide-react';
import type { PlacedBet } from '@/lib/bets';
import { calculateBetStats } from '@/lib/bets';

interface BetTrackerProps {
  bets: PlacedBet[];
  onUpdateBet: (id: string, updates: Partial<PlacedBet>) => void;
  onDeleteBet: (id: string) => void;
  onClearAll: () => void;
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

function BetRow({
  bet,
  onUpdate,
  onDelete,
}: {
  bet: PlacedBet;
  onUpdate: (updates: Partial<PlacedBet>) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [actualProfit, setActualProfit] = useState(bet.actualProfit?.toString() || '');

  const handleStatusChange = (status: PlacedBet['status']) => {
    onUpdate({ status });
    if (status === 'pending') {
      onUpdate({ actualProfit: undefined });
    }
  };

  const handleProfitSave = () => {
    const profit = parseFloat(actualProfit);
    if (!isNaN(profit)) {
      onUpdate({ actualProfit: profit });
    }
    setIsEditing(false);
  };

  const totalStake = bet.mode === 'book-vs-book' && bet.bet1 && bet.bet2
    ? bet.bet1.stake + bet.bet2.stake
    : bet.backBet && bet.layBet
    ? bet.backBet.stake + bet.layBet.liability
    : 0;

  return (
    <div className="px-6 py-4 hover:bg-[#111] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">
              {bet.event.homeTeam} vs {bet.event.awayTeam}
            </span>
            <span className="text-xs text-[#666]">
              {format(new Date(bet.createdAt), 'MMM d')}
            </span>
          </div>
          <div className="text-xs text-[#666] space-y-0.5">
            {bet.mode === 'book-vs-book' && bet.bet1 && bet.bet2 ? (
              <>
                <div>${bet.bet1.stake.toFixed(2)} on {bet.bet1.outcome} @ {bet.bet1.odds} ({bet.bet1.bookmaker})</div>
                <div>${bet.bet2.stake.toFixed(2)} on {bet.bet2.outcome} @ {bet.bet2.odds} ({bet.bet2.bookmaker})</div>
              </>
            ) : bet.backBet && bet.layBet ? (
              <>
                <div>Back ${bet.backBet.stake.toFixed(2)} on {bet.backBet.outcome} @ {bet.backBet.odds}</div>
                <div>Lay ${bet.layBet.stake.toFixed(2)} @ {bet.layBet.odds} (liability: ${bet.layBet.liability.toFixed(2)})</div>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status */}
          <select
            value={bet.status}
            onChange={e => handleStatusChange(e.target.value as PlacedBet['status'])}
            className="bg-[#111] border border-[#333] text-xs px-2 py-1 focus:outline-none focus:border-white"
          >
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="partial">Partial</option>
          </select>

          {/* Profit */}
          <div className="w-24 text-right">
            {bet.status === 'pending' ? (
              <div className="text-xs text-[#666]">
                Expected: ${bet.expectedProfit.toFixed(2)}
              </div>
            ) : isEditing ? (
              <div className="flex gap-1">
                <input
                  type="number"
                  value={actualProfit}
                  onChange={e => setActualProfit(e.target.value)}
                  className="w-16 bg-[#111] border border-[#333] text-xs px-2 py-1 font-mono focus:outline-none focus:border-white"
                  placeholder="0.00"
                  autoFocus
                  onBlur={handleProfitSave}
                  onKeyDown={e => e.key === 'Enter' && handleProfitSave()}
                />
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-mono hover:text-white transition-colors"
              >
                {bet.actualProfit !== undefined ? (
                  <span className={bet.actualProfit >= 0 ? 'text-white' : 'text-[#888]'}>
                    ${bet.actualProfit.toFixed(2)}
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
