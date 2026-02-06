// src/app/dashboard/page.tsx
'use client';
import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, X, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
// PERFORMANCE FIX: Direct imports instead of barrel exports
import { Header } from '@/components/Header';
import { ArbFilters } from '@/components/ArbFilters';
import { ArbTable } from '@/components/ArbTable';
import { StakeCalculatorModal } from '@/components/StakeCalculatorModal';
import { ValueBetCalculatorModal } from '@/components/ValueBetCalculatorModal';
import { BetTracker } from '@/components/BetTracker';
import { AccountsManager } from '@/components/AccountsManager';
import { SpreadsTable } from '@/components/SpreadsTable';
import { TotalsTable } from '@/components/TotalsTable';
import { LineCalculatorModal } from '@/components/LineCalculatorModal';
import { Flag } from '@/components/Flag';
import { SubscriptionRequiredModal } from '@/components/SubscriptionRequiredModal';
import { FlagIconsLoader } from '@/components/FlagIconsLoader';
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
  region?: UserRegion;
  opportunities?: ArbOpportunity[];
  valueBets?: ValueBet[];
  spreadArbs?: SpreadArb[];
  totalsArbs?: TotalsArb[];
  middles?: MiddleOpportunity[];
  stats?: ScanStats;
  lineStats?: LineStats;
  scannedAt?: string;
  ageSeconds?: number;
  ageMinutes?: number;
  remainingCredits?: number;
  scanDurationMs?: number;
  message?: string;
  error?: string;
  subscriptionRequired?: boolean;
  trialExpired?: boolean;
  freeTrialEndsAt?: string;
}

interface ScanProgressBatch {
  region: string;
  scanId: string;
  batchIndex: number;
  sportKeys: string[];
  opportunities: ArbOpportunity[];
  valueBets: ValueBet[];
  spreadArbs: SpreadArb[];
  totalsArbs: TotalsArb[];
  middles: MiddleOpportunity[];
  stats: ScanStats & { sportsTotal: number };
  phase: 'h2h' | 'lines' | 'complete';
  isLastBatch: boolean;
  createdAt: string;
}

interface ScanProgressResponse {
  batches: ScanProgressBatch[];
  count: number;
  serverTime: string;
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

// =========================================================================
// PERFORMANCE FIX: Reduced polling frequency to lower server/DB load.
// - Arb poll: 5s → 15s (the auto-scanner updates every ~45-180s anyway,
//   so polling faster than that just returns the same cached data)
// - Progress poll: 2s → 4s (still responsive for live scan updates)
// =========================================================================
const POLL_INTERVAL_SECONDS = 15;
const PROGRESS_POLL_INTERVAL_MS = 4000;

const SCAN_INTERVAL_AU = 44;
const SCAN_INTERVAL_OTHER = 180;

// Region tab component
function RegionTab({ 
  region, 
  isSelected, 
  onClick,
  isLoading
}: { 
  region: UserRegion; 
  isSelected: boolean; 
  onClick: () => void;
  isLoading?: boolean;
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
      disabled={isLoading}
      className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium border rounded-lg transition-all ${colorMap[info.color]} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isSelected && isLoading ? (
        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
      ) : (
        <Flag code={info.flagCode} size="sm" />
      )}
      <span className="hidden xs:inline">{region}</span>
    </button>
  );
}

// Helper functions
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

function getBookmakersFromSpreadArb(arb: SpreadArb): string[] {
  return [arb.favorite.bookmaker, arb.underdog.bookmaker];
}

function getBookmakersFromTotalsArb(arb: TotalsArb): string[] {
  return [arb.over.bookmaker, arb.under.bookmaker];
}

function getArbKey(opp: ArbOpportunity): string {
  if (opp.mode === 'book-vs-book') {
    const parts = [opp.event.id, opp.outcome1.bookmakerKey, opp.outcome2.bookmakerKey];
    if (opp.outcome3) parts.push(opp.outcome3.bookmakerKey);
    parts.push(String(Math.round(opp.outcome1.odds * 100)));
    parts.push(String(Math.round(opp.outcome2.odds * 100)));
    return parts.join('-');
  }
  return `${opp.event.id}-${opp.backOutcome.bookmakerKey}-${Math.round(opp.backOutcome.odds * 100)}`;
}

