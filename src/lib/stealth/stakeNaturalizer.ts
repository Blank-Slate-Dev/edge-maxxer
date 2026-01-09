// src/lib/stealth/stakeNaturalizer.ts

import { getBookmakerProfile, BookmakerProfile } from './bookmakerProfiles';

export interface NaturalizedStake {
  original: number;
  naturalized: number;
  difference: number;
  differencePercent: number;
  strategy: string;
  warning: string | null;
}

export interface StakeNaturalizationOptions {
  bookmaker: string;
  targetStake: number;
  allowHigher?: boolean; // Allow rounding up (uses more capital)
  maxDeviation?: number; // Max % deviation from target (default 10%)
  forceRound?: boolean; // Force to round number even if close
}

/**
 * Rounds a stake to look natural based on bookmaker risk level
 * 
 * Key principles from research:
 * - Precise amounts like $47.83 are immediate red flags
 * - Recreational bettors use round numbers ($20, $25, $50, $100)
 * - Some variation is natural (not always exactly $50)
 * - Higher risk bookmakers need more conservative rounding
 */
export function naturalizeStake(options: StakeNaturalizationOptions): NaturalizedStake {
  const { bookmaker, targetStake, allowHigher = true, maxDeviation = 10, forceRound = false } = options;
  
  const profile = getBookmakerProfile(bookmaker);
  const strategy = profile?.stakeStrategy || 'moderate';
  
  let naturalized: number;
  let strategyUsed: string;
  
  // Get rounding targets based on stake size and strategy
  const roundingTargets = getRoundingTargets(targetStake, strategy);
  
  // Find the closest natural amount
  let closestBelow = roundingTargets.filter(t => t <= targetStake).pop() || roundingTargets[0];
  let closestAbove = roundingTargets.find(t => t >= targetStake) || roundingTargets[roundingTargets.length - 1];
  
  // Calculate deviations
  const deviationBelow = ((targetStake - closestBelow) / targetStake) * 100;
  const deviationAbove = ((closestAbove - targetStake) / targetStake) * 100;
  
  // Choose based on strategy and allowed deviation
  if (allowHigher && deviationAbove <= maxDeviation && deviationAbove < deviationBelow) {
    naturalized = closestAbove;
    strategyUsed = `Rounded up to ${formatStake(closestAbove)}`;
  } else if (deviationBelow <= maxDeviation) {
    naturalized = closestBelow;
    strategyUsed = `Rounded down to ${formatStake(closestBelow)}`;
  } else if (allowHigher && deviationAbove <= maxDeviation * 1.5) {
    // Allow slightly higher deviation if rounding up
    naturalized = closestAbove;
    strategyUsed = `Rounded up to ${formatStake(closestAbove)} (slight over-deviation)`;
  } else {
    // If we can't get close enough, use a "friendly odd" number
    naturalized = friendlyOddRound(targetStake, strategy);
    strategyUsed = `Friendly odd round to ${formatStake(naturalized)}`;
  }
  
  // Add small random variation for moderate/aggressive strategies
  if (strategy !== 'conservative' && !forceRound) {
    naturalized = addNaturalVariation(naturalized, strategy);
    strategyUsed += ' + variation';
  }
  
  const difference = naturalized - targetStake;
  const differencePercent = (difference / targetStake) * 100;
  
  // Generate warning if significant deviation
  let warning: string | null = null;
  if (Math.abs(differencePercent) > 15) {
    warning = `Large deviation (${differencePercent.toFixed(1)}%) may significantly affect profit`;
  } else if (naturalized > targetStake * 1.1) {
    warning = `Rounding up increases stake by ${differencePercent.toFixed(1)}%`;
  }
  
  return {
    original: targetStake,
    naturalized: Math.round(naturalized * 100) / 100, // Ensure 2 decimal places max
    difference: Math.round(difference * 100) / 100,
    differencePercent: Math.round(differencePercent * 100) / 100,
    strategy: strategyUsed,
    warning,
  };
}

