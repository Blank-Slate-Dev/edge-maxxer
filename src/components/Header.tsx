// src/components/Header.tsx
'use client';

import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  lastUpdated: Date | null;
  isLoading: boolean;
  isUsingMockData: boolean;
  remainingRequests?: number;
  onRefresh: () => void;
}

export function Header({
  lastUpdated,
  isLoading,
  remainingRequests,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="border-b border-[#222] bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-medium tracking-tight">
              Edge Maxxer
            </h1>
            {lastUpdated && (
              <span className="text-sm text-[#666]">
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {remainingRequests !== undefined && (
              <span className="text-xs text-[#666] font-mono">
                {remainingRequests} API calls left
              </span>
            )}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-black hover:bg-[#eee] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
