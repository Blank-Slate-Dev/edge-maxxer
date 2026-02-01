// src/app/dashboard/page.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, X, CheckCircle, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Header, ArbFilters, ArbTable, StakeCalculatorModal, ValueBetCalculatorModal, BetTracker, AccountsManager, SpreadsTable, TotalsTable, LineCalculatorModal, Flag, SubscriptionRequiredModal } from '@/components';
import { useBets } from '@/hooks/useBets';
import { useAccounts } from '@/hooks/useAccounts';
import type { ArbOpportunity, ValueBet, ArbFilters as FilterType, ScanStats, SpreadArb, TotalsArb, MiddleOpportunity, LineStats } from '@/lib/types';
import type { PlacedBet } from '@/lib/bets';
import { config, countBookmakersForRegions, type UserRegion } from '@/lib/config';

interface Sport {
  key: string;
  title: string;
  group?: string;
}

interface GlobalArbsResponse {
  hasCachedResults: boolean;
  opportunities?: ArbOpportunity[];
  valueBets?: ValueBet[];
  stats?: ScanStats;
  regions?: string[];
  scannedAt?: string;
  ageSeconds?: number;
  ageMinutes?: number;
  remainingCredits?: number;
  scanDurationMs?: number;
  message?: string;
  error?: string;
  subscriptionRequired?: boolean;
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

// Polling interval in seconds (how often we check for new data)
const POLL_INTERVAL_SECONDS = 5;

// Scan intervals by region
const SCAN_INTERVAL_AU = 44; // AU scans every cron run
const SCAN_INTERVAL_OTHER = 180; // UK/US/EU rotate every ~3 minutes

// Region tab component - now acts as radio button
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
      className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium border rounded-lg transition-all ${colorMap[info.color]}`}
    >
      <Flag code={info.flagCode} size="sm" />
      <span className="hidden xs:inline">{region}</span>
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
    return [opp.backOutcome.bookmaker];
  }
}

export default function DashboardPage() {
  const { data: session, update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  
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
  
  // Separate loading states for initial load vs background refresh
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [isLoadingLines, setIsLoadingLines] = useState(false);
  const [linesProgress, setLinesProgress] = useState<string>('');
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | undefined>();
  const [selectedArb, setSelectedArb] = useState<ArbOpportunity | null>(null);
  const [selectedValueBet, setSelectedValueBet] = useState<ValueBet | null>(null);
  const [selectedLineOpp, setSelectedLineOpp] = useState<SpreadArb | TotalsArb | MiddleOpportunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [hasFetchedArbs, setHasFetchedArbs] = useState(false);
  const [hasFetchedLines, setHasFetchedLines] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('opportunities');
  const [showMiddles, setShowMiddles] = useState(true);
  
  // Single region selection (not array)
  const [selectedRegion, setSelectedRegion] = useState<UserRegion>('AU');
  const [userDefaultRegion, setUserDefaultRegion] = useState<UserRegion>('AU');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  // Subscription modal state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Checkout success state
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);

  // Global scan state
  const [scanAgeSeconds, setScanAgeSeconds] = useState<number | null>(null);
  const [showNewResultsFlash, setShowNewResultsFlash] = useState(false);
  
  // Ref to track last scanned timestamp without causing re-renders
  const lastScannedAtRef = useRef<string | null>(null);

  // AbortController for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const { bets, isLoaded: betsLoaded, addBet, updateBet, deleteBet, clearAllBets } = useBets();
  const { 
    accounts, 
    transactions, 
    isLoaded: accountsLoaded,
    toggleAccount, 
    addTransaction, 
    deleteTransaction 
  } = useAccounts();

  // Get hasAccess from session (computed server-side in auth.ts)
  const hasAccess = (session?.user as { hasAccess?: boolean } | undefined)?.hasAccess ?? false;

  // Calculate scan interval based on selected region
  const getScanInterval = useCallback(() => {
    return selectedRegion === 'AU' ? SCAN_INTERVAL_AU : SCAN_INTERVAL_OTHER;
  }, [selectedRegion]);

  // Handle checkout success - refresh session to get updated subscription status
  useEffect(() => {
    const checkoutParam = searchParams.get('checkout');
    const planParam = searchParams.get('plan');
    
    if (checkoutParam === 'success' && planParam) {
      setIsRefreshingSession(true);
      setCheckoutSuccess(planParam);
      
      const refreshSession = async () => {
        try {
          await updateSession();
          await new Promise(resolve => setTimeout(resolve, 500));
          router.replace('/dashboard', { scroll: false });
        } catch (err) {
          console.error('Failed to refresh session:', err);
        } finally {
          setIsRefreshingSession(false);
          setTimeout(() => {
            setCheckoutSuccess(null);
          }, 5000);
        }
      };
      
      refreshSession();
    }
  }, [searchParams, updateSession, router]);

  // Load user's default region from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          const region = data.region || 'AU';
          setUserDefaultRegion(region);
          setSelectedRegion(region);
        }
      } catch (err) {
        console.error('Failed to fetch user settings:', err);
      } finally {
        setSettingsLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  // Fetch global arbs - main data fetching function
  const fetchGlobalArbs = useCallback(async (mode: 'initial' | 'background' | 'manual' = 'background') => {
    // Set appropriate loading state
    if (mode === 'initial') {
      setIsInitialLoading(true);
    } else if (mode === 'manual') {
      setIsManualRefreshing(true);
    } else {
      setIsBackgroundRefreshing(true);
    }

    try {
      const res = await fetch('/api/global-arbs');
      const data: GlobalArbsResponse = await res.json();

      // Check for subscription required
      if (data.subscriptionRequired) {
        setShowSubscriptionModal(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch opportunities');
      }

      if (data.hasCachedResults && data.opportunities) {
        // Check if this is new data using ref (doesn't cause re-render)
        const isNewData = data.scannedAt !== lastScannedAtRef.current;

        // Parse dates in opportunities
        const parsed = data.opportunities.map(opp => ({
          ...opp,
          event: {
            ...opp.event,
            commenceTime: new Date(opp.event.commenceTime),
          },
          lastUpdated: new Date(opp.lastUpdated),
        }));

        const parsedValueBets = (data.valueBets || []).map(vb => ({
          ...vb,
          event: {
            ...vb.event,
            commenceTime: new Date(vb.event.commenceTime),
          },
          lastUpdated: new Date(vb.lastUpdated),
        }));

        // Update state - this should be seamless, no flashing
        setOpportunities(parsed);
        setValueBets(parsedValueBets);
        if (data.stats) setStats(data.stats);
        if (data.scannedAt) {
          setLastUpdated(new Date(data.scannedAt));
          lastScannedAtRef.current = data.scannedAt;
        }
        if (data.ageSeconds !== undefined) setScanAgeSeconds(data.ageSeconds);
        if (data.remainingCredits !== undefined) setRemainingCredits(data.remainingCredits);
        setHasFetchedArbs(true);
        setError(null);

        // Extract bookmakers
        const uniqueBookmakers = new Set<string>();
        parsed.forEach(opp => {
          getBookmakersFromArb(opp).forEach(bm => uniqueBookmakers.add(bm));
        });
        setBookmakers(Array.from(uniqueBookmakers));

        // Show flash animation if new data arrived during polling
        if (isNewData && lastScannedAtRef.current !== null && mode !== 'initial') {
          setShowNewResultsFlash(true);
          setTimeout(() => setShowNewResultsFlash(false), 2000);
        }

        console.log(`[Dashboard] Loaded ${parsed.length} opportunities (${data.ageSeconds}s old)`);
      }
    } catch (err) {
      console.error('Failed to fetch global arbs:', err);
      // Only show error if this was initial load or manual refresh
      if (mode !== 'background') {
        setError(err instanceof Error ? err.message : 'Failed to load opportunities');
      }
    } finally {
      setIsInitialLoading(false);
      setIsBackgroundRefreshing(false);
      setIsManualRefreshing(false);
    }
  }, []); // No dependencies - stable callback

  // Initial fetch and polling
  useEffect(() => {
    // Initial fetch
    fetchGlobalArbs('initial');

    // Poll for updates every 5 seconds
    const pollInterval = setInterval(() => {
      fetchGlobalArbs('background');
    }, POLL_INTERVAL_SECONDS * 1000);

    return () => clearInterval(pollInterval);
  }, [fetchGlobalArbs]);

  // Increment age counter every second
  useEffect(() => {
    if (scanAgeSeconds === null) return;

    const ageInterval = setInterval(() => {
      setScanAgeSeconds(prev => (prev !== null ? prev + 1 : null));
    }, 1000);

    return () => clearInterval(ageInterval);
  }, [scanAgeSeconds !== null]);

  // Single region selection - clicking a region selects it (radio button style)
  const selectRegion = (region: UserRegion) => {
    setSelectedRegion(region);
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

  // Manual refresh
  const handleRefresh = useCallback(() => {
    fetchGlobalArbs('manual');
  }, [fetchGlobalArbs]);

  const handleLogBet = (bet: Omit<PlacedBet, 'id' | 'createdAt'>) => {
    addBet(bet);
    setSelectedArb(null);
    setSelectedValueBet(null);
    setSelectedLineOpp(null);
  };

  // Filter opportunities - ALL bookmakers must be from selected region
  const filteredOpportunities = opportunities.filter(opp => {
    // Filter by profit
    if (filters.profitableOnly && opp.profitPercentage < 0) return false;
    if (!filters.showNearArbs && opp.type === 'near-arb') return false;
    
    // Filter by sport
    if (filters.sports.length > 0 && !filters.sports.includes(opp.event.sportKey)) return false;
    
    // Filter by bookmaker
    if (filters.bookmakers.length > 0) {
      const oppBookmakers = getBookmakersFromArb(opp);
      if (!filters.bookmakers.some(b => oppBookmakers.includes(b))) return false;
    }
    
    // Build set of bookmakers for selected region (both API keys and display names)
    const regionBookmakers = new Set<string>();
    config.bookmakersByRegion[selectedRegion].forEach(b => {
      regionBookmakers.add(b.toLowerCase());
      const displayName = config.bookmakerNames[b];
      if (displayName) {
        regionBookmakers.add(displayName.toLowerCase());
      }
    });
    
    // ALL bookmakers in the arb must be from the selected region
    const oppBookmakers = getBookmakersFromArb(opp);
    const allFromSelectedRegion = oppBookmakers.every(bk => 
      regionBookmakers.has(bk.toLowerCase())
    );
    
    if (!allFromSelectedRegion) return false;
    
    return true;
  });

  // Filter value bets - bookmaker must be from selected region
  const filteredValueBets = valueBets.filter(vb => {
    const regionBookmakers = new Set<string>();
    config.bookmakersByRegion[selectedRegion].forEach(b => {
      regionBookmakers.add(b.toLowerCase());
      const displayName = config.bookmakerNames[b];
      if (displayName) {
        regionBookmakers.add(displayName.toLowerCase());
      }
    });
    
    return regionBookmakers.has(vb.outcome.bookmaker.toLowerCase());
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

  const selectedBookmakerCount = countBookmakersForRegions([selectedRegion]);

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'trial': return '3-Day Trial';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return plan;
    }
  };

  const formatScanAge = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  // Get progress bar color based on scan age relative to expected interval
  const getProgressBarColor = (seconds: number, interval: number) => {
    const progress = seconds / interval;
    if (progress < 0.25) return '#22c55e'; // Green - very fresh
    if (progress < 0.5) return '#84cc16'; // Lime - fresh
    if (progress < 0.75) return '#eab308'; // Yellow - getting stale
    return '#f97316'; // Orange - stale, new scan expected soon
  };

  // Combined loading state for header
  const isLoading = isInitialLoading || isManualRefreshing;
  
  // Get current scan interval based on selected region
  const currentScanInterval = getScanInterval();

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <Header
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        isUsingMockData={false}
        remainingRequests={remainingCredits}
        onRefresh={handleRefresh}
        onQuickScan={handleRefresh}
      />

      {/* Session Refresh Overlay (after checkout) */}
      {isRefreshingSession && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <div 
            className="flex flex-col items-center gap-4 p-8 rounded-xl border"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
          >
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--success)' }} />
            <div className="text-center">
              <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Activating Subscription...
              </h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Please wait while we set up your account
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Checkout Success Banner */}
        {checkoutSuccess && !isRefreshingSession && (
          <div 
            className="border px-4 py-3 rounded-lg animate-fade-in"
            style={{
              borderColor: 'var(--success)',
              backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)'
            }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--success)' }} />
              <div className="flex-1">
                <div className="font-medium" style={{ color: 'var(--success)' }}>
                  🎉 {getPlanDisplayName(checkoutSuccess)} Activated!
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  Your subscription is now active. Live arbitrage data is loading automatically!
                </div>
              </div>
              <button
                onClick={() => setCheckoutSuccess(null)}
                className="p-1 rounded hover:bg-[var(--background)] transition-colors"
                style={{ color: 'var(--muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Live Scan Status Banner */}
        {hasFetchedArbs && !isInitialLoading && (
          <div 
            className={`border px-4 py-3 rounded-lg transition-all duration-500 ${showNewResultsFlash ? 'ring-2 ring-green-500' : ''}`}
            style={{
              borderColor: 'color-mix(in srgb, #22c55e 50%, transparent)',
              backgroundColor: 'color-mix(in srgb, #22c55e 10%, transparent)'
            }}
          >
            <div className="flex items-center gap-3">
              {/* Live indicator with background refresh state */}
              <div className="relative w-5 h-5 shrink-0 flex items-center justify-center">
                {isBackgroundRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#22c55e' }} />
                ) : (
                  <>
                    <div 
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ backgroundColor: '#22c55e', opacity: 0.3 }}
                    />
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#22c55e' }}
                    />
                  </>
                )}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-sm flex items-center gap-2" style={{ color: '#22c55e' }}>
                  <span>Live Scanner Active</span>
                  {isBackgroundRefreshing && (
                    <span className="text-xs font-normal opacity-75">Checking...</span>
                  )}
                  {showNewResultsFlash && (
                    <span className="text-xs font-normal bg-green-500 text-black px-1.5 py-0.5 rounded animate-pulse">Updated!</span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {scanAgeSeconds !== null && (
                    <span>Last scan: {formatScanAge(scanAgeSeconds)}</span>
                  )}
                </div>
              </div>
              
              {/* Manual refresh button */}
              <button
                onClick={handleRefresh}
                disabled={isManualRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--background)] disabled:opacity-50"
                style={{ 
                  color: 'var(--muted)',
                  border: '1px solid var(--border)'
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isManualRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isManualRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
            
            {/* Scan age progress bar */}
            <div 
              className="mt-2 h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: 'color-mix(in srgb, #22c55e 20%, transparent)' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ 
                  backgroundColor: scanAgeSeconds !== null ? getProgressBarColor(scanAgeSeconds, currentScanInterval) : '#22c55e',
                  width: `${Math.min(100, ((scanAgeSeconds || 0) / currentScanInterval) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1 text-[10px] flex justify-between" style={{ color: 'var(--muted-foreground)' }}>
              <span>Updated</span>
              <span>Next scan</span>
            </div>
          </div>
        )}

