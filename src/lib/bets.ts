// src/lib/bets.ts

export interface PlacedBet {
  id: string;
  createdAt: string;
  event: {
    homeTeam: string;
    awayTeam: string;
    sportKey: string;
    commenceTime: string;
  };
  mode: 'book-vs-book' | 'book-vs-betfair' | 'value-bet';
  // Book vs Book (2-way or 3-way)
  bet1?: {
    bookmaker: string;
    outcome: string;
    odds: number;
    stake: number;
  };
  bet2?: {
    bookmaker: string;
    outcome: string;
    odds: number;
    stake: number;
  };
  bet3?: { // For 3-way markets
    bookmaker: string;
    outcome: string;
    odds: number;
    stake: number;
  };
  // Book vs Betfair
  backBet?: {
    bookmaker: string;
    outcome: string;
    odds: number;
    stake: number;
  };
  layBet?: {
    odds: number;
    stake: number;
    liability: number;
  };
  expectedProfit: number;
  status: 'pending' | 'won' | 'lost' | 'partial';
  actualProfit?: number;
  notes?: string;
}

export interface BetStats {
  totalBets: number;
  totalStaked: number;
  totalExpectedProfit: number;
  totalActualProfit: number;
  winRate: number;
  pendingBets: number;
  completedBets: number;
  avgProfitPerBet: number;
  roi: number;
}

export function calculateBetStats(bets: PlacedBet[]): BetStats {
  const completedBets = bets.filter(b => b.status !== 'pending');
  const pendingBets = bets.filter(b => b.status === 'pending');
  const wonBets = bets.filter(b => b.status === 'won');
  
  let totalStaked = 0;
  let totalExpectedProfit = 0;
  let totalActualProfit = 0;

  bets.forEach(bet => {
    if (bet.mode === 'book-vs-book' && bet.bet1 && bet.bet2) {
      totalStaked += bet.bet1.stake + bet.bet2.stake;
      if (bet.bet3) {
        totalStaked += bet.bet3.stake;
      }
    } else if (bet.mode === 'value-bet' && bet.bet1) {
      totalStaked += bet.bet1.stake;
    } else if (bet.backBet && bet.layBet) {
      totalStaked += bet.backBet.stake + bet.layBet.liability;
    }
    totalExpectedProfit += bet.expectedProfit;
    if (bet.actualProfit !== undefined) {
      totalActualProfit += bet.actualProfit;
    }
  });

  return {
    totalBets: bets.length,
    totalStaked,
    totalExpectedProfit,
    totalActualProfit,
    winRate: completedBets.length > 0 ? (wonBets.length / completedBets.length) * 100 : 0,
    pendingBets: pendingBets.length,
    completedBets: completedBets.length,
    avgProfitPerBet: completedBets.length > 0 ? totalActualProfit / completedBets.length : 0,
    roi: totalStaked > 0 ? (totalActualProfit / totalStaked) * 100 : 0,
  };
}

export function generateBetId(): string {
  return `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
