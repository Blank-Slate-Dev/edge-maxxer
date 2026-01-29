// src/hooks/useBets.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { PlacedBet } from '@/lib/bets';
import { generateBetId } from '@/lib/bets';

const STORAGE_KEY = 'edge-maxxer-bets';
// Minimum profit to trigger counter update (10 cents)
const MIN_PROFIT_THRESHOLD = 0.10;

// Type for new bets without id and createdAt (these are generated internally)
type NewBet = Omit<PlacedBet, 'id' | 'createdAt'>;

export function useBets() {
  const { data: session, status } = useSession();
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Track if we've done initial server fetch
  const hasFetchedFromServer = useRef(false);
  
  // Track if user is authenticated
  const isAuthenticated = status === 'authenticated' && !!session?.user;

  // Load bets - from server if authenticated, localStorage if not
  useEffect(() => {
    const loadBets = async () => {
      // If still checking auth status, wait
      if (status === 'loading') return;

      if (isAuthenticated && !hasFetchedFromServer.current) {
        // Fetch from server
        try {
          setIsSyncing(true);
          setSyncError(null);
          
          const res = await fetch('/api/bets');
          
          if (res.ok) {
            const data = await res.json();
            setBets(data.bets || []);
            hasFetchedFromServer.current = true;
            
            // Also save to localStorage as backup
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.bets || []));
            } catch (err) {
              console.error('Failed to backup bets to localStorage:', err);
            }
          } else if (res.status === 401) {
            // Not authenticated - fall back to localStorage
            loadFromLocalStorage();
          } else {
            throw new Error('Failed to fetch bets from server');
          }
        } catch (err) {
          console.error('Failed to fetch bets from server:', err);
          setSyncError('Failed to load bets from server. Using local data.');
          // Fall back to localStorage
          loadFromLocalStorage();
        } finally {
          setIsSyncing(false);
          setIsLoaded(true);
        }
      } else if (!isAuthenticated) {
        // Not authenticated - use localStorage
        loadFromLocalStorage();
        setIsLoaded(true);
      }
    };

    const loadFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setBets(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load bets from localStorage:', err);
      }
    };

    loadBets();
  }, [isAuthenticated, status]);

  // Reset server fetch flag when auth changes
  useEffect(() => {
    if (status === 'unauthenticated') {
      hasFetchedFromServer.current = false;
    }
  }, [status]);

  // Save to localStorage whenever bets change (backup)
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
      } catch (err) {
        console.error('Failed to save bets to localStorage:', err);
      }
    }
  }, [bets, isLoaded]);

  const addBet = useCallback(async (newBet: NewBet) => {
    // Generate id and createdAt for the new bet
    const bet: PlacedBet = {
      ...newBet,
      id: generateBetId(),
      createdAt: new Date().toISOString(),
      extraProfitCounted: false, // Initialize flag
    };

    // Optimistic update
    setBets(prev => [bet, ...prev]);

    if (isAuthenticated) {
      try {
        const res = await fetch('/api/bets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bet),
        });

        if (res.ok) {
          const data = await res.json();
          // Update with server-generated ID
          setBets(prev => prev.map(b => 
            b.id === bet.id ? { ...data.bet, id: data.bet.id } : b
          ));
        } else {
          console.error('Failed to save bet to server');
          setSyncError('Failed to sync bet to server');
        }
      } catch (err) {
        console.error('Failed to save bet to server:', err);
        setSyncError('Failed to sync bet to server');
      }
    } else {
      // If not authenticated, still update global stats (only if above threshold)
      if (bet.expectedProfit >= MIN_PROFIT_THRESHOLD) {
        try {
          await fetch('/api/global-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profit: bet.expectedProfit }),
          });
        } catch (err) {
          console.error('Failed to update global stats:', err);
        }
      }
    }
  }, [isAuthenticated]);

  const updateBet = useCallback(async (id: string, updates: Partial<PlacedBet>) => {
    // Find the current bet BEFORE update
    const currentBet = bets.find(b => b.id === id);
    
    // Optimistic update
    setBets(prev => prev.map(bet => 
      bet.id === id ? { ...bet, ...updates } : bet
    ));

    if (isAuthenticated) {
      // Backend handles extra profit logic for authenticated users
      try {
        const res = await fetch('/api/bets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates }),
        });

        if (!res.ok) {
          console.error('Failed to update bet on server');
          setSyncError('Failed to sync bet update');
        }
      } catch (err) {
        console.error('Failed to update bet on server:', err);
        setSyncError('Failed to sync bet update');
      }
    } else {
      // For non-authenticated users: check if we should add extra profit
      // 1. Extra profit hasn't been counted yet
      // 2. actualProfit is being set
      // 3. actualProfit is higher than expectedProfit
      // 4. The extra profit is above the minimum threshold
      if (currentBet && 
          !currentBet.extraProfitCounted &&
          updates.actualProfit !== undefined &&
          updates.actualProfit > currentBet.expectedProfit) {
        const extraProfit = updates.actualProfit - currentBet.expectedProfit;
        
        // Only update if extra profit meets threshold
        if (extraProfit >= MIN_PROFIT_THRESHOLD) {
          try {
            await fetch('/api/global-stats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profit: extraProfit }),
            });
            
            // Mark extra profit as counted in local state
            setBets(prev => prev.map(bet => 
              bet.id === id ? { ...bet, extraProfitCounted: true } : bet
            ));
          } catch (err) {
            console.error('Failed to update global stats with extra profit:', err);
          }
        }
      }
    }
  }, [isAuthenticated, bets]);

  const deleteBet = useCallback(async (id: string) => {
    // Optimistic update
    setBets(prev => prev.filter(bet => bet.id !== id));

    if (isAuthenticated) {
      try {
        const res = await fetch(`/api/bets?id=${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          console.error('Failed to delete bet from server');
          setSyncError('Failed to sync bet deletion');
        }
      } catch (err) {
        console.error('Failed to delete bet from server:', err);
        setSyncError('Failed to sync bet deletion');
      }
    }
  }, [isAuthenticated]);

  const clearAllBets = useCallback(async () => {
    // Optimistic update
    setBets([]);

    if (isAuthenticated) {
      try {
        const res = await fetch('/api/bets?clearAll=true', {
          method: 'DELETE',
        });

        if (!res.ok) {
          console.error('Failed to clear bets from server');
          setSyncError('Failed to sync bet clearing');
        }
      } catch (err) {
        console.error('Failed to clear bets from server:', err);
        setSyncError('Failed to sync bet clearing');
      }
    }
  }, [isAuthenticated]);

  // Function to manually sync with server
  const syncWithServer = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const res = await fetch('/api/bets');
      if (res.ok) {
        const data = await res.json();
        setBets(data.bets || []);
      } else {
        throw new Error('Failed to fetch bets');
      }
    } catch (err) {
      console.error('Failed to sync with server:', err);
      setSyncError('Failed to sync with server');
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated]);

  return {
    bets,
    isLoaded,
    isSyncing,
    syncError,
    isAuthenticated,
    addBet,
    updateBet,
    deleteBet,
    clearAllBets,
    syncWithServer,
  };
}
