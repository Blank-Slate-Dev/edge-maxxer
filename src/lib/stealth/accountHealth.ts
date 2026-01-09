// src/lib/stealth/accountHealth.ts

import { getBookmakerProfile, BookmakerProfile } from './bookmakerProfiles';

export interface BetRecord {
  id: string;
  bookmaker: string;
  stake: number;
  odds: number;
  market: string;
  sport: string;
  isMugBet: boolean;
  isPromo: boolean;
  placedAt: Date;
  result?: 'win' | 'loss' | 'push' | 'pending';
  profit?: number;
  closingOdds?: number; // For CLV calculation
}

export interface AccountHealthMetrics {
  bookmaker: string;
  totalBets: number;
  totalStaked: number;
  totalProfit: number;
  winRate: number;
  avgStake: number;
  mugBetRatio: number; // % of bets that are mug bets
  promoBetRatio: number;
  avgCLV: number; // Closing line value (negative = beating the line)
  riskScore: number; // 0-100, higher = more likely to be limited
  warnings: string[];
  recommendations: string[];
  healthStatus: 'healthy' | 'caution' | 'at-risk' | 'critical';
}

export interface AccountHealthStorage {
  bets: BetRecord[];
  lastUpdated: Date;
}

const STORAGE_KEY = 'edge-maxxer-account-health';

/**
 * Get all stored bet records
 */
export function getBetHistory(): BetRecord[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const data: AccountHealthStorage = JSON.parse(stored);
    return data.bets.map(bet => ({
      ...bet,
      placedAt: new Date(bet.placedAt),
    }));
  } catch {
    return [];
  }
}

/**
 * Save bet records to storage
 */