/**
 * Get appropriate rounding targets based on stake size and strategy
 */
function getRoundingTargets(stake: number, strategy: string): number[] {
  // Define natural betting amounts at different ranges
  const targets: number[] = [];
  
  // Small stakes ($1-$30)
  if (stake <= 30) {
    if (strategy === 'conservative') {
      targets.push(5, 10, 15, 20, 25, 30);
    } else {
      targets.push(5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30);
    }
  }
  // Medium stakes ($30-$100)
  else if (stake <= 100) {
    if (strategy === 'conservative') {
      targets.push(30, 40, 50, 60, 70, 75, 80, 90, 100);
    } else {
      targets.push(30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100);
    }
  }
  // Larger stakes ($100-$500)
  else if (stake <= 500) {
    if (strategy === 'conservative') {
      targets.push(100, 150, 200, 250, 300, 350, 400, 450, 500);
    } else {
      targets.push(100, 120, 125, 150, 175, 200, 220, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500);
    }
  }
  // Large stakes ($500+)
  else {
    if (strategy === 'conservative') {
      // Round to nearest $100
      for (let i = 500; i <= Math.ceil(stake / 100) * 100 + 200; i += 100) {
        targets.push(i);
      }
    } else {
      // Round to nearest $50
      for (let i = 500; i <= Math.ceil(stake / 50) * 50 + 100; i += 50) {
        targets.push(i);
      }
    }
  }
  
  return targets;
}

/**
 * Round to a "friendly odd" number when standard rounding doesn't work
 * These are amounts that look like someone picked a number, not a calculator
 */
function friendlyOddRound(stake: number, strategy: string): number {
  // Friendly endings that look human-picked
  const friendlyEndings = strategy === 'conservative' 
    ? [0, 5] // Only .00 and .50 for conservative
    : [0, 5, 2, 8]; // Include .20, .50, .80 etc for others
  
  if (stake < 50) {
    // Round to nearest whole number with friendly ending
    const base = Math.round(stake);
    const lastDigit = base % 10;
    const closest = friendlyEndings.reduce((a, b) => 
      Math.abs(b - lastDigit) < Math.abs(a - lastDigit) ? b : a
    );
    return Math.floor(base / 10) * 10 + closest;
  } else if (stake < 200) {
    // Round to nearest $5
    return Math.round(stake / 5) * 5;
  } else {
    // Round to nearest $10 or $25
    const interval = strategy === 'conservative' ? 25 : 10;
    return Math.round(stake / interval) * interval;
  }
}

/**
 * Add small natural variation to avoid always betting exact round numbers
 * This mimics real casual betting behavior
 */
function addNaturalVariation(stake: number, strategy: string): number {
  // Don't add variation to very small stakes
  if (stake < 20) return stake;
  
  // Random chance to add variation (60% of the time for aggressive, 30% for moderate)
  const variationChance = strategy === 'aggressive' ? 0.6 : 0.3;
  if (Math.random() > variationChance) return stake;
  
  // Possible variations based on stake size
  let variations: number[];
  
  if (stake <= 50) {
    variations = [-3, -2, -1, 1, 2, 3];
  } else if (stake <= 100) {
    variations = [-5, -3, -2, 2, 3, 5];
  } else if (stake <= 300) {
    variations = [-10, -5, 5, 10];
  } else {
    variations = [-25, -15, -10, 10, 15, 25];
  }
  
  // Pick a random variation
  const variation = variations[Math.floor(Math.random() * variations.length)];
  
  // Ensure result is positive and reasonable
  const result = stake + variation;
  return result > 0 ? result : stake;
}

/**
 * Format stake for display
 */
function formatStake(stake: number): string {
  return `$${stake.toFixed(stake % 1 === 0 ? 0 : 2)}`;
}

/**
 * Naturalize both stakes for a 2-way arb
 */