        {/* Region Tabs - single selection (radio style) */}
        {settingsLoaded && hasFetchedArbs && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm mr-1 sm:mr-2" style={{ color: 'var(--muted)' }}>Region:</span>
            {config.regionOrder.map(region => (
              <RegionTab
                key={region}
                region={region}
                isSelected={selectedRegion === region}
                onClick={() => selectRegion(region)}
              />
            ))}
            <span className="text-[10px] sm:text-xs ml-1 sm:ml-2 hidden sm:inline" style={{ color: 'var(--muted)' }}>
              {selectedBookmakerCount} bookmakers
            </span>
          </div>
        )}

        {/* Initial Loading State */}
        {isInitialLoading && !hasFetchedArbs && (
          <div 
            className="border p-8 sm:p-12 text-center rounded-lg"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)'
            }}
          >
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--muted)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Loading Live Opportunities...
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Connecting to the live arbitrage scanner
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div 
            className="border px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg"
            style={{
              borderColor: 'var(--danger)',
              backgroundColor: 'var(--danger-muted)',
              color: 'var(--danger)'
            }}
          >
            {error}
          </div>
        )}

        {/* Lines Error */}
        {linesError && !error && (
          <div 
            className="border px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg"
            style={{
              borderColor: 'var(--warning)',
              backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
              color: 'var(--warning)'
            }}
          >
            Lines scan issue: {linesError}
          </div>
        )}

        {/* Stats Grid - with smooth transitions */}
        {hasFetchedArbs && stats && (
          <div 
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px rounded-lg overflow-hidden transition-opacity duration-300"
            style={{ backgroundColor: 'var(--border-light)', opacity: isBackgroundRefreshing ? 0.8 : 1 }}
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
              value={isLoadingLines ? '...' : filteredSpreads.filter(s => s.type === 'arb').length}
              highlight={!isLoadingLines && filteredSpreads.filter(s => s.type === 'arb').length > 0}
              loading={isLoadingLines}
            />
            <StatBox 
              label="Totals Arbs" 
              value={isLoadingLines ? '...' : filteredTotals.filter(t => t.type === 'arb').length}
              highlight={!isLoadingLines && filteredTotals.filter(t => t.type === 'arb').length > 0}
              loading={isLoadingLines}
            />
            <StatBox 
              label="Middles" 
              value={isLoadingLines ? '...' : middles.length}
              subtitle="EV plays"
              loading={isLoadingLines}
            />
            <StatBox 
              label="Value Bets" 
              value={filteredValueBets.length}
              subtitle="> 5% edge"
            />
          </div>
        )}

        {/* Tabs */}
        {hasFetchedArbs && (
          <div 
            className="flex gap-1 border-b overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0"
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
              count={isLoadingLines ? undefined : filteredSpreads.length + spreadMiddles.length}
              loading={isLoadingLines}
            >
              Lines
            </TabButton>
            <TabButton 
              active={activeTab === 'totals'} 
              onClick={() => setActiveTab('totals')}
              count={isLoadingLines ? undefined : filteredTotals.length + totalsMiddles.length}
              loading={isLoadingLines}
            >
              Totals
            </TabButton>
            <TabButton 
              active={activeTab === 'value-bets'} 
              onClick={() => setActiveTab('value-bets')}
              count={filteredValueBets.length}
            >
              Value
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
        )}

        {/* Filters */}
        {hasFetchedArbs && (activeTab === 'opportunities' || activeTab === 'spreads' || activeTab === 'totals') && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <ArbFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableSports={sports}
              availableBookmakers={bookmakers}
            />
            {(activeTab === 'spreads' || activeTab === 'totals') && (
              <button
                onClick={() => setShowMiddles(!showMiddles)}
                className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium border transition-colors rounded-lg"
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

        {/* Tab Content - wrapped in transition container */}
        <div className={`transition-opacity duration-200 ${isBackgroundRefreshing ? 'opacity-90' : 'opacity-100'}`}>
          {hasFetchedArbs && activeTab === 'opportunities' && (
            <ArbTable
              opportunities={filteredOpportunities}
              onSelectArb={setSelectedArb}
              globalMode={false}
            />
          )}

          {hasFetchedArbs && activeTab === 'spreads' && (
            isLoadingLines ? (
              <LoadingPlaceholder message="Loading spreads & middles..." />
            ) : (
              <SpreadsTable
                spreads={filteredSpreads}
                middles={spreadMiddles}
                onSelectSpread={(s) => setSelectedLineOpp(s)}
                onSelectMiddle={(m) => setSelectedLineOpp(m)}
                showMiddles={showMiddles}
                globalMode={false}
              />
            )
          )}

          {hasFetchedArbs && activeTab === 'totals' && (
            isLoadingLines ? (
              <LoadingPlaceholder message="Loading totals & middles..." />
            ) : (
              <TotalsTable
                totals={filteredTotals}
                middles={totalsMiddles}
                onSelectTotals={(t) => setSelectedLineOpp(t)}
                onSelectMiddle={(m) => setSelectedLineOpp(m)}
                showMiddles={showMiddles}
                globalMode={false}
              />
            )
          )}

          {hasFetchedArbs && activeTab === 'value-bets' && (
            <ValueBetsTable valueBets={filteredValueBets} onSelectValueBet={setSelectedValueBet} />
          )}
        </div>

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
            region={userDefaultRegion}
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

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
}

function LoadingPlaceholder({ message }: { message: string }) {
  return (
    <div 
      className="border p-8 sm:p-12 text-center rounded-lg"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--surface)'
      }}
    >
      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--muted)' }} />
      <p className="text-sm" style={{ color: 'var(--muted)' }}>{message}</p>
    </div>
  );
}

