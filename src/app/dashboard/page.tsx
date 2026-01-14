// src/app/dashboard/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { Globe, MapPin, Loader2 } from 'lucide-react';
import { Header, ArbFilters, ArbTable, StakeCalculatorModal, ValueBetCalculatorModal, BetTracker, AccountsManager, SpreadsTable, TotalsTable, LineCalculatorModal } from '@/components';
import { useBets } from '@/hooks/useBets';
import { useAccounts } from '@/hooks/useAccounts';
import type { ArbOpportunity, ValueBet, ArbFilters as FilterType, ScanStats, SpreadArb, TotalsArb, MiddleOpportunity, LineStats } from '@/lib/types';
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
  globalMode?: boolean;
  remainingApiRequests?: number;
  error?: string;
  details?: string;
}

interface LinesResponse {
  spreadArbs: SpreadArb[];
  totalsArbs: TotalsArb[];
  middles: MiddleOpportunity[];
  stats: LineStats;
  lastUpdated: string;
  isUsingMockData: boolean;
  globalMode?: boolean;
  remainingApiRequests?: number;
  error?: string;
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

type Tab = 'opportunities' | 'spreads' | 'totals' | 'value-bets' | 'history' | 'accounts';

export default function DashboardPage() {
  const [opportunities, setOpportunities] = useState<ArbOpportunity[]>([]);
  const [valueBets, setValueBets] = useState<ValueBet[]>([]);
  const [spreadArbs, setSpreadArbs] = useState<SpreadArb[]>([]);
  const [totalsArbs, setTotalsArbs] = useState<TotalsArb[]>([]);
  const [middles, setMiddles] = useState<MiddleOpportunity[]>([]);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [lineStats, setLineStats] = useState<LineStats | null>(null);
  const [filters, setFilters] = useState<FilterType>(DEFAULT_FILTERS);
  const [sports, setSports] = useState<Sport[]>([]);
  const [bookmakers, setBookmakers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number | undefined>();
  const [selectedArb, setSelectedArb] = useState<ArbOpportunity | null>(null);
  const [selectedValueBet, setSelectedValueBet] = useState<ValueBet | null>(null);
  const [selectedLineOpp, setSelectedLineOpp] = useState<SpreadArb | TotalsArb | MiddleOpportunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('opportunities');
  const [showMiddles, setShowMiddles] = useState(true);
  const [globalMode, setGlobalMode] = useState(false);

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
    setScanProgress('Initializing scan...');

    try {
      if (sports.length === 0) {
        setScanProgress('Fetching available sports...');
        await fetchSports();
      }

      // Fetch H2H arbs
      const params = new URLSearchParams({
        minProfit: filters.minProfit.toString(),
        maxHours: filters.maxHoursUntilStart.toString(),
        refresh: 'true',
        nearArbs: filters.showNearArbs ? 'true' : 'false',
        valueBets: filters.showValueBets ? 'true' : 'false',
        global: globalMode ? 'true' : 'false',
      });
      
      if (filters.sports.length > 0) {
        params.set('sports', filters.sports.join(','));
      }

      setScanProgress('Scanning bookmakers for odds...');

      const [arbsRes, linesRes] = await Promise.all([
        fetch(`/api/arbs?${params}`),
        fetch(`/api/lines?${params}&middles=${showMiddles}`),
      ]);

      setScanProgress('Analyzing opportunities...');

      const arbsData: ArbsResponse = await arbsRes.json();
      const linesData: LinesResponse = await linesRes.json();

      if (!arbsRes.ok) {
        throw new Error(arbsData.error || 'Failed to fetch arbs');
      }

      setScanProgress('Processing results...');

      // Parse H2H opportunities
      const parsed = arbsData.opportunities.map(opp => ({
        ...opp,
        event: {
          ...opp.event,
          commenceTime: new Date(opp.event.commenceTime),
        },
        lastUpdated: new Date(opp.lastUpdated),
      }));

      const parsedValueBets = arbsData.valueBets.map(vb => ({
        ...vb,
        event: {
          ...vb.event,
          commenceTime: new Date(vb.event.commenceTime),
        },
        lastUpdated: new Date(vb.lastUpdated),
      }));

      // Parse line opportunities
      const parsedSpreads = (linesData.spreadArbs || []).map(s => ({
        ...s,
        event: {
          ...s.event,
          commenceTime: new Date(s.event.commenceTime),
        },
        lastUpdated: new Date(s.lastUpdated),
      }));

      const parsedTotals = (linesData.totalsArbs || []).map(t => ({
        ...t,
        event: {
          ...t.event,
          commenceTime: new Date(t.event.commenceTime),
        },
        lastUpdated: new Date(t.lastUpdated),
      }));

      const parsedMiddles = (linesData.middles || []).map(m => ({
        ...m,
        event: {
          ...m.event,
          commenceTime: new Date(m.event.commenceTime),
        },
        lastUpdated: new Date(m.lastUpdated),
      }));

      setOpportunities(parsed);
      setValueBets(parsedValueBets);
      setSpreadArbs(parsedSpreads);
      setTotalsArbs(parsedTotals);
      setMiddles(parsedMiddles);
      setStats(arbsData.stats);
      setLineStats(linesData.stats);
      setLastUpdated(arbsData.lastUpdated ? new Date(arbsData.lastUpdated) : new Date());
      setIsUsingMockData(arbsData.isUsingMockData);
      setRemainingRequests(arbsData.remainingApiRequests);
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
      setScanProgress('');
    }
  }, [filters, sports.length, fetchSports, showMiddles, globalMode]);