export function naturalizeArbStakes(
  stake1: number,
  stake2: number,
  bookmaker1: string,
  bookmaker2: string,
  totalStake: number
): {
  stake1: NaturalizedStake;
  stake2: NaturalizedStake;
  totalNaturalized: number;
  totalDifference: number;
  profitImpact: string;
} {
  // Naturalize each stake
  const nat1 = naturalizeStake({ bookmaker: bookmaker1, targetStake: stake1 });
  const nat2 = naturalizeStake({ bookmaker: bookmaker2, targetStake: stake2 });
  
  const totalNaturalized = nat1.naturalized + nat2.naturalized;
  const totalDifference = totalNaturalized - totalStake;
  
  // Calculate approximate profit impact
  // Assuming ~2% profit margin, extra stake reduces effective return
  const profitImpactPercent = (totalDifference / totalStake) * 100;
  let profitImpact: string;
  
  if (Math.abs(profitImpactPercent) < 1) {
    profitImpact = 'Minimal impact on profit';
  } else if (profitImpactPercent > 0) {
    profitImpact = `Using ${profitImpactPercent.toFixed(1)}% more capital`;
  } else {
    profitImpact = `Using ${Math.abs(profitImpactPercent).toFixed(1)}% less capital (may affect returns)`;
  }
  
  return {
    stake1: nat1,
    stake2: nat2,
    totalNaturalized,
    totalDifference,
    profitImpact,
  };
}

/**
 * Naturalize stakes for a 3-way arb (soccer, boxing with draw)
 */
export function naturalize3WayArbStakes(
  stake1: number,
  stake2: number,
  stake3: number,
  bookmaker1: string,
  bookmaker2: string,
  bookmaker3: string,
  totalStake: number
): {
  stake1: NaturalizedStake;
  stake2: NaturalizedStake;
  stake3: NaturalizedStake;
  totalNaturalized: number;
  totalDifference: number;
  profitImpact: string;
} {
  const nat1 = naturalizeStake({ bookmaker: bookmaker1, targetStake: stake1 });
  const nat2 = naturalizeStake({ bookmaker: bookmaker2, targetStake: stake2 });
  const nat3 = naturalizeStake({ bookmaker: bookmaker3, targetStake: stake3 });
  
  const totalNaturalized = nat1.naturalized + nat2.naturalized + nat3.naturalized;
  const totalDifference = totalNaturalized - totalStake;
  
  const profitImpactPercent = (totalDifference / totalStake) * 100;
  let profitImpact: string;
  
  if (Math.abs(profitImpactPercent) < 1) {
    profitImpact = 'Minimal impact on profit';
  } else if (profitImpactPercent > 0) {
    profitImpact = `Using ${profitImpactPercent.toFixed(1)}% more capital`;
  } else {
    profitImpact = `Using ${Math.abs(profitImpactPercent).toFixed(1)}% less capital`;
  }
  
  return {
    stake1: nat1,
    stake2: nat2,
    stake3: nat3,
    totalNaturalized,
    totalDifference,
    profitImpact,
  };
}

/**
 * Check if a stake looks suspicious (calculator-generated)
 */
export function isSuspiciousStake(stake: number): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Check for too many decimal places
  const decimalPlaces = (stake.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    reasons.push('More than 2 decimal places');
  } else if (decimalPlaces === 2 && stake % 0.25 !== 0) {
    reasons.push('Unusual cents value (not .00, .25, .50, .75)');
  }
  
  // Check for calculator-like precision
  if (stake > 10 && stake % 1 !== 0 && stake % 5 !== 0) {
    const cents = Math.round((stake % 1) * 100);
    if (![0, 25, 50, 75, 20, 80].includes(cents)) {
      reasons.push(`Unusual amount: $${stake.toFixed(2)} looks calculated`);
    }
  }
  
  // Check for obviously calculated amounts
  if (stake > 20 && stake < 1000) {
    // Numbers like $47.83, $123.45 are suspicious
    if (stake % 1 !== 0 && stake % 5 !== 0 && stake % 10 !== 0) {
      reasons.push('Non-round amount in typical betting range');
    }
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}
