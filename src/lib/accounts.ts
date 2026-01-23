// src/lib/accounts.ts

import { BOOKMAKERS as ALL_BOOKMAKERS, getBookmakersByDisplayRegion, type DisplayRegion } from './bookmakers';

export interface BookmakerAccount {
  id: string;
  bookmaker: string;
  isActive: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  bookmaker: string;
  type: 'deposit' | 'withdrawal' | 'bonus';
  amount: number;
  note?: string;
  createdAt: string;
}

export interface AccountSummary {
  bookmaker: string;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBonuses: number;
  netPosition: number; // deposits - withdrawals + bonuses
  transactionCount: number;
}

// Legacy BOOKMAKERS export for backward compatibility (defaults to AU)
// Components should prefer getBookmakersForRegion() for region-aware lists
export const BOOKMAKERS = ALL_BOOKMAKERS
  .filter(b => b.region === 'AU')
  .map(b => ({ key: b.key, name: b.name }));

/**
 * Get bookmakers for a specific region
 * Returns array of { key, name } for use in AccountsManager
 */
export function getBookmakersForRegion(region: DisplayRegion): { key: string; name: string }[] {
  const bookmakers = getBookmakersByDisplayRegion(region);
  return bookmakers.map(b => ({ key: b.key, name: b.name }));
}

/**
 * Get bookmaker display name by key
 * Searches all bookmakers regardless of region
 */
export function getBookmakerName(key: string): string {
  const bookmaker = ALL_BOOKMAKERS.find(b => b.key === key);
  return bookmaker?.name || key;
}

export function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateAccountId(): string {
  return `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function calculateAccountSummaries(
  accounts: BookmakerAccount[],
  transactions: Transaction[]
): AccountSummary[] {
  const summaries: Map<string, AccountSummary> = new Map();

  // Initialize with active accounts
  for (const account of accounts) {
    if (account.isActive) {
      summaries.set(account.bookmaker, {
        bookmaker: account.bookmaker,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalBonuses: 0,
        netPosition: 0,
        transactionCount: 0,
      });
    }
  }

  // Sum up transactions
  for (const txn of transactions) {
    let summary = summaries.get(txn.bookmaker);
    if (!summary) {
      summary = {
        bookmaker: txn.bookmaker,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalBonuses: 0,
        netPosition: 0,
        transactionCount: 0,
      };
      summaries.set(txn.bookmaker, summary);
    }

    summary.transactionCount++;

    switch (txn.type) {
      case 'deposit':
        summary.totalDeposits += txn.amount;
        summary.netPosition -= txn.amount; // Money out of your pocket
        break;
      case 'withdrawal':
        summary.totalWithdrawals += txn.amount;
        summary.netPosition += txn.amount; // Money back to you
        break;
      case 'bonus':
        summary.totalBonuses += txn.amount;
        break;
    }
  }

  return Array.from(summaries.values()).sort((a, b) => 
    a.bookmaker.localeCompare(b.bookmaker)
  );
}

export function getTotalBankroll(summaries: AccountSummary[]): {
  totalDeposited: number;
  totalWithdrawn: number;
  netProfit: number;
} {
  let totalDeposited = 0;
  let totalWithdrawn = 0;

  for (const s of summaries) {
    totalDeposited += s.totalDeposits;
    totalWithdrawn += s.totalWithdrawals;
  }

  return {
    totalDeposited,
    totalWithdrawn,
    netProfit: totalWithdrawn - totalDeposited,
  };
}