function StatBox({ 
  label, 
  value, 
  subtitle,
  highlight,
  loading 
}: { 
  label: string; 
  value: number | string; 
  subtitle?: string;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 transition-opacity duration-200" style={{ backgroundColor: 'var(--background)' }}>
      <div 
        className="text-[10px] sm:text-xs uppercase tracking-wide mb-0.5 sm:mb-1 truncate"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </div>
      <div 
        className="text-lg sm:text-xl lg:text-2xl font-mono flex items-center gap-1 sm:gap-2 transition-all duration-200"
        style={{ color: highlight ? 'var(--foreground)' : 'var(--muted)' }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" style={{ color: 'var(--muted)' }} />
        ) : (
          value
        )}
      </div>
      {subtitle && (
        <div className="text-[10px] sm:text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
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
  count,
  loading 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  count?: number;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0"
      style={{
        borderColor: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--foreground)' : 'var(--muted)'
      }}
    >
      {children}
      {loading ? (
        <Loader2 className="inline-block ml-1.5 sm:ml-2 w-3 h-3 animate-spin" style={{ color: 'var(--muted)' }} />
      ) : count !== undefined && count > 0 && (
        <span 
          className="ml-1 sm:ml-2 text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded transition-all duration-200"
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

function ValueBetsTable({ valueBets, onSelectValueBet }: { valueBets: ValueBet[]; onSelectValueBet: (vb: ValueBet) => void }) {
  if (valueBets.length === 0) {
    return (
      <div 
        className="border p-8 sm:p-12 text-center rounded-lg"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)'
        }}
      >
        <p style={{ color: 'var(--muted)' }} className="mb-2 text-sm">No value bets found</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Value bets have {'>'}5% expected edge
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
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Event</th>
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-wide font-medium hidden sm:table-cell" style={{ color: 'var(--muted)' }}>Book</th>
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Selection</th>
            <th className="text-right px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Odds</th>
            <th className="text-right px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Edge</th>
            <th className="text-right px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--muted)' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {valueBets.map((vb, idx) => (
            <tr 
              key={`${vb.event.id}-${idx}`}
              className="hover:bg-[var(--background)] transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <td className="px-2 sm:px-4 py-2 sm:py-3">
                <div className="font-medium text-xs sm:text-sm" style={{ color: 'var(--foreground)' }}>{vb.event.homeTeam}</div>
                <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted)' }}>vs {vb.event.awayTeam}</div>
                <div className="text-[10px] sm:hidden mt-1" style={{ color: 'var(--muted-foreground)' }}>{vb.outcome.bookmaker}</div>
              </td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell" style={{ color: 'var(--foreground)' }}>{vb.outcome.bookmaker}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3" style={{ color: 'var(--foreground)' }}>{vb.outcome.name}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-mono" style={{ color: 'var(--foreground)' }}>{vb.outcome.odds.toFixed(2)}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-mono" style={{ color: '#22c55e' }}>+{vb.valuePercentage.toFixed(1)}%</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                <button
                  onClick={() => onSelectValueBet(vb)}
                  className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded transition-colors"
                  style={{
                    backgroundColor: 'var(--foreground)',
                    color: 'var(--background)'
                  }}
                >
                  Calc
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
