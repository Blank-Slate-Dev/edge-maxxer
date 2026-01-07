// src/lib/arb/calculator.ts
import type {
  BookVsBookArb,
  BookVsBetfairArb,
  BookVsBookStakes,
  BookVsBetfairStakes,
} from '../types';

/**
 * Calculates optimal stake distribution for Book vs Book arbitrage.
 * Supports both 2-way and 3-way markets.
 * 
 * For n-outcome markets with decimal odds:
 * - Total stake T is distributed to equalize returns
 * - stake_i = T * (1/odds_i) / sum(1/odds_j)
 * 
 * @param arb The arbitrage opportunity
 * @param totalStake Total amount to distribute across bets
 * @returns Calculated stakes and expected returns
 */
export function calculateBookVsBookStakes(
  arb: BookVsBookArb,
  totalStake: number
): BookVsBookStakes {
  const o1 = arb.outcome1.odds;
  const o2 = arb.outcome2.odds;
  const o3 = arb.outcome3?.odds;
  
  // Implied probabilities (weights)
  const w1 = 1 / o1;
  const w2 = 1 / o2;
  const w3 = o3 ? 1 / o3 : 0;
  const totalWeight = w1 + w2 + w3;
  
  // Distribute stakes proportionally to implied probabilities
  const stake1 = totalStake * (w1 / totalWeight);
  const stake2 = totalStake * (w2 / totalWeight);
  const stake3 = o3 ? totalStake * (w3 / totalWeight) : undefined;
  
  // Calculate returns for each outcome
  const returnOnOutcome1 = stake1 * o1;
  const returnOnOutcome2 = stake2 * o2;
  const returnOnOutcome3 = stake3 && o3 ? stake3 * o3 : undefined;
  
  // Guaranteed profit (all outcomes should yield the same profit)
  const guaranteedProfit = returnOnOutcome1 - totalStake;
  const profitPercentage = (guaranteedProfit / totalStake) * 100;
  
  return {
    totalStake,
    stake1: roundToCents(stake1),
    stake2: roundToCents(stake2),
    stake3: stake3 !== undefined ? roundToCents(stake3) : undefined,
    guaranteedProfit: roundToCents(guaranteedProfit),
    profitPercentage: roundToDecimal(profitPercentage, 2),
    returnOnOutcome1: roundToCents(returnOnOutcome1),
    returnOnOutcome2: roundToCents(returnOnOutcome2),
    returnOnOutcome3: returnOnOutcome3 !== undefined ? roundToCents(returnOnOutcome3) : undefined,
  };
}

/**
 * Calculates optimal stake distribution for Book vs Betfair lay arbitrage.
 * 
 * The goal is to equalize profit regardless of outcome:
 * 
 * If back wins: profit = backStake * (backOdds - 1) - layLiability
 * If lay wins:  profit = layStake * (1 - commission) - backStake
 * 
 * Setting these equal and solving:
 * layStake = backStake * (backOdds - 1) / (layOdds - commission)
 * 
 * @param arb The arbitrage opportunity
 * @param backStake Amount to back at the bookmaker
 * @param commission Betfair commission rate (default from arb)
 * @returns Calculated stakes, liability, and expected returns
 */
export function calculateBookVsBetfairStakes(
  arb: BookVsBetfairArb,
  backStake: number,
  commission?: number
): BookVsBetfairStakes {
  const backOdds = arb.backOutcome.odds;
  const layOdds = arb.layOutcome.odds;
  const comm = commission ?? arb.commission;
  
  // Calculate lay stake to equalize outcomes
  // layStake = backStake * (backOdds - 1) / (layOdds - commission)
  const layStake = (backStake * (backOdds - 1)) / (layOdds - comm);
  
  // Lay liability = layStake * (layOdds - 1)
  const layLiability = layStake * (layOdds - 1);
  
  // Profit if back wins (bookmaker pays out)
  // = backStake * (backOdds - 1) - layLiability
  const profitIfBackWins = backStake * (backOdds - 1) - layLiability;
  
  // Profit if lay wins (we keep the lay stake minus commission)
  // = layStake * (1 - commission) - backStake
  const profitIfLayWins = layStake * (1 - comm) - backStake;
  
  // Guaranteed profit (should be equal for both outcomes)
  const guaranteedProfit = Math.min(profitIfBackWins, profitIfLayWins);
  
  // Calculate profit percentage based on total outlay (backStake + layLiability)
  const totalOutlay = backStake + layLiability;
  const profitPercentage = (guaranteedProfit / totalOutlay) * 100;
  
  return {
    backStake: roundToCents(backStake),
    layStake: roundToCents(layStake),
    layLiability: roundToCents(layLiability),
    commission: comm,
    profitIfBackWins: roundToCents(profitIfBackWins),
    profitIfLayWins: roundToCents(profitIfLayWins),
    guaranteedProfit: roundToCents(guaranteedProfit),
    profitPercentage: roundToDecimal(profitPercentage, 2),
  };
}

