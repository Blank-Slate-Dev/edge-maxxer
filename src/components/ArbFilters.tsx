// src/components/ArbFilters.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ArbFilters as FilterType } from '@/lib/types';

interface Sport {
  key: string;
  title: string;
}

interface ArbFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  availableSports: Sport[];
  availableBookmakers: string[];
}

export function ArbFilters({
  filters,
  onFiltersChange,
  availableSports,
  availableBookmakers,
}: ArbFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof FilterType>(key: K, value: FilterType[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleSport = (sportKey: string) => {
    const current = filters.sports;
    const updated = current.includes(sportKey)
      ? current.filter(s => s !== sportKey)
      : [...current, sportKey];
    updateFilter('sports', updated);
  };

  const toggleBookmaker = (bookmaker: string) => {
    const current = filters.bookmakers;
    const updated = current.includes(bookmaker)
      ? current.filter(b => b !== bookmaker)
      : [...current, bookmaker];
    updateFilter('bookmakers', updated);
  };

  const activeFilterCount = 
    (filters.sports.length > 0 ? 1 : 0) +
    (filters.bookmakers.length > 0 ? 1 : 0) +
    (filters.mode !== 'all' ? 1 : 0) +
    (!filters.showNearArbs ? 1 : 0) +
    (filters.profitableOnly ? 1 : 0);

  return (
    <div className="border border-[#222] bg-[#0a0a0a]">
      {/* Header row with toggle and expand */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
        {/* Profitable Only Toggle - Always visible */}
        <button
          onClick={() => updateFilter('profitableOnly', !filters.profitableOnly)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border transition-colors ${
            filters.profitableOnly
              ? 'bg-green-600 text-white border-green-600'
              : 'border-[#333] text-[#888] hover:border-[#555]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${filters.profitableOnly ? 'bg-white' : 'bg-[#555]'}`} />
          Profitable Only
        </button>

        {/* Expand Filters Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-left hover:bg-[#111] px-3 py-1.5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#888]">More Filters</span>
            {activeFilterCount > 0 && (
              <span className="text-xs px-2 py-0.5 bg-white text-black font-medium">
                {activeFilterCount}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#666]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#666]" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-6">
          {/* Quick Toggles */}
          <div className="flex flex-wrap gap-4 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showNearArbs}
                onChange={e => updateFilter('showNearArbs', e.target.checked)}
                className="w-4 h-4 bg-[#111] border border-[#333] rounded"
              />
              <span className="text-sm text-[#888]">Show Near-Arbs</span>
            </label>
          </div>

          {/* Profit & Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-[#666] uppercase tracking-wide mb-2">
                Min Profit: {filters.minProfit >= 0 ? '+' : ''}{filters.minProfit.toFixed(1)}%
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.5"
                value={filters.minProfit}
                onChange={e => updateFilter('minProfit', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#555] mt-1">
                <span>-5% (near-arbs)</span>
                <span>+5% (profitable)</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#666] uppercase tracking-wide mb-2">
                Time Range: {filters.maxHoursUntilStart}h
              </label>
              <input
                type="range"
                min="1"
                max="168"
                step="1"
                value={filters.maxHoursUntilStart}
                onChange={e => updateFilter('maxHoursUntilStart', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#555] mt-1">
                <span>1 hour</span>
                <span>1 week</span>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-xs text-[#666] uppercase tracking-wide mb-2">
              Mode
            </label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'book-vs-book', label: 'Book vs Book' },
                { value: 'book-vs-betfair', label: 'Book vs Betfair' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('mode', option.value as FilterType['mode'])}
                  className={`px-3 py-1.5 text-sm border transition-colors ${
                    filters.mode === option.value
                      ? 'bg-white text-black border-white'
                      : 'border-[#333] text-[#888] hover:border-[#555]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bookmakers */}
          {availableBookmakers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-[#666] uppercase tracking-wide">
                  Bookmakers ({availableBookmakers.length})
                </label>
                {filters.bookmakers.length > 0 && (
                  <button
                    onClick={() => updateFilter('bookmakers', [])}
                    className="text-xs text-[#666] hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableBookmakers.map(bookmaker => (
                  <button
                    key={bookmaker}
                    onClick={() => toggleBookmaker(bookmaker)}
                    className={`px-2 py-1 text-xs border transition-colors ${
                      filters.bookmakers.includes(bookmaker)
                        ? 'bg-white text-black border-white'
                        : 'border-[#333] text-[#888] hover:border-[#555]'
                    }`}
                  >
                    {bookmaker}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sports */}
          {availableSports.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-[#666] uppercase tracking-wide">
                  Sports ({availableSports.length})
                </label>
                {filters.sports.length > 0 && (
                  <button
                    onClick={() => updateFilter('sports', [])}
                    className="text-xs text-[#666] hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableSports.map(sport => (
                  <button
                    key={sport.key}
                    onClick={() => toggleSport(sport.key)}
                    className={`px-2 py-1 text-xs border transition-colors ${
                      filters.sports.includes(sport.key)
                        ? 'bg-white text-black border-white'
                        : 'border-[#333] text-[#888] hover:border-[#555]'
                    }`}
                  >
                    {sport.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
