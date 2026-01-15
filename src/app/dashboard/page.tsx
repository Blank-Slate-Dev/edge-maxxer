// src/app/dashboard/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { Header, ArbFilters, ArbTable, StakeCalculatorModal, ValueBetCalculatorModal, BetTracker, AccountsManager, SpreadsTable, TotalsTable, LineCalculatorModal } from '@/components';
import { useBets } from '@/hooks/useBets';
import { useAccounts } from '@/hooks/useAccounts';
import type { ArbOpportunity, ValueBet, ArbFilters as FilterType, ScanStats, SpreadArb, TotalsArb, MiddleOpportunity, LineStats, BookVsBookArb } from '@/lib/types';
import type { PlacedBet } from '@/lib/bets';
import { config, getApiRegionsForUserRegions, countBookmakersForRegions, type UserRegion } from '@/lib/config';
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
  regions?: string;
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
  regions?: string;
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

// Region tab component
function RegionTab({ 
  region, 
  isSelected, 
  onClick 
}: { 
  region: UserRegion; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const info = config.regionInfo[region];
  const colorMap: Record<string, string> = {
    red: isSelected ? 'bg-red-600 border-red-600 text-white' : 'border-red-600/50 text-red-500 hover:bg-red-900/20',
    blue: isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-600/50 text-blue-500 hover:bg-blue-900/20',
    purple: isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-purple-600/50 text-purple-500 hover:bg-purple-900/20',
    green: isSelected ? 'bg-green-600 border-green-600 text-white' : 'border-green-600/50 text-green-500 hover:bg-green-900/20',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg transition-all ${colorMap[info.color]}`}
    >
      <span>{info.flag}</span>
      <span>{region}</span>
    </button>
  );
}

// Global toggle button
function GlobalToggle({ 
  isGlobal, 
  onClick 
}: { 
  isGlobal: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg transition-all ${
        isGlobal 
          ? 'bg-gradient-to-r from-red-600 via-purple-600 to-green-600 border-transparent text-white' 
          : 'border-zinc-600 text-zinc-400 hover:bg-zinc-800/50'
      }`}
    >
      <Globe className="w-4 h-4" />
      <span>Global</span>
    </button>
  );
}

