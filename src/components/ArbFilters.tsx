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
    <div 
      className="border rounded-lg"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--surface)'
      }}
    >
      {/* Header row with toggle and expand */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Profitable Only Toggle - Always visible */}
        <button
          onClick={() => updateFilter('profitableOnly', !filters.profitableOnly)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border transition-colors rounded"
          style={{
            backgroundColor: filters.profitableOnly ? 'var(--success)' : 'transparent',
            borderColor: filters.profitableOnly ? 'var(--success)' : 'var(--border)',
            color: filters.profitableOnly ? 'white' : 'var(--muted)'
          }}
        >
          <span 
            className="w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: filters.profitableOnly ? 'white' : 'var(--muted-foreground)' 
            }} 
          />
          Profitable Only
        </button>

        {/* Expand Filters Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-left hover:bg-[var(--surface-hover)] px-3 py-1.5 transition-colors rounded"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>More Filters</span>
            {activeFilterCount > 0 && (
              <span 
                className="text-xs px-2 py-0.5 font-medium rounded"
                style={{
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)'
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" style={{ color: 'var(--muted)' }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--muted)' }} />
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
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border)'
                }}
              />
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Show Near-Arbs</span>
            </label>
          </div>

          {/* Profit & Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label 
                className="block text-xs uppercase tracking-wide mb-2"
                style={{ color: 'var(--muted)' }}
              >
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
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                <span>-5% (near-arbs)</span>
                <span>+5% (profitable)</span>
              </div>
            </div>
            <div>
              <label 
                className="block text-xs uppercase tracking-wide mb-2"
                style={{ color: 'var(--muted)' }}
              >
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
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                <span>1 hour</span>
                <span>1 week</span>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label 
              className="block text-xs uppercase tracking-wide mb-2"
              style={{ color: 'var(--muted)' }}
            >
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
                  className="px-3 py-1.5 text-sm border transition-colors rounded"
                  style={{
                    backgroundColor: filters.mode === option.value ? 'var(--foreground)' : 'transparent',
                    borderColor: filters.mode === option.value ? 'var(--foreground)' : 'var(--border)',
                    color: filters.mode === option.value ? 'var(--background)' : 'var(--muted)'
                  }}
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
                <label 
                  className="text-xs uppercase tracking-wide"
                  style={{ color: 'var(--muted)' }}
                >
                  Bookmakers ({availableBookmakers.length})
                </label>
                {filters.bookmakers.length > 0 && (
                  <button
                    onClick={() => updateFilter('bookmakers', [])}
                    className="text-xs hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--muted)' }}
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
                    className="px-2 py-1 text-xs border transition-colors rounded"
                    style={{
                      backgroundColor: filters.bookmakers.includes(bookmaker) ? 'var(--foreground)' : 'transparent',
                      borderColor: filters.bookmakers.includes(bookmaker) ? 'var(--foreground)' : 'var(--border)',
                      color: filters.bookmakers.includes(bookmaker) ? 'var(--background)' : 'var(--muted)'
                    }}
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
                <label 
                  className="text-xs uppercase tracking-wide"
                  style={{ color: 'var(--muted)' }}
                >
                  Sports ({availableSports.length})
                </label>
                {filters.sports.length > 0 && (
                  <button
                    onClick={() => updateFilter('sports', [])}
                    className="text-xs hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--muted)' }}
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
                    className="px-2 py-1 text-xs border transition-colors rounded"
                    style={{
                      backgroundColor: filters.sports.includes(sport.key) ? 'var(--foreground)' : 'transparent',
                      borderColor: filters.sports.includes(sport.key) ? 'var(--foreground)' : 'var(--border)',
                      color: filters.sports.includes(sport.key) ? 'var(--background)' : 'var(--muted)'
                    }}
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
