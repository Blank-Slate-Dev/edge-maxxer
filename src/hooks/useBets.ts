// src/hooks/useBets.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PlacedBet } from '@/lib/bets';
import { generateBetId } from '@/lib/bets';

const STORAGE_KEY = 'edge-maxxer-bets';

// Type for new bets without id and createdAt (these are generated internally)
type NewBet = Omit<PlacedBet, 'id' | 'createdAt'>;

export function useBets() {
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBets(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load bets from localStorage:', err);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever bets change
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
    };

    setBets(prev => [bet, ...prev]);

    // Update global profit counter (webhook)
    if (bet.expectedProfit > 0) {
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
  }, []);

  const updateBet = useCallback((id: string, updates: Partial<PlacedBet>) => {
    setBets(prev => prev.map(bet => 
      bet.id === id ? { ...bet, ...updates } : bet
    ));
  }, []);

  const deleteBet = useCallback((id: string) => {
    setBets(prev => prev.filter(bet => bet.id !== id));
  }, []);

  const clearAllBets = useCallback(() => {
    setBets([]);
  }, []);

  return {
    bets,
    isLoaded,
    addBet,
    updateBet,
    deleteBet,
    clearAllBets,
  };
}