// Helper function to extract bookmakers from an ArbOpportunity
function getBookmakersFromArb(opp: ArbOpportunity): string[] {
  if (opp.mode === 'book-vs-book') {
    const bookmakers = [opp.outcome1.bookmaker, opp.outcome2.bookmaker];
    if (opp.outcome3) {
      bookmakers.push(opp.outcome3.bookmaker);
    }
    return bookmakers;
  } else {
    // book-vs-betfair
    return [opp.backOutcome.bookmaker];
  }
}

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
  
  // Region selection state
  const [selectedRegions, setSelectedRegions] = useState<UserRegion[]>(['AU']);
  const [userDefaultRegion, setUserDefaultRegion] = useState<UserRegion>('AU');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { bets, isLoaded: betsLoaded, addBet, updateBet, deleteBet, clearAllBets } = useBets();
  const { 
    accounts, 
    transactions, 
    isLoaded: accountsLoaded,
    toggleAccount, 
    addTransaction, 
    deleteTransaction 
  } = useAccounts();

  // Load user's default region from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          const region = data.region || 'AU';
          setUserDefaultRegion(region);
          setSelectedRegions([region]);
        }
      } catch (err) {
        console.error('Failed to fetch user settings:', err);
      } finally {
        setSettingsLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  const isGlobalMode = selectedRegions.length === config.regionOrder.length;

  const toggleRegion = (region: UserRegion) => {
    setSelectedRegions(prev => {
      if (prev.includes(region)) {
        // Don't allow deselecting the last region
        if (prev.length === 1) return prev;
        return prev.filter(r => r !== region);
      } else {
        return [...prev, region];
      }
    });
  };

  const toggleGlobal = () => {
    if (isGlobalMode) {
      // Go back to just user's default region
      setSelectedRegions([userDefaultRegion]);
    } else {
      // Select all regions
      setSelectedRegions([...config.regionOrder]);
    }
  };

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

      // Get API regions string from selected user regions
      const apiRegions = getApiRegionsForUserRegions(selectedRegions);

      // Fetch H2H arbs
      const params = new URLSearchParams({
        minProfit: filters.minProfit.toString(),
        maxHours: filters.maxHoursUntilStart.toString(),
        refresh: 'true',
        nearArbs: filters.showNearArbs ? 'true' : 'false',
        valueBets: filters.showValueBets ? 'true' : 'false',
        regions: apiRegions,
      });
      
      if (filters.sports.length > 0) {
        params.set('sports', filters.sports.join(','));
      }

      setScanProgress(`Scanning ${selectedRegions.join(', ')} bookmakers for odds...`);

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
      setIsUsingMockData(arbsData.isUsingMockData || false);
      setRemainingRequests(arbsData.remainingApiRequests);
      setHasFetched(true);

      // Collect unique bookmakers from all opportunities
      const uniqueBookmakers = new Set<string>();
      parsed.forEach(opp => {
        getBookmakersFromArb(opp).forEach(bm => uniqueBookmakers.add(bm));
      });
      setBookmakers(Array.from(uniqueBookmakers));

    } catch (err) {
      console.error('Failed to fetch arbs:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan');
    } finally {
      setIsLoading(false);
      setScanProgress('');
    }
  }, [filters, sports, fetchSports, showMiddles, selectedRegions]);

  // Handle logging a bet
  const handleLogBet = (bet: Omit<PlacedBet, 'id' | 'createdAt'>) => {
    addBet(bet);
    setSelectedArb(null);
    setSelectedValueBet(null);
    setSelectedLineOpp(null);
  };

  // Filter opportunities based on current filters
  const filteredOpportunities = opportunities.filter(opp => {
    if (filters.profitableOnly && opp.profitPercentage < 0) return false;
    if (!filters.showNearArbs && opp.type === 'near-arb') return false;
    if (filters.sports.length > 0 && !filters.sports.includes(opp.event.sportKey)) return false;
    if (filters.bookmakers.length > 0) {
      const oppBookmakers = getBookmakersFromArb(opp);
      if (!filters.bookmakers.some(b => oppBookmakers.includes(b))) return false;
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

  const profitableCount = filteredOpportunities.filter(o => o.profitPercentage >= 0).length;
  const activeAccountsCount = accounts.filter(a => a.isActive).length;
  const spreadMiddles = middles.filter(m => m.marketType === 'spreads');
  const totalsMiddles = middles.filter(m => m.marketType === 'totals');

  // Calculate bookmaker count for selected regions
  const selectedBookmakerCount = countBookmakersForRegions(selectedRegions);

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
              <div 
                className="absolute inset-0 rounded-full border-2 animate-ping"
                style={{ 
                  borderColor: '#22c55e',
                  opacity: 0.2,
                  animationDuration: '2s'
                }}
              />
              <div 
                className="absolute inset-2 rounded-full border-2 animate-ping"
                style={{ 
                  borderColor: '#22c55e',
                  opacity: 0.4,
                  animationDuration: '2s',
                  animationDelay: '0.3s'
                }}
              />
              <div 
                className="absolute inset-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ 
                  borderColor: '#22c55e',
                  borderTopColor: 'transparent',
                  animationDuration: '1s'
                }}
              />
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
              <Globe className="w-3 h-3" />
              Scanning {selectedRegions.join(', ')} ({selectedBookmakerCount} bookmakers)
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Region Tabs */}
        {settingsLoaded && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm mr-2" style={{ color: 'var(--muted)' }}>Regions:</span>
            {config.regionOrder.map(region => (
              <RegionTab
                key={region}
                region={region}
                isSelected={selectedRegions.includes(region)}
                onClick={() => toggleRegion(region)}
              />
            ))}
            <div className="w-px h-6 mx-2" style={{ backgroundColor: 'var(--border)' }} />
            <GlobalToggle isGlobal={isGlobalMode} onClick={toggleGlobal} />
            <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>
              {selectedBookmakerCount} bookmakers
            </span>
          </div>
        )}

        {/* Multi-Region Warning */}
        {selectedRegions.length > 1 && (
          <div 
            className="border px-4 py-3 text-sm rounded-lg"
            style={{
              borderColor: 'var(--info)',
              backgroundColor: 'color-mix(in srgb, var(--info) 10%, transparent)'
            }}
          >
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />
              <div>
                <div className="font-medium" style={{ color: 'var(--info)' }}>
                  Multi-Region Scan: {selectedRegions.join(', ')}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Scanning {selectedBookmakerCount} bookmakers. 
                  {selectedRegions.some(r => r !== userDefaultRegion) && (
                    <> Note: Bookmakers outside your region ({userDefaultRegion}) may require local ID/address to register.</>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!hasFetched && !isLoading && activeTab === 'opportunities' && (
          <div 
            className="border p-12 text-center rounded-lg"
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
              Scanning {selectedRegions.join(', ')} regions ({selectedBookmakerCount} bookmakers)
            </p>
          </div>
        )}

        {/* Demo Mode Notice */}
        {isUsingMockData && hasFetched && (
          <div 
            className="border px-4 py-3 text-sm rounded-lg"
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
            className="border px-4 py-3 text-sm rounded-lg"
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
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-px rounded-lg overflow-hidden"
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
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border transition-colors rounded-lg"
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
            globalMode={selectedRegions.length > 1}
          />
        )}

        {hasFetched && activeTab === 'spreads' && (
          <SpreadsTable
            spreads={filteredSpreads}
            middles={spreadMiddles}
            onSelectSpread={(s) => setSelectedLineOpp(s)}
            onSelectMiddle={(m) => setSelectedLineOpp(m)}
            showMiddles={showMiddles}
            globalMode={selectedRegions.length > 1}
          />
        )}

        {hasFetched && activeTab === 'totals' && (
          <TotalsTable
            totals={filteredTotals}
            middles={totalsMiddles}
            onSelectTotals={(t) => setSelectedLineOpp(t)}
            onSelectMiddle={(m) => setSelectedLineOpp(m)}
            showMiddles={showMiddles}
            globalMode={selectedRegions.length > 1}
          />
        )}

        {hasFetched && activeTab === 'value-bets' && (
          <ValueBetsTable valueBets={valueBets} onSelectValueBet={setSelectedValueBet} globalMode={selectedRegions.length > 1} />
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
          className="ml-2 text-xs px-1.5 py-0.5 rounded"
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
        className="border p-12 text-center rounded-lg"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)'
        }}
      >
        <p style={{ color: 'var(--muted)' }} className="mb-2">No value bets found</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Value bets have {'>'}5% expected edge based on implied probability
        </p>
      </div>
    );
  }

  return (
    <div 
      className="border overflow-x-auto rounded-lg"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--surface)'
      }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Event</th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Bookmaker</th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Selection</th>
            <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Odds</th>
            <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Edge</th>
            <th className="text-right px-4 py-3 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {valueBets.map((vb, idx) => (
            <tr 
              key={`${vb.event.id}-${idx}`}
              className="hover:bg-[var(--background)] transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <td className="px-4 py-3">
                <div className="font-medium" style={{ color: 'var(--foreground)' }}>{vb.event.homeTeam}</div>
                <div style={{ color: 'var(--muted)' }}>vs {vb.event.awayTeam}</div>
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{vb.outcome.bookmaker}</td>
              <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{vb.outcome.name}</td>
              <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--foreground)' }}>{vb.outcome.odds.toFixed(2)}</td>
              <td className="px-4 py-3 text-right font-mono" style={{ color: '#22c55e' }}>+{vb.valuePercentage.toFixed(1)}%</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onSelectValueBet(vb)}
                  className="px-3 py-1 text-xs font-medium rounded transition-colors"
                  style={{
                    backgroundColor: 'var(--foreground)',
                    color: 'var(--background)'
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