  const filteredOpportunities = opportunities.filter(opp => {
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

  const filteredSpreads = spreadArbs.filter(s => {
    if (filters.profitableOnly && s.profitPercentage < 0) return false;
    if (!filters.showNearArbs && s.type === 'near-arb') return false;
    return true;
  });

  const filteredTotals = totalsArbs.filter(t => {
    if (filters.profitableOnly && t.profitPercentage < 0) return false;
    if (!filters.showNearArbs && t.type === 'near-arb') return false;
    return true;
  });

  const handleLogBet = (bet: PlacedBet) => {
    addBet(bet);
  };

  const arbCount = filteredOpportunities.filter(o => o.type === 'arb').length;
  const nearArbCount = filteredOpportunities.filter(o => o.type === 'near-arb').length;
  const profitableCount = filteredOpportunities.filter(o => o.profitPercentage >= 0).length;
  const activeAccountsCount = accounts.filter(a => a.isActive).length;
  const spreadMiddles = middles.filter(m => m.marketType === 'spreads');
  const totalsMiddles = middles.filter(m => m.marketType === 'totals');

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <Header
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        isUsingMockData={isUsingMockData}
        remainingRequests={remainingRequests}
        onRefresh={fetchArbs}
      />

      {/* Scanning Overlay */}
      {isLoading && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div 
            className="flex flex-col items-center gap-6 p-8 rounded-xl border"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
          >
            {/* Animated Scanner */}
            <div className="relative w-20 h-20">
              {/* Outer ring */}
              <div 
                className="absolute inset-0 rounded-full border-2 animate-ping"
                style={{ 
                  borderColor: '#22c55e',
                  opacity: 0.2,
                  animationDuration: '2s'
                }}
              />
              {/* Middle ring */}
              <div 
                className="absolute inset-2 rounded-full border-2 animate-ping"
                style={{ 
                  borderColor: '#22c55e',
                  opacity: 0.4,
                  animationDuration: '2s',
                  animationDelay: '0.3s'
                }}
              />
              {/* Inner spinning circle */}
              <div 
                className="absolute inset-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ 
                  borderColor: '#22c55e',
                  borderTopColor: 'transparent',
                  animationDuration: '1s'
                }}
              />
              {/* Center dot */}
              <div 
                className="absolute inset-[38%] rounded-full animate-pulse"
                style={{ backgroundColor: '#22c55e' }}
              />
            </div>

            {/* Text */}
            <div className="text-center">
              <h3 
                className="text-lg font-medium mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Scanning Markets
              </h3>
              <p 
                className="text-sm flex items-center gap-2"
                style={{ color: 'var(--muted)' }}
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                {scanProgress || 'Please wait...'}
              </p>
            </div>

            {/* Region indicator */}
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{ 
                backgroundColor: 'var(--background)',
                color: 'var(--muted)'
              }}
            >
              {globalMode ? (
                <>
                  <Globe className="w-3 h-3" />
                  Scanning AU, UK, US, EU
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3" />
                  Scanning AU region
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Global Mode Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setGlobalMode(!globalMode)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border transition-colors"
            style={{
              backgroundColor: globalMode ? 'var(--info)' : 'transparent',
              borderColor: globalMode ? 'var(--info)' : 'var(--border)',
              color: globalMode ? 'white' : 'var(--muted)'
            }}
          >
            {globalMode ? (
              <>
                <Globe className="w-4 h-4" />
                Global Mode
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                AU Only
              </>
            )}
          </button>
          {globalMode && (
            <div className="text-xs" style={{ color: 'var(--info)' }}>
              ⚠️ Most global bookmakers require local residency
            </div>
          )}
        </div>

        {/* Global Mode Banner */}
        {globalMode && (
          <div 
            className="border px-4 py-3 text-sm"
            style={{
              borderColor: 'var(--info)',
              backgroundColor: 'color-mix(in srgb, var(--info) 10%, transparent)'
            }}
          >
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />
              <div>
                <div className="font-medium" style={{ color: 'var(--info)' }}>Global Scan Active</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Scanning {config.allBookmakers.length} bookmakers across AU, UK, US, EU. 
                  Most non-AU bookmakers require local ID/address to register. 
                  Use this to see what&apos;s available globally.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!hasFetched && !isLoading && activeTab === 'opportunities' && (
          <div 
            className="border p-12 text-center"
            style={{
              borderColor: 'var(--border-light)',
              backgroundColor: 'var(--surface-secondary)'
            }}
          >
            <div className="text-4xl mb-4">📡</div>
            <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--foreground)' }}>Ready to scan</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              Click <span className="font-medium" style={{ color: 'var(--foreground)' }}>Scan</span> to search ALL markets for opportunities
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {globalMode 
                ? `Scanning ${config.allRegions.join(', ').toUpperCase()} regions (${config.allBookmakers.length} bookmakers)`
                : `Scanning ${config.regions.join(', ').toUpperCase()} regions (AU bookmakers only)`
              }
            </p>
          </div>
        )}

        {/* Demo Mode Notice */}
        {isUsingMockData && hasFetched && (
          <div 
            className="border px-4 py-3 text-sm"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--muted)'
            }}
          >
            Demo mode — add <code style={{ color: 'var(--foreground)' }}>ODDS_API_KEY</code> to .env.local for live data
          </div>
        )}

        {/* Error */}
        {error && (
          <div 
            className="border px-4 py-3 text-sm"
            style={{
              borderColor: 'var(--danger)',
              backgroundColor: 'var(--danger-muted)',
              color: 'var(--danger)'
            }}
          >
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {hasFetched && stats && (
          <div 
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-px"
            style={{ backgroundColor: 'var(--border-light)' }}
          >
            <StatBox label="Events" value={stats.totalEvents} />
            <StatBox label="Sports" value={stats.sportsScanned} />
            <StatBox label="Bookmakers" value={stats.totalBookmakers} />
            <StatBox 
              label="H2H Arbs" 
              value={profitableCount} 
              highlight={profitableCount > 0}
            />
            <StatBox 
              label="Spread Arbs" 
              value={filteredSpreads.filter(s => s.type === 'arb').length}
              highlight={filteredSpreads.filter(s => s.type === 'arb').length > 0}
            />
            <StatBox 
              label="Totals Arbs" 
              value={filteredTotals.filter(t => t.type === 'arb').length}
              highlight={filteredTotals.filter(t => t.type === 'arb').length > 0}
            />
            <StatBox 
              label="Middles" 
              value={middles.length}
              subtitle="EV plays"
            />
            <StatBox 
              label="Value Bets" 
              value={valueBets.length}
              subtitle="> 5% edge"
            />
          </div>
        )}

        {/* Tabs */}
        <div 
          className="flex gap-1 border-b overflow-x-auto"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <TabButton 
            active={activeTab === 'opportunities'} 
            onClick={() => setActiveTab('opportunities')}
            count={filteredOpportunities.length}
          >
            H2H
          </TabButton>
          <TabButton 
            active={activeTab === 'spreads'} 
            onClick={() => setActiveTab('spreads')}
            count={filteredSpreads.length + spreadMiddles.length}
          >
            Spreads
          </TabButton>
          <TabButton 
            active={activeTab === 'totals'} 
            onClick={() => setActiveTab('totals')}
            count={filteredTotals.length + totalsMiddles.length}
          >
            Totals
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
            History
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
        {hasFetched && (activeTab === 'opportunities' || activeTab === 'spreads' || activeTab === 'totals') && (
          <div className="flex items-center gap-4">
            <ArbFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableSports={sports}
              availableBookmakers={bookmakers}
            />
            {(activeTab === 'spreads' || activeTab === 'totals') && (
              <button
                onClick={() => setShowMiddles(!showMiddles)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border transition-colors"
                style={{
                  backgroundColor: showMiddles ? 'var(--warning)' : 'transparent',
                  borderColor: showMiddles ? 'var(--warning)' : 'var(--border)',
                  color: showMiddles ? 'black' : 'var(--muted)'
                }}
              >
                🎯 Show Middles
              </button>
            )}
          </div>
        )}

        {/* Tab Content */}
        {hasFetched && activeTab === 'opportunities' && (
          <ArbTable
            opportunities={filteredOpportunities}
            onSelectArb={setSelectedArb}
            globalMode={globalMode}
          />
        )}

        {hasFetched && activeTab === 'spreads' && (
          <SpreadsTable
            spreads={filteredSpreads}
            middles={spreadMiddles}
            onSelectSpread={(s) => setSelectedLineOpp(s)}
            onSelectMiddle={(m) => setSelectedLineOpp(m)}
            showMiddles={showMiddles}
            globalMode={globalMode}
          />
        )}

        {hasFetched && activeTab === 'totals' && (
          <TotalsTable
            totals={filteredTotals}
            middles={totalsMiddles}
            onSelectTotals={(t) => setSelectedLineOpp(t)}
            onSelectMiddle={(m) => setSelectedLineOpp(m)}
            showMiddles={showMiddles}
            globalMode={globalMode}
          />
        )}

        {hasFetched && activeTab === 'value-bets' && (
          <ValueBetsTable valueBets={valueBets} onSelectValueBet={setSelectedValueBet} globalMode={globalMode} />
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

      {/* Calculator Modals */}
      <StakeCalculatorModal
        arb={selectedArb}
        onClose={() => setSelectedArb(null)}
        onLogBet={handleLogBet}
      />

      <ValueBetCalculatorModal
        valueBet={selectedValueBet}
        onClose={() => setSelectedValueBet(null)}
        onLogBet={handleLogBet}
      />

      <LineCalculatorModal
        opportunity={selectedLineOpp}
        onClose={() => setSelectedLineOpp(null)}
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
    <div className="px-4 py-3" style={{ backgroundColor: 'var(--background)' }}>
      <div 
        className="text-xs uppercase tracking-wide mb-1"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </div>
      <div 
        className="text-2xl font-mono"
        style={{ color: highlight ? 'var(--foreground)' : 'var(--muted)' }}
      >
        {value}
      </div>
      {subtitle && (
        <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {subtitle}
        </div>
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
      className="px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
      style={{
        borderColor: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--foreground)' : 'var(--muted)'
      }}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span 
          className="ml-2 text-xs px-1.5 py-0.5"
          style={{
            backgroundColor: active ? 'var(--accent)' : 'var(--surface)',
            color: active ? 'var(--accent-foreground)' : 'var(--muted)'
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ValueBetsTable({ valueBets, onSelectValueBet, globalMode }: { valueBets: ValueBet[]; onSelectValueBet: (vb: ValueBet) => void; globalMode?: boolean }) {
  if (valueBets.length === 0) {
    return (
      <div 
        className="border p-12 text-center"
        style={{
          borderColor: 'var(--border-light)',
          backgroundColor: 'var(--surface-secondary)'
        }}
      >
        <p className="mb-2" style={{ color: 'var(--muted)' }}>No value bets found</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Value bets appear when one bookmaker has odds significantly above the market average
        </p>
      </div>
    );
  }

  return (
    <div 
      className="border overflow-x-auto"
      style={{
        borderColor: 'var(--border-light)',
        backgroundColor: 'var(--surface-secondary)'
      }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
              Event
            </th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
              Time
            </th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
              Outcome
            </th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
              Best Odds
            </th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
              Market Avg
            </th>
            <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
              Edge
            </th>
            <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {valueBets.map((vb, idx) => (
            <tr
              key={`${vb.event.id}-${vb.outcome.name}-${idx}`}
              className="transition-colors"
              style={{ borderBottom: '1px solid var(--border-light)' }}
            >
              <td className="px-4 py-3">
                <div className="font-medium" style={{ color: 'var(--foreground)' }}>{vb.event.homeTeam}</div>
                <div style={{ color: 'var(--muted)' }}>vs {vb.event.awayTeam}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{vb.event.sportTitle}</div>
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                {format(new Date(vb.event.commenceTime), 'MMM d, HH:mm')}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium" style={{ color: 'var(--foreground)' }}>{vb.outcome.name}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-mono" style={{ color: 'var(--foreground)' }}>{vb.outcome.odds.toFixed(2)}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>@ {vb.outcome.bookmaker}</div>
              </td>
              <td className="px-4 py-3 font-mono" style={{ color: 'var(--muted)' }}>
                {vb.marketAverage.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono font-medium" style={{ color: 'var(--foreground)' }}>
                  +{vb.valuePercentage.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onSelectValueBet(vb)}
                  className="px-3 py-1 text-xs border transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--muted)'
                  }}
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