function getSpreadKey(arb: SpreadArb): string {
  return `${arb.event.id}-${arb.favorite.bookmakerKey}-${arb.underdog.bookmakerKey}-${arb.line}`;
}

function getTotalsKey(arb: TotalsArb): string {
  return `${arb.event.id}-${arb.over.bookmakerKey}-${arb.under.bookmakerKey}-${arb.line}`;
}

function getMiddleKey(m: MiddleOpportunity): string {
  return `${m.event.id}-${m.side1.bookmakerKey}-${m.side2.bookmakerKey}-${m.side1.point}-${m.side2.point}`;
}

function mergeByKey<T>(existing: T[], incoming: T[], keyFn: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of existing) {
    map.set(keyFn(item), item);
  }
  for (const item of incoming) {
    map.set(keyFn(item), item);
  }
  return Array.from(map.values());
}

function parseArbDates(opp: ArbOpportunity): ArbOpportunity {
  return {
    ...opp,
    event: { ...opp.event, commenceTime: new Date(opp.event.commenceTime) },
    lastUpdated: new Date(opp.lastUpdated),
  } as ArbOpportunity;
}

function parseSpreadDates(s: SpreadArb): SpreadArb {
  return { ...s, event: { ...s.event, commenceTime: new Date(s.event.commenceTime) }, lastUpdated: new Date(s.lastUpdated) };
}

function parseTotalsDates(t: TotalsArb): TotalsArb {
  return { ...t, event: { ...t.event, commenceTime: new Date(t.event.commenceTime) }, lastUpdated: new Date(t.lastUpdated) };
}

function parseMiddleDates(m: MiddleOpportunity): MiddleOpportunity {
  return { ...m, event: { ...m.event, commenceTime: new Date(m.event.commenceTime) }, lastUpdated: new Date(m.lastUpdated) };
}

function parseValueBetDates(vb: ValueBet): ValueBet {
  return { ...vb, event: { ...vb.event, commenceTime: new Date(vb.event.commenceTime) }, lastUpdated: new Date(vb.lastUpdated) };
}

