// src/app/dashboard/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { Header, ArbFilters, ArbTable, StakeCalculatorModal, ValueBetCalculatorModal, BetTracker, AccountsManager } from '@/components';
import { useBets } from '@/hooks/useBets';
import { useAccounts } from '@/hooks/useAccounts';
import type { ArbOpportunity, ValueBet, ArbFilters as FilterType, ScanStats } from '@/lib/types';
import type { PlacedBet } from '@/lib/bets';
import { config } from '@/lib/config';
import { format } from 'date-fns';

interface Sport {
  key: string;
  title: string;
  group?: string;
}

interface ArbsResponse {
  opportunities: ArbOpportunity[];
  valueBets: ValueBet[];
  stats: ScanStats;
  lastUpdated: string;
  isUsingMockData: boolean;
  cached: boolean;
  remainingApiRequests?: number;
  error?: string;
  details?: string;
}

interface SportsResponse {
  sports: Sport[];
  isUsingMockData: boolean;
}

const DEFAULT_FILTERS: FilterType = {
  minProfit: -2,
  sports: [],
  bookmakers: [],
  maxHoursUntilStart: 72,
  mode: 'all',
  showNearArbs: true,
  showValueBets: true,
  profitableOnly: false,
};

type Tab = 'opportunities' | 'value-bets' | 'history' | 'accounts';