/**
 * Alternative calculation: given total outlay, calculate back and lay stakes.
 */
export function calculateBookVsBetfairFromTotal(
  arb: BookVsBetfairArb,
  totalOutlay: number,
  commission?: number
): BookVsBetfairStakes {
  const backOdds = arb.backOutcome.odds;
  const layOdds = arb.layOutcome.odds;
  const comm = commission ?? arb.commission;
  
  // Total outlay = backStake + layLiability
  // layLiability = layStake * (layOdds - 1)
  // layStake = backStake * (backOdds - 1) / (layOdds - comm)
  // 
  // So: totalOutlay = backStake + backStake * (backOdds - 1) / (layOdds - comm) * (layOdds - 1)
  // backStake = totalOutlay / (1 + (backOdds - 1) * (layOdds - 1) / (layOdds - comm))
  
  const layFactor = (backOdds - 1) * (layOdds - 1) / (layOdds - comm);
  const backStake = totalOutlay / (1 + layFactor);
  
  return calculateBookVsBetfairStakes(arb, backStake, comm);
}

/**
 * Validates that an arbitrage opportunity is still profitable.
 */
export function validateArbitrage(
  odds1: number,
  odds2: number
): { isValid: boolean; profitPct: number; impliedSum: number } {
  const impliedSum = (1 / odds1) + (1 / odds2);
  const isValid = impliedSum < 1;
  const profitPct = isValid ? (1 - impliedSum) * 100 : 0;
  
  return {
    isValid,
    profitPct: roundToDecimal(profitPct, 2),
    impliedSum: roundToDecimal(impliedSum, 4),
  };
}

/**
 * Validates Book vs Betfair arbitrage is still profitable.
 */
export function validateBetfairArbitrage(
  backOdds: number,
  layOdds: number,
  commission: number = 0.05
): { isValid: boolean; profitPct: number } {
  // For arb to exist: backOdds > layOdds accounting for commission
  const effectiveLayReturn = (layOdds - 1) * (1 - commission);
  const backReturn = backOdds - 1;
  
  const isValid = backReturn > effectiveLayReturn;
  const profitPct = isValid 
    ? ((backReturn - effectiveLayReturn) / backOdds) * 100 
    : 0;
  
  return {
    isValid,
    profitPct: roundToDecimal(profitPct, 2),
  };
}

// Utility functions
function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundToDecimal(value: number, places: number): number {
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

/**
 * Formats a stake calculation as copyable text.
 */
export function formatBookVsBookAsCopyText(
  arb: BookVsBookArb,
  stakes: BookVsBookStakes
): string {
  return `
Arbitrage Opportunity
=====================
Event: ${arb.event.homeTeam} vs ${arb.event.awayTeam}
Sport: ${arb.event.sportTitle}
Market: Head-to-Head

Bet 1: ${arb.outcome1.name} @ ${arb.outcome1.odds.toFixed(2)} (${arb.outcome1.bookmaker})
Stake: $${stakes.stake1.toFixed(2)}

Bet 2: ${arb.outcome2.name} @ ${arb.outcome2.odds.toFixed(2)} (${arb.outcome2.bookmaker})
Stake: $${stakes.stake2.toFixed(2)}

Total Stake: $${stakes.totalStake.toFixed(2)}
Guaranteed Profit: $${stakes.guaranteedProfit.toFixed(2)} (${stakes.profitPercentage.toFixed(2)}%)
`.trim();
}

/**
 * Formats Betfair stake calculation as copyable text.
 */
export function formatBookVsBetfairAsCopyText(
  arb: BookVsBetfairArb,
  stakes: BookVsBetfairStakes
): string {
  return `
Back/Lay Arbitrage Opportunity
==============================
Event: ${arb.event.homeTeam} vs ${arb.event.awayTeam}
Sport: ${arb.event.sportTitle}
Market: Head-to-Head

BACK: ${arb.backOutcome.name} @ ${arb.backOutcome.odds.toFixed(2)} (${arb.backOutcome.bookmaker})
Stake: $${stakes.backStake.toFixed(2)}

LAY: ${arb.layOutcome.name} @ ${arb.layOutcome.odds.toFixed(2)} (Betfair)
Stake: $${stakes.layStake.toFixed(2)}
Liability: $${stakes.layLiability.toFixed(2)}

Betfair Commission: ${(stakes.commission * 100).toFixed(1)}%
Guaranteed Profit: $${stakes.guaranteedProfit.toFixed(2)} (${stakes.profitPercentage.toFixed(2)}%)
`.trim();
}