function saveBetHistory(bets: BetRecord[]): void {
  if (typeof window === 'undefined') return;
  
  const data: AccountHealthStorage = {
    bets,
    lastUpdated: new Date(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Add a new bet record
 */
export function recordBet(bet: Omit<BetRecord, 'id' | 'placedAt'>): BetRecord {
  const bets = getBetHistory();
  
  const newBet: BetRecord = {
    ...bet,
    id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    placedAt: new Date(),
  };
  
  bets.push(newBet);
  saveBetHistory(bets);
  
  return newBet;
}

/**
 * Update a bet result
 */
export function updateBetResult(
  betId: string, 
  result: 'win' | 'loss' | 'push',
  profit: number,
  closingOdds?: number
): void {
  const bets = getBetHistory();
  const betIndex = bets.findIndex(b => b.id === betId);
  
  if (betIndex !== -1) {
    bets[betIndex].result = result;
    bets[betIndex].profit = profit;
    if (closingOdds !== undefined) {
      bets[betIndex].closingOdds = closingOdds;
    }
    saveBetHistory(bets);
  }
}

/**
 * Calculate account health metrics for a specific bookmaker
 */
export function getAccountHealth(bookmaker: string): AccountHealthMetrics {
  const allBets = getBetHistory();
  const bets = allBets.filter(b => 
    b.bookmaker.toLowerCase().replace(/[^a-z0-9]/g, '') === 
    bookmaker.toLowerCase().replace(/[^a-z0-9]/g, '')
  );
  
  const profile = getBookmakerProfile(bookmaker);
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Basic metrics
  const totalBets = bets.length;
  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const settledBets = bets.filter(b => b.result && b.result !== 'pending');
  const totalProfit = settledBets.reduce((sum, b) => sum + (b.profit || 0), 0);
  const wins = settledBets.filter(b => b.result === 'win').length;
  const winRate = settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0;
  const avgStake = totalBets > 0 ? totalStaked / totalBets : 0;
  
  // Mug bet ratio
  const mugBets = bets.filter(b => b.isMugBet).length;
  const mugBetRatio = totalBets > 0 ? (mugBets / totalBets) * 100 : 0;
  
  // Promo bet ratio
  const promoBets = bets.filter(b => b.isPromo).length;
  const promoBetRatio = totalBets > 0 ? (promoBets / totalBets) * 100 : 0;
  
  // CLV calculation (closing line value)
  const betsWithCLV = bets.filter(b => b.closingOdds !== undefined);
  let avgCLV = 0;
  if (betsWithCLV.length > 0) {
    const totalCLV = betsWithCLV.reduce((sum, b) => {
      // CLV = (your odds / closing odds - 1) * 100
      // Negative CLV means you beat the closing line
      const clv = ((b.odds / (b.closingOdds || b.odds)) - 1) * 100;
      return sum + clv;
    }, 0);
    avgCLV = totalCLV / betsWithCLV.length;
  }
  
  // Calculate risk score
  let riskScore = 0;
  
  // Win rate contribution (high win rate = suspicious)
  if (winRate > 60) riskScore += 15;
  if (winRate > 70) riskScore += 20;
  if (winRate > 80) riskScore += 25;
  
  // Profit contribution
  if (totalProfit > 500) riskScore += 10;
  if (totalProfit > 2000) riskScore += 15;
  if (totalProfit > 5000) riskScore += 20;
  
  // Low mug bet ratio is suspicious
  if (mugBetRatio < 20 && totalBets > 10) riskScore += 20;
  if (mugBetRatio < 10 && totalBets > 10) riskScore += 15;
  
  // High promo bet ratio is suspicious
  if (promoBetRatio > 50) riskScore += 15;
  if (promoBetRatio > 75) riskScore += 15;
  
  // CLV contribution (beating closing line is very suspicious)
  if (avgCLV < -2) riskScore += 15;
  if (avgCLV < -5) riskScore += 20;
  
  // Adjust based on bookmaker risk level
  if (profile) {
    if (profile.riskLevel === 'extreme') riskScore *= 1.5;
    else if (profile.riskLevel === 'high') riskScore *= 1.25;
    else if (profile.riskLevel === 'low') riskScore *= 0.5;
  }
  
  // Cap at 100
  riskScore = Math.min(100, Math.round(riskScore));
  
  // Generate warnings
  if (winRate > 65 && settledBets.length >= 10) {
    warnings.push(`High win rate (${winRate.toFixed(1)}%) - bookmakers track this`);
  }
  
  if (mugBetRatio < 25 && totalBets >= 10) {
    warnings.push(`Low mug bet ratio (${mugBetRatio.toFixed(1)}%) - need more recreational bets`);
  }
  
  if (avgCLV < -3) {
    warnings.push(`Consistently beating closing line (${avgCLV.toFixed(2)}% CLV) - major red flag`);
  }
  
  if (promoBetRatio > 60) {
    warnings.push(`High promo usage (${promoBetRatio.toFixed(1)}%) - looks like bonus abuse`);
  }
  
  if (totalProfit > 2000 && profile?.riskLevel === 'extreme') {
    warnings.push(`$${totalProfit.toFixed(0)} profit on ${profile.name} - limiting likely imminent`);
  }
  
  // Generate recommendations
  if (mugBetRatio < 30) {
    recommendations.push('Place more mug bets on popular favorites');
  }
  
  if (profile?.riskLevel === 'extreme' && totalBets > 20) {
    recommendations.push('Consider reducing activity on this account');
  }
  
  if (winRate > 60) {
    recommendations.push('Mix in some intentional small losing bets on favorites');
  }
  
  if (avgCLV < -2) {
    recommendations.push('Avoid taking odds that are significantly higher than market average');
  }
  
  // Determine health status
  let healthStatus: AccountHealthMetrics['healthStatus'];
  if (riskScore >= 75) healthStatus = 'critical';
  else if (riskScore >= 50) healthStatus = 'at-risk';
  else if (riskScore >= 25) healthStatus = 'caution';
  else healthStatus = 'healthy';
  
  return {
    bookmaker,
    totalBets,
    totalStaked,
    totalProfit,
    winRate,
    avgStake,
    mugBetRatio,
    promoBetRatio,
    avgCLV,
    riskScore,
    warnings,
    recommendations,
    healthStatus,
  };
}

/**
 * Get health status color
 */
export function getHealthStatusColor(status: AccountHealthMetrics['healthStatus']): string {
  switch (status) {
    case 'healthy': return '#22c55e';
    case 'caution': return '#eab308';
    case 'at-risk': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#888888';
  }
}

/**
 * Get all bookmakers with bet history
 */
export function getTrackedBookmakers(): string[] {
  const bets = getBetHistory();
  const bookmakers = new Set(bets.map(b => b.bookmaker));
  return Array.from(bookmakers);
}

/**
 * Get overall account health across all bookmakers
 */
export function getOverallHealth(): {
  totalBets: number;
  totalProfit: number;
  bookmakerStatuses: { bookmaker: string; status: AccountHealthMetrics['healthStatus']; riskScore: number }[];
  overallStatus: AccountHealthMetrics['healthStatus'];
} {
  const bookmakers = getTrackedBookmakers();
  const statuses = bookmakers.map(b => {
    const health = getAccountHealth(b);
    return {
      bookmaker: b,
      status: health.healthStatus,
      riskScore: health.riskScore,
    };
  });
  
  const bets = getBetHistory();
  const totalBets = bets.length;
  const totalProfit = bets
    .filter(b => b.result && b.result !== 'pending')
    .reduce((sum, b) => sum + (b.profit || 0), 0);
  
  // Overall status is the worst individual status
  let overallStatus: AccountHealthMetrics['healthStatus'] = 'healthy';
  if (statuses.some(s => s.status === 'critical')) overallStatus = 'critical';
  else if (statuses.some(s => s.status === 'at-risk')) overallStatus = 'at-risk';
  else if (statuses.some(s => s.status === 'caution')) overallStatus = 'caution';
  
  return {
    totalBets,
    totalProfit,
    bookmakerStatuses: statuses,
    overallStatus,
  };
}

/**
 * Clear all bet history
 */
export function clearBetHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export bet history as JSON
 */
export function exportBetHistory(): string {
  const bets = getBetHistory();
  return JSON.stringify(bets, null, 2);
}

/**
 * Import bet history from JSON
 */
export function importBetHistory(json: string): number {
  try {
    const imported = JSON.parse(json) as BetRecord[];
    const existing = getBetHistory();
    
    // Merge, avoiding duplicates
    const existingIds = new Set(existing.map(b => b.id));
    const newBets = imported.filter(b => !existingIds.has(b.id));
    
    const merged = [...existing, ...newBets];
    saveBetHistory(merged);
    
    return newBets.length;
  } catch {
    throw new Error('Invalid JSON format');
  }
}