export default function DashboardPage() {
  const [opportunities, setOpportunities] = useState<ArbOpportunity[]>([]);
  const [valueBets, setValueBets] = useState<ValueBet[]>([]);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [filters, setFilters] = useState<FilterType>(DEFAULT_FILTERS);
  const [sports, setSports] = useState<Sport[]>([]);
  const [bookmakers, setBookmakers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number | undefined>();
  const [selectedArb, setSelectedArb] = useState<ArbOpportunity | null>(null);
  const [selectedValueBet, setSelectedValueBet] = useState<ValueBet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('opportunities');

  const { bets, isLoaded: betsLoaded, addBet, updateBet, deleteBet, clearAllBets } = useBets();
  const { 
    accounts, 
    transactions, 
    isLoaded: accountsLoaded,
    toggleAccount, 
    addTransaction, 
    deleteTransaction 
  } = useAccounts();

  const fetchSports = useCallback(async () => {
    try {
      const res = await fetch('/api/sports');
      const data: SportsResponse = await res.json();
      if (data.sports) {
        setSports(data.sports);
      }
    } catch (err) {
      console.error('Failed to fetch sports:', err);
    }
  }, []);

  const fetchArbs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (sports.length === 0) {
        await fetchSports();
      }

      const params = new URLSearchParams({
        minProfit: filters.minProfit.toString(),
        maxHours: filters.maxHoursUntilStart.toString(),
        refresh: 'true',
        nearArbs: filters.showNearArbs ? 'true' : 'false',
        valueBets: filters.showValueBets ? 'true' : 'false',
      });
      
      if (filters.sports.length > 0) {
        params.set('sports', filters.sports.join(','));
      }

      const res = await fetch(`/api/arbs?${params}`);
      const data: ArbsResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch arbs');
      }

      const parsed = data.opportunities.map(opp => ({
        ...opp,
        event: {
          ...opp.event,
          commenceTime: new Date(opp.event.commenceTime),
        },
        lastUpdated: new Date(opp.lastUpdated),
      }));

      const parsedValueBets = data.valueBets.map(vb => ({
        ...vb,
        event: {
          ...vb.event,
          commenceTime: new Date(vb.event.commenceTime),
        },
        lastUpdated: new Date(vb.lastUpdated),
      }));

      setOpportunities(parsed);
      setValueBets(parsedValueBets);
      setStats(data.stats);
      setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : new Date());
      setIsUsingMockData(data.isUsingMockData);
      setRemainingRequests(data.remainingApiRequests);
      setHasFetched(true);

      const uniqueBookmakers = new Set<string>();
      parsed.forEach(opp => {
        if (opp.mode === 'book-vs-book') {
          uniqueBookmakers.add(opp.outcome1.bookmaker);
          uniqueBookmakers.add(opp.outcome2.bookmaker);
        } else {
          uniqueBookmakers.add(opp.backOutcome.bookmaker);
        }
      });
      setBookmakers(Array.from(uniqueBookmakers).sort());
    } catch (err) {
      console.error('Failed to fetch arbs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
    } finally {
      setIsLoading(false);
    }
  }, [filters, sports.length, fetchSports]);

  const filteredOpportunities = opportunities.filter(opp => {
    // Profitable only filter - must be positive profit percentage
    if (filters.profitableOnly && opp.profitPercentage < 0) {
      return false;
    }
    if (filters.mode !== 'all' && opp.mode !== filters.mode) {
      return false;
    }
    if (!filters.showNearArbs && opp.type === 'near-arb') {
      return false;
    }
    if (filters.bookmakers.length > 0) {
      if (opp.mode === 'book-vs-book') {
        const hasBook1 = filters.bookmakers.includes(opp.outcome1.bookmaker);
        const hasBook2 = filters.bookmakers.includes(opp.outcome2.bookmaker);
        if (!hasBook1 && !hasBook2) return false;
      } else {
        if (!filters.bookmakers.includes(opp.backOutcome.bookmaker)) {
          return false;
        }
      }
    }
    return true;
  });

  const handleLogBet = (bet: PlacedBet) => {
    addBet(bet);
  };

  const arbCount = filteredOpportunities.filter(o => o.type === 'arb').length;
  const nearArbCount = filteredOpportunities.filter(o => o.type === 'near-arb').length;
  const profitableCount = filteredOpportunities.filter(o => o.profitPercentage >= 0).length;
  const activeAccountsCount = accounts.filter(a => a.isActive).length;

  return (
    <div className="min-h-screen bg-black">
      <Header
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        isUsingMockData={isUsingMockData}
        remainingRequests={remainingRequests}
        onRefresh={fetchArbs}
      />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Initial State */}
        {!hasFetched && !isLoading && activeTab === 'opportunities' && (
          <div className="border border-[#222] bg-[#0a0a0a] p-12 text-center">
            <div className="text-4xl mb-4">📡</div>
            <h2 className="text-xl font-medium mb-2">Ready to scan</h2>
            <p className="text-[#666] text-sm mb-4">
              Click <span className="text-white font-medium">Scan</span> to search ALL sports for opportunities
            </p>
            <p className="text-xs text-[#444]">
              Fetches odds from {config.regions.join(', ').toUpperCase()} regions across all available sports
            </p>
          </div>
        )}

        {/* Demo Mode Notice */}
        {isUsingMockData && hasFetched && (
          <div className="border border-[#333] bg-[#111] px-4 py-3 text-sm text-[#888]">
            Demo mode — add <code className="text-white">ODDS_API_KEY</code> to .env.local for live data
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border border-[#333] bg-[#111] px-4 py-3 text-sm text-[#888]">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {hasFetched && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-[#222]">
            <StatBox label="Events" value={stats.totalEvents} />
            <StatBox label="Sports" value={stats.sportsScanned} />
            <StatBox label="Bookmakers" value={stats.totalBookmakers} />
            <StatBox 
              label="Profitable" 
              value={profitableCount} 
              highlight={profitableCount > 0}
              subtitle="> 0%"
            />
            <StatBox 
              label="Near-Arbs" 
              value={nearArbCount}
              subtitle="< 0% loss"
            />
            <StatBox 
              label="Value Bets" 
              value={valueBets.length}
              subtitle="> 5% edge"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#222] overflow-x-auto">
          <TabButton 
            active={activeTab === 'opportunities'} 
            onClick={() => setActiveTab('opportunities')}
            count={filteredOpportunities.length}
          >
            Opportunities
          </TabButton>
          <TabButton 
            active={activeTab === 'value-bets'} 
            onClick={() => setActiveTab('value-bets')}
            count={valueBets.length}
          >
            Value Bets
          </TabButton>
          <TabButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
            count={bets.length}
          >
            Bet History
          </TabButton>
          <TabButton 
            active={activeTab === 'accounts'} 
            onClick={() => setActiveTab('accounts')}
            count={activeAccountsCount}
          >
            Accounts
          </TabButton>
        </div>

        {/* Filters */}
        {hasFetched && activeTab === 'opportunities' && (
          <ArbFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableSports={sports}
            availableBookmakers={bookmakers}
          />
        )}

        {/* Tab Content */}
        {hasFetched && activeTab === 'opportunities' && (
          <ArbTable
            opportunities={filteredOpportunities}
            onSelectArb={setSelectedArb}
          />
        )}

        {hasFetched && activeTab === 'value-bets' && (
          <ValueBetsTable valueBets={valueBets} onSelectValueBet={setSelectedValueBet} />
        )}

        {activeTab === 'history' && betsLoaded && (
          <BetTracker
            bets={bets}
            onUpdateBet={updateBet}
            onDeleteBet={deleteBet}
            onClearAll={clearAllBets}
          />
        )}

        {activeTab === 'accounts' && accountsLoaded && (
          <AccountsManager
            accounts={accounts}
            transactions={transactions}
            onToggleAccount={toggleAccount}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        )}
      </main>

      {/* Calculator Modal */}
      <StakeCalculatorModal
        arb={selectedArb}
        onClose={() => setSelectedArb(null)}
        onLogBet={handleLogBet}
      />

      {/* Value Bet Calculator Modal */}
      <ValueBetCalculatorModal
        valueBet={selectedValueBet}
        onClose={() => setSelectedValueBet(null)}
        onLogBet={handleLogBet}
      />
    </div>
  );
}

function StatBox({ 
  label, 
  value, 
  subtitle,
  highlight 
}: { 
  label: string; 
  value: number | string; 
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-black px-4 py-3">
      <div className="text-xs text-[#666] uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-mono ${highlight ? 'text-white' : 'text-[#888]'}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-[#555] mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}

function TabButton({ 
  children, 
  active, 
  onClick,
  count 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active 
          ? 'border-white text-white' 
          : 'border-transparent text-[#666] hover:text-[#888]'
      }`}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className={`ml-2 text-xs px-1.5 py-0.5 ${
          active ? 'bg-white text-black' : 'bg-[#333] text-[#888]'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function ValueBetsTable({ valueBets, onSelectValueBet }: { valueBets: ValueBet[]; onSelectValueBet: (vb: ValueBet) => void }) {
  if (valueBets.length === 0) {
    return (
      <div className="border border-[#222] bg-[#0a0a0a] p-12 text-center">
        <p className="text-[#888] mb-2">No value bets found</p>
        <p className="text-xs text-[#555]">
          Value bets appear when one bookmaker has odds significantly above the market average
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#222] bg-[#0a0a0a] overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#222]">
            <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Event
            </th>
            <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Time
            </th>
            <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Outcome
            </th>
            <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Best Odds
            </th>
            <th className="text-left px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Market Avg
            </th>
            <th className="text-right px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Edge
            </th>
            <th className="text-right px-4 py-3 text-xs text-[#666] uppercase tracking-wide font-medium">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {valueBets.map((vb, idx) => (
            <tr
              key={`${vb.event.id}-${vb.outcome.name}-${idx}`}
              className="border-b border-[#222] hover:bg-[#111] transition-colors"
            >
              <td className="px-4 py-3">
                <div className="font-medium">{vb.event.homeTeam}</div>
                <div className="text-[#666]">vs {vb.event.awayTeam}</div>
                <div className="text-xs text-[#555] mt-1">{vb.event.sportTitle}</div>
              </td>
              <td className="px-4 py-3 text-[#888]">
                {format(new Date(vb.event.commenceTime), 'MMM d, HH:mm')}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">{vb.outcome.name}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-mono text-white">{vb.outcome.odds.toFixed(2)}</div>
                <div className="text-xs text-[#666]">@ {vb.outcome.bookmaker}</div>
              </td>
              <td className="px-4 py-3 font-mono text-[#666]">
                {vb.marketAverage.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono font-medium text-white">
                  +{vb.valuePercentage.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onSelectValueBet(vb)}
                  className="px-3 py-1 text-xs border border-[#333] text-[#888] hover:bg-white hover:text-black hover:border-white transition-colors"
                >
                  Calculate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
