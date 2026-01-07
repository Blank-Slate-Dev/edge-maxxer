// src/lib/accounts.ts

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

// All Australian bookmakers
export const BOOKMAKERS = [
  { key: 'sportsbet', name: 'Sportsbet' },
  { key: 'tab', name: 'TAB' },
  { key: 'pointsbet', name: 'PointsBet' },
  { key: 'unibet', name: 'Unibet' },
  { key: 'neds', name: 'Neds' },
  { key: 'ladbrokes', name: 'Ladbrokes' },
  { key: 'betfair', name: 'Betfair' },
  { key: 'bet365', name: 'Bet365' },
  { key: 'bluebet', name: 'BlueBet' },
  { key: 'topsport', name: 'TopSport' },
  { key: 'betr', name: 'Betr' },
  { key: 'playup', name: 'PlayUp' },
  { key: 'betright', name: 'BetRight' },
  { key: 'palmerbet', name: 'Palmerbet' },
  { key: 'boombet', name: 'Boombet' },
  { key: 'betm', name: 'BetM' },
  { key: 'dabble', name: 'Dabble' },
  { key: 'picklebet', name: 'Picklebet' },
  { key: '1xbet', name: '1xBet' },
  { key: 'matchbook', name: 'Matchbook' },
  { key: 'pinnacle', name: 'Pinnacle' },
] as const;

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
