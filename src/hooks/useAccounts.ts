// src/hooks/useAccounts.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BookmakerAccount, Transaction } from '@/lib/accounts';

const ACCOUNTS_KEY = 'edge-maxxer-accounts';
const TRANSACTIONS_KEY = 'edge-maxxer-transactions';

export function useAccounts() {
  const [accounts, setAccounts] = useState<BookmakerAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedAccounts = localStorage.getItem(ACCOUNTS_KEY);
      const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
      
      if (storedAccounts) {
        setAccounts(JSON.parse(storedAccounts));
      }
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
    } catch (err) {
      console.error('Failed to load accounts from localStorage:', err);
    }
    setIsLoaded(true);
  }, []);

  // Save accounts to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }
  }, [accounts, isLoaded]);

  // Save transactions to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isLoaded]);

  const addAccount = useCallback((account: BookmakerAccount) => {
    setAccounts(prev => [...prev, account]);
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<BookmakerAccount>) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === id ? { ...acc, ...updates } : acc
    ));
  }, []);

  const removeAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  }, []);

  const toggleAccount = useCallback((bookmaker: string) => {
    setAccounts(prev => {
      const existing = prev.find(acc => acc.bookmaker === bookmaker);
      if (existing) {
        // Toggle active state
        return prev.map(acc => 
          acc.bookmaker === bookmaker 
            ? { ...acc, isActive: !acc.isActive }
            : acc
        );
      } else {
        // Add new account
        return [...prev, {
          id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          bookmaker,
          isActive: true,
          createdAt: new Date().toISOString(),
        }];
      }
    });
  }, []);

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(txn =>
      txn.id === id ? { ...txn, ...updates } : txn
    ));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(txn => txn.id !== id));
  }, []);

  const getActiveBookmakers = useCallback(() => {
    return accounts.filter(acc => acc.isActive).map(acc => acc.bookmaker);
  }, [accounts]);

  const isBookmakerActive = useCallback((bookmaker: string) => {
    const account = accounts.find(acc => acc.bookmaker === bookmaker);
    return account?.isActive ?? false;
  }, [accounts]);

  const clearAllData = useCallback(() => {
    setAccounts([]);
    setTransactions([]);
  }, []);

  return {
    accounts,
    transactions,
    isLoaded,
    addAccount,
    updateAccount,
    removeAccount,
    toggleAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getActiveBookmakers,
    isBookmakerActive,
    clearAllData,
  };
}