// SUSPENSE FIX: useSearchParams() requires a Suspense boundary in Next.js 16
export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
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
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [isRegionSwitching, setIsRegionSwitching] = useState(false);
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | undefined>();
  const [selectedArb, setSelectedArb] = useState<ArbOpportunity | null>(null);
  const [selectedValueBet, setSelectedValueBet] = useState<ValueBet | null>(null);
  const [selectedLineOpp, setSelectedLineOpp] = useState<SpreadArb | TotalsArb | MiddleOpportunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedArbs, setHasFetchedArbs] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('opportunities');
  const [showMiddles, setShowMiddles] = useState(true);
  
  const [selectedRegion, setSelectedRegion] = useState<UserRegion>('AU');
  const [userDefaultRegion, setUserDefaultRegion] = useState<UserRegion>('AU');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [trialExpiredFlag, setTrialExpiredFlag] = useState(false);
  
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const [scanAgeSeconds, setScanAgeSeconds] = useState<number | null>(null);
  const [showNewResultsFlash, setShowNewResultsFlash] = useState(false);
  
  // Free trial countdown state
  const [freeTrialEndsAt, setFreeTrialEndsAt] = useState<Date | null>(null);
  const [freeTrialRemainingMs, setFreeTrialRemainingMs] = useState<number>(0);
  
  const [scanProgress, setScanProgress] = useState<{
    isActive: boolean;
    phase: 'h2h' | 'lines' | 'complete' | null;
    sportsScanned: number;
    sportsTotal: number;
    arbsFoundSoFar: number;
    newArbsInLastBatch: number;
  }>({
    isActive: false,
    phase: null,
    sportsScanned: 0,
    sportsTotal: 0,
    arbsFoundSoFar: 0,
    newArbsInLastBatch: 0,
  });
  
  const lastScannedAtRef = useRef<string | null>(null);
  const selectedRegionRef = useRef<UserRegion>('AU');
  const isRegionSwitchingRef = useRef(false);
  const progressSinceRef = useRef<string>(new Date().toISOString());
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanProgressActiveRef = useRef(false);
  const scanAgeSecondsRef = useRef<number | null>(null);

  const { bets, isLoaded: betsLoaded, addBet, updateBet, deleteBet, clearAllBets } = useBets();
  const { 
    accounts, 
    transactions, 
    isLoaded: accountsLoaded,
    toggleAccount, 
    addTransaction, 
    deleteTransaction 
  } = useAccounts();

  const hasAccess = (session?.user as { hasAccess?: boolean } | undefined)?.hasAccess ?? false;
  const freeTrialActive = (session?.user as { freeTrialActive?: boolean } | undefined)?.freeTrialActive ?? false;

  // Initialize free trial countdown from session
  useEffect(() => {
    const sessionTrialEndsAt = (session?.user as { freeTrialEndsAt?: string } | undefined)?.freeTrialEndsAt;
    if (sessionTrialEndsAt) {
      setFreeTrialEndsAt(new Date(sessionTrialEndsAt));
    }
  }, [session]);

  // Free trial countdown ticker (updates every second)
  useEffect(() => {
    if (!freeTrialEndsAt) return;
    
    const tick = () => {
      const remaining = freeTrialEndsAt.getTime() - Date.now();
      setFreeTrialRemainingMs(Math.max(0, remaining));
      
      // Trial just expired — show subscription modal (but NOT if user has a paid subscription)
      if (remaining <= 0 && !hasAccess) {
        setTrialExpiredFlag(true);
        setShowSubscriptionModal(true);
      }
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [freeTrialEndsAt, hasAccess]);

  useEffect(() => {
    selectedRegionRef.current = selectedRegion;
  }, [selectedRegion]);

  useEffect(() => {
    scanProgressActiveRef.current = scanProgress.isActive;
  }, [scanProgress.isActive]);

  useEffect(() => {
    scanAgeSecondsRef.current = scanAgeSeconds;
  }, [scanAgeSeconds]);

  const getScanInterval = useCallback(() => {
    return selectedRegion === 'AU' ? SCAN_INTERVAL_AU : SCAN_INTERVAL_OTHER;
  }, [selectedRegion]);

  // Handle checkout success
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

  // Load user's default region
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          const region = data.region || 'AU';
          setUserDefaultRegion(region);
          setSelectedRegion(region);
          selectedRegionRef.current = region;
        }
      } catch (err) {
        console.error('Failed to fetch user settings:', err);
      } finally {
        setSettingsLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  // Scan progress polling
  const pollScanProgress = useCallback(async () => {
    if (isRegionSwitchingRef.current) return;
    
    const region = selectedRegionRef.current;
    
    try {
      const res = await fetch(
        `/api/scan-progress?region=${region}&since=${encodeURIComponent(progressSinceRef.current)}`
      );
      
      if (!res.ok) return;
      
      const data: ScanProgressResponse = await res.json();
      
      if (data.count === 0) return;
      
      const latestBatch = data.batches[data.batches.length - 1];
      progressSinceRef.current = latestBatch.createdAt;
      
      const completeBatch = data.batches.find(b => b.isLastBatch);
      
      for (const batch of data.batches) {
        if (batch.isLastBatch) continue;
        if (batch.region !== selectedRegionRef.current) continue;
        
        const newOpps = (batch.opportunities || []).map(parseArbDates);
        const newValueBets = (batch.valueBets || []).map(parseValueBetDates);
        const newSpreads = (batch.spreadArbs || []).map(parseSpreadDates);
        const newTotals = (batch.totalsArbs || []).map(parseTotalsDates);
        const newMiddles = (batch.middles || []).map(parseMiddleDates);
        
        const newArbCount = newOpps.filter(o => o.type === 'arb').length;
        
        if (newOpps.length > 0) {
          setOpportunities(prev => {
            const merged = mergeByKey(prev, newOpps, getArbKey);
            merged.sort((a, b) => b.profitPercentage - a.profitPercentage);
            return merged;
          });
        }
        
        if (newValueBets.length > 0) {
          setValueBets(prev => mergeByKey(prev, newValueBets, vb => `${vb.event.id}-${vb.outcome.bookmakerKey}-${vb.outcome.name}`));
        }
        
        if (newSpreads.length > 0) {
          setSpreadArbs(prev => {
            const merged = mergeByKey(prev, newSpreads, getSpreadKey);
            merged.sort((a, b) => b.profitPercentage - a.profitPercentage);
            return merged;
          });
        }
        
        if (newTotals.length > 0) {
          setTotalsArbs(prev => {
            const merged = mergeByKey(prev, newTotals, getTotalsKey);
            merged.sort((a, b) => b.profitPercentage - a.profitPercentage);
            return merged;
          });
        }
        
        if (newMiddles.length > 0) {
          setMiddles(prev => mergeByKey(prev, newMiddles, getMiddleKey));
        }
        
        setScanProgress({
          isActive: true,
          phase: batch.phase,
          sportsScanned: batch.stats?.sportsScanned || 0,
          sportsTotal: batch.stats?.sportsTotal || 0,
          arbsFoundSoFar: batch.stats?.arbsFound || 0,
          newArbsInLastBatch: newArbCount,
        });
        
        if (batch.stats) {
          setStats({
            totalEvents: batch.stats.totalEvents,
            eventsWithMultipleBookmakers: batch.stats.eventsWithMultipleBookmakers,
            totalBookmakers: batch.stats.totalBookmakers,
            arbsFound: batch.stats.arbsFound,
            nearArbsFound: batch.stats.nearArbsFound,
            valueBetsFound: batch.stats.valueBetsFound,
            sportsScanned: batch.stats.sportsScanned,
          });
        }

        const uniqueBookmakers = new Set<string>();
        newOpps.forEach(opp => getBookmakersFromArb(opp).forEach(bm => uniqueBookmakers.add(bm)));
        newSpreads.forEach(s => getBookmakersFromSpreadArb(s).forEach(bm => uniqueBookmakers.add(bm)));
        newTotals.forEach(t => getBookmakersFromTotalsArb(t).forEach(bm => uniqueBookmakers.add(bm)));
        if (uniqueBookmakers.size > 0) {
          setBookmakers(prev => {
            const combined = new Set([...prev, ...uniqueBookmakers]);
            return Array.from(combined);
          });
        }
        
        if (newArbCount > 0) {
          setShowNewResultsFlash(true);
          setTimeout(() => setShowNewResultsFlash(false), 1500);
        }
        
        setHasFetchedArbs(true);
        setError(null);
      }
      
      if (completeBatch) {
        setScanProgress(prev => ({ ...prev, isActive: false, phase: 'complete' }));
        lastScannedAtRef.current = null;
      }
      
    } catch (err) {
      console.debug('[Dashboard] Progress poll error:', err);
    }
  }, []);

  // Start/stop progress polling
  useEffect(() => {
    if (!settingsLoaded || !hasAccess) return;
    progressIntervalRef.current = setInterval(pollScanProgress, PROGRESS_POLL_INTERVAL_MS);
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [settingsLoaded, hasAccess, pollScanProgress]);

  // Fetch global arbs
  const fetchGlobalArbs = useCallback(async (
    mode: 'initial' | 'background' | 'manual' = 'background',
    explicitRegion?: UserRegion
  ) => {
    if (mode === 'background' && isRegionSwitchingRef.current) return;
    if (mode === 'background' && scanProgressActiveRef.current) return;

    if (mode === 'initial') {
      setIsInitialLoading(true);
    } else if (mode === 'manual') {
      setIsManualRefreshing(true);
    } else {
      setIsBackgroundRefreshing(true);
    }

    try {
      const region = explicitRegion ?? selectedRegionRef.current;
      const res = await fetch(`/api/global-arbs?region=${region}`);
      const data: GlobalArbsResponse = await res.json();

      if (data.subscriptionRequired) {
        setTrialExpiredFlag(!!data.trialExpired);
        setShowSubscriptionModal(true);
        return;
      }

      // Update free trial end time from API response
      if (data.freeTrialEndsAt) {
        setFreeTrialEndsAt(new Date(data.freeTrialEndsAt));
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch opportunities');
      }

      if (data.region && data.region !== selectedRegionRef.current) {
        console.log(`[Dashboard] Ignoring stale response for ${data.region}, now on ${selectedRegionRef.current}`);
        return;
      }

      if (data.hasCachedResults) {
        const isNewData = data.scannedAt !== lastScannedAtRef.current;
        const parsedOpportunities = (data.opportunities || []).map(parseArbDates);
        const parsedValueBets = (data.valueBets || []).map(parseValueBetDates);
        const parsedSpreadArbs = (data.spreadArbs || []).map(parseSpreadDates);
        const parsedTotalsArbs = (data.totalsArbs || []).map(parseTotalsDates);
        const parsedMiddles = (data.middles || []).map(parseMiddleDates);

        if (isNewData || mode === 'initial' || mode === 'manual') {
          setOpportunities(parsedOpportunities);
          setValueBets(parsedValueBets);
          setSpreadArbs(parsedSpreadArbs);
          setTotalsArbs(parsedTotalsArbs);
          setMiddles(parsedMiddles);
          if (data.stats) setStats(data.stats);
          if (data.lineStats) setLineStats(data.lineStats);
          
          const uniqueBookmakers = new Set<string>();
          parsedOpportunities.forEach(opp => {
            getBookmakersFromArb(opp).forEach(bm => uniqueBookmakers.add(bm));
          });
          parsedSpreadArbs.forEach(s => {
            getBookmakersFromSpreadArb(s).forEach(bm => uniqueBookmakers.add(bm));
          });
          parsedTotalsArbs.forEach(t => {
            getBookmakersFromTotalsArb(t).forEach(bm => uniqueBookmakers.add(bm));
          });
          setBookmakers(Array.from(uniqueBookmakers));

          if (isNewData && lastScannedAtRef.current !== null && mode !== 'initial') {
            setShowNewResultsFlash(true);
            setTimeout(() => setShowNewResultsFlash(false), 2000);
          }
        }

        if (data.scannedAt) {
          setLastUpdated(new Date(data.scannedAt));
          lastScannedAtRef.current = data.scannedAt;
        }
        if (data.ageSeconds !== undefined) setScanAgeSeconds(data.ageSeconds);
        if (data.remainingCredits !== undefined) setRemainingCredits(data.remainingCredits);
        setHasFetchedArbs(true);
        setError(null);
        console.log(`[Dashboard] ${region}: ${parsedOpportunities.length} H2H, ${parsedSpreadArbs.length} spreads, ${parsedTotalsArbs.length} totals, ${parsedMiddles.length} middles (${data.ageSeconds}s old)${isNewData ? ' [NEW]' : ''}`);
      }
    } catch (err) {
      console.error('Failed to fetch global arbs:', err);
      if (mode !== 'background') {
        setError(err instanceof Error ? err.message : 'Failed to load opportunities');
      }
    } finally {
      setIsInitialLoading(false);
      setIsBackgroundRefreshing(false);
      setIsManualRefreshing(false);
      setIsRegionSwitching(false);
      isRegionSwitchingRef.current = false;
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    if (!settingsLoaded) return;
    fetchGlobalArbs('initial', selectedRegionRef.current);
    const pollInterval = setInterval(() => {
      fetchGlobalArbs('background');
    }, POLL_INTERVAL_SECONDS * 1000);
    return () => clearInterval(pollInterval);
  }, [fetchGlobalArbs, settingsLoaded]);

  // Region selection
  const selectRegion = useCallback((region: UserRegion) => {
    if (region !== selectedRegion) {
      isRegionSwitchingRef.current = true;
      setIsRegionSwitching(true);
      
      selectedRegionRef.current = region;
      setSelectedRegion(region);
      
      setOpportunities([]);
      setValueBets([]);
      setSpreadArbs([]);
      setTotalsArbs([]);
      setMiddles([]);
      setStats(null);
      setLineStats(null);
      setScanAgeSeconds(null);
      lastScannedAtRef.current = null;
      
      progressSinceRef.current = new Date().toISOString();
      setScanProgress({ isActive: false, phase: null, sportsScanned: 0, sportsTotal: 0, arbsFoundSoFar: 0, newArbsInLastBatch: 0 });
      
      fetchGlobalArbs('initial', region);
    }
  }, [selectedRegion, fetchGlobalArbs]);

  // Increment age counter
  useEffect(() => {
    const ageInterval = setInterval(() => {
      if (scanAgeSecondsRef.current !== null) {
        setScanAgeSeconds(prev => (prev !== null ? prev + 1 : null));
      }
    }, 1000);
    return () => clearInterval(ageInterval);
  }, []);

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

  const handleRefresh = useCallback(() => {
    fetchGlobalArbs('manual', selectedRegion);
  }, [fetchGlobalArbs, selectedRegion]);

  const handleLogBet = (bet: Omit<PlacedBet, 'id' | 'createdAt'>) => {
    addBet(bet);
    setSelectedArb(null);
    setSelectedValueBet(null);
    setSelectedLineOpp(null);
  };

  // Apply local filters
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

  const filteredValueBets = valueBets;

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

  const filteredMiddles = middles;

  const profitableCount = filteredOpportunities.filter(o => o.profitPercentage >= 0).length;
  const activeAccountsCount = accounts.filter(a => a.isActive).length;
  const spreadMiddles = filteredMiddles.filter(m => m.marketType === 'spreads');
  const totalsMiddles = filteredMiddles.filter(m => m.marketType === 'totals');
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

  const getProgressBarColor = (seconds: number, interval: number) => {
    const progress = seconds / interval;
    if (progress < 0.25) return '#22c55e';
    if (progress < 0.5) return '#84cc16';
    if (progress < 0.75) return '#eab308';
    return '#f97316';
  };

  const isLoading = isInitialLoading || isManualRefreshing || isRegionSwitching;
  const currentScanInterval = getScanInterval();

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* PERFORMANCE FIX: Load flag-icons CSS only on dashboard */}
      <FlagIconsLoader />

      <Header
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        isUsingMockData={false}
        remainingRequests={remainingCredits}
        onRefresh={handleRefresh}
        onQuickScan={handleRefresh}
        freeTrialRemainingMs={freeTrialRemainingMs}
        freeTrialActive={freeTrialActive}
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
        {hasFetchedArbs && !isInitialLoading && !isRegionSwitching && (
          <div 
            className={`border px-4 py-3 rounded-lg transition-all duration-500 ${showNewResultsFlash ? 'ring-2 ring-green-500' : ''}`}
            style={{
              borderColor: 'color-mix(in srgb, #22c55e 50%, transparent)',
              backgroundColor: 'color-mix(in srgb, #22c55e 10%, transparent)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative w-5 h-5 shrink-0 flex items-center justify-center">
                {isBackgroundRefreshing || scanProgress.isActive ? (
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
                  <span className="text-xs font-normal opacity-75">({selectedRegion})</span>
                  
                  {scanProgress.isActive && (
                    <span className="flex items-center gap-1 text-xs font-normal bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3" />
                      Scanning {scanProgress.phase === 'h2h' ? 'H2H' : 'Lines'}
                      {scanProgress.sportsTotal > 0 && (
                        <span className="opacity-75">
                          ({scanProgress.sportsScanned}/{scanProgress.sportsTotal})
                        </span>
                      )}
                      {scanProgress.arbsFoundSoFar > 0 && (
                        <span className="text-green-300 font-medium">
                          • {scanProgress.arbsFoundSoFar} arbs
                        </span>
                      )}
                    </span>
                  )}
                  
                  {!scanProgress.isActive && isBackgroundRefreshing && (
                    <span className="text-xs font-normal opacity-75">Checking...</span>
                  )}
                  {showNewResultsFlash && (
                    <span className="text-xs font-normal bg-green-500 text-black px-1.5 py-0.5 rounded animate-pulse">
                      {scanProgress.newArbsInLastBatch > 0 ? `+${scanProgress.newArbsInLastBatch} arbs!` : 'Updated!'}
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {scanAgeSeconds !== null && !scanProgress.isActive && (
                    <span>Last scan: {formatScanAge(scanAgeSeconds)}</span>
                  )}
                  {scanProgress.isActive && (
                    <span>Results streaming live — arbs appear as they&apos;re found</span>
                  )}
                </div>
              </div>
              
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
            
            {scanProgress.isActive && scanProgress.sportsTotal > 0 ? (
              <>
                <div 
                  className="mt-2 h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'color-mix(in srgb, #22c55e 20%, transparent)' }}
                >
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      backgroundColor: '#22c55e',
                      width: `${Math.min(100, (scanProgress.sportsScanned / scanProgress.sportsTotal) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 text-[10px] flex justify-between" style={{ color: 'var(--muted-foreground)' }}>
                  <span>Scanning {scanProgress.phase === 'h2h' ? 'H2H markets' : 'Lines markets'}...</span>
                  <span>{Math.round((scanProgress.sportsScanned / scanProgress.sportsTotal) * 100)}%</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {/* Region Tabs */}
        {settingsLoaded && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm mr-1 sm:mr-2" style={{ color: 'var(--muted)' }}>Region:</span>
            {config.regionOrder.map(region => (
              <RegionTab
                key={region}
                region={region}
                isSelected={selectedRegion === region}
                onClick={() => selectRegion(region)}
                isLoading={isRegionSwitching && selectedRegion === region}
              />
            ))}
            <span className="text-[10px] sm:text-xs ml-1 sm:ml-2 hidden sm:inline" style={{ color: 'var(--muted)' }}>
              {selectedBookmakerCount} bookmakers
            </span>
          </div>
        )}

        {/* Loading State for Region Switch */}
        {isRegionSwitching && (
          <div 
            className="border p-8 sm:p-12 text-center rounded-lg"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)'
            }}
          >
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--muted)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Loading {selectedRegion} Opportunities...
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Switching to {selectedRegion} bookmakers
            </p>
          </div>
        )}

        {/* Initial Loading State */}
        {isInitialLoading && !hasFetchedArbs && !isRegionSwitching && (
          <div 
            className="border p-8 sm:p-12 text-center rounded-lg"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)'
            }}
          >
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--muted)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Loading {selectedRegion} Opportunities...
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

        {/* Stats Grid */}
        {hasFetchedArbs && stats && !isRegionSwitching && (
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
              value={filteredMiddles.length}
              subtitle="EV plays"
            />
            <StatBox 
              label="Value Bets" 
              value={filteredValueBets.length}
              subtitle="> 5% edge"
            />
          </div>
        )}

        {/* Tabs */}
        {hasFetchedArbs && !isRegionSwitching && (
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
              count={filteredSpreads.length + spreadMiddles.length}
            >
              Lines
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
        {hasFetchedArbs && !isRegionSwitching && (activeTab === 'opportunities' || activeTab === 'spreads' || activeTab === 'totals') && (
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

        {/* Tab Content */}
        <div className={`transition-opacity duration-200 ${isBackgroundRefreshing && !scanProgress.isActive ? 'opacity-90' : 'opacity-100'}`}>
          {hasFetchedArbs && !isRegionSwitching && activeTab === 'opportunities' && (
            <ArbTable
              opportunities={filteredOpportunities}
              onSelectArb={setSelectedArb}
              globalMode={false}
            />
          )}

          {hasFetchedArbs && !isRegionSwitching && activeTab === 'spreads' && (
            <SpreadsTable
              spreads={filteredSpreads}
              middles={spreadMiddles}
              onSelectSpread={(s) => setSelectedLineOpp(s)}
              onSelectMiddle={(m) => setSelectedLineOpp(m)}
              showMiddles={showMiddles}
              globalMode={false}
            />
          )}

          {hasFetchedArbs && !isRegionSwitching && activeTab === 'totals' && (
            <TotalsTable
              totals={filteredTotals}
              middles={totalsMiddles}
              onSelectTotals={(t) => setSelectedLineOpp(t)}
              onSelectMiddle={(m) => setSelectedLineOpp(m)}
              showMiddles={showMiddles}
              globalMode={false}
            />
          )}

          {hasFetchedArbs && !isRegionSwitching && activeTab === 'value-bets' && (
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
        trialExpired={trialExpiredFlag}
      />
    </div>
  );
}

function StatBox({ 
  label, 
  value, 
  subtitle,
  highlight,
}: { 
  label: string; 
  value: number | string; 
  subtitle?: string;
  highlight?: boolean;
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
        {value}
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
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  count?: number;
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
      {count !== undefined && count > 0 && (
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
