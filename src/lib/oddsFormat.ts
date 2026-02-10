// src/lib/oddsFormat.ts
// Odds conversion utilities for regional display formats

import type { UserRegion } from './config';

export type OddsFormat = 'american' | 'decimal' | 'fractional';

// Map regions to their preferred odds format
export const REGION_ODDS_FORMAT: Record<UserRegion, OddsFormat> = {
  US: 'american',
  AU: 'decimal',
  EU: 'decimal',
  UK: 'fractional',
};

/**
 * Convert American odds to Decimal odds
 * American +150 → Decimal 2.50
 * American -110 → Decimal 1.91
 */
export function americanToDecimal(american: number): number {
  if (american > 0) {
    return (american / 100) + 1;
  } else {
    return (100 / Math.abs(american)) + 1;
  }
}

/**
 * Convert Decimal odds to American odds
 * Decimal 2.50 → American +150
 * Decimal 1.91 → American -110
 */
export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2.0) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

/**
 * Convert Decimal odds to Fractional odds string
 * Decimal 2.50 → "3/2"
 * Decimal 1.91 → "10/11"
 */
export function decimalToFractional(decimal: number): string {
  const decimalPart = decimal - 1;
  
  // Common fractional odds lookup for cleaner display
  const commonFractions: Record<string, string> = {
    '0.1': '1/10',
    '0.2': '1/5',
    '0.25': '1/4',
    '0.33': '1/3',
    '0.4': '2/5',
    '0.5': '1/2',
    '0.57': '4/7',
    '0.6': '3/5',
    '0.67': '2/3',
    '0.73': '8/11',
    '0.8': '4/5',
    '0.83': '5/6',
    '0.91': '10/11',
    '1': '1/1',
    '1.1': '11/10',
    '1.2': '6/5',
    '1.33': '4/3',
    '1.4': '7/5',
    '1.5': '3/2',
    '1.6': '8/5',
    '1.67': '5/3',
    '1.8': '9/5',
    '1.83': '11/6',
    '2': '2/1',
    '2.25': '9/4',
    '2.5': '5/2',
    '2.75': '11/4',
    '3': '3/1',
    '3.5': '7/2',
    '4': '4/1',
    '4.5': '9/2',
    '5': '5/1',
    '6': '6/1',
    '7': '7/1',
    '8': '8/1',
    '9': '9/1',
    '10': '10/1',
  };

  // Check for common fractions first (with some tolerance)
  for (const [key, fraction] of Object.entries(commonFractions)) {
    if (Math.abs(decimalPart - parseFloat(key)) < 0.03) {
      return fraction;
    }
  }

  // Calculate GCD for simplifying fractions
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  
  // Convert to fraction with reasonable precision
  const precision = 100;
  const numerator = Math.round(decimalPart * precision);
  const denominator = precision;
  const divisor = gcd(numerator, denominator);
  
  const simplifiedNum = numerator / divisor;
  const simplifiedDen = denominator / divisor;
  
  // If denominator is 1, just show the numerator
  if (simplifiedDen === 1) {
    return `${simplifiedNum}/1`;
  }
  
  return `${simplifiedNum}/${simplifiedDen}`;
}

/**
 * Convert American odds to Fractional odds string
 */
export function americanToFractional(american: number): string {
  const decimal = americanToDecimal(american);
  return decimalToFractional(decimal);
}

/**
 * Format odds for display based on region
 * @param odds - The odds value
 * @param region - The user's region
 * @param inputFormat - The format of the input odds (default: 'american')
 */
export function formatOddsForRegion(
  odds: number,
  region: UserRegion,
  inputFormat: OddsFormat = 'american'
): string {
  const targetFormat = REGION_ODDS_FORMAT[region];
  
  // First convert to decimal as intermediate format
  let decimalOdds: number;
  if (inputFormat === 'decimal') {
    decimalOdds = odds;
  } else if (inputFormat === 'american') {
    decimalOdds = americanToDecimal(odds);
  } else {
    // Fractional input not commonly needed
    decimalOdds = odds;
  }
  
  // Now convert to target format
  switch (targetFormat) {
    case 'american':
      const american = inputFormat === 'american' ? odds : decimalToAmerican(decimalOdds);
      return american > 0 ? `+${american}` : `${american}`;
    
    case 'decimal':
      return decimalOdds.toFixed(2);
    
    case 'fractional':
      return decimalToFractional(decimalOdds);
    
    default:
      return decimalOdds.toFixed(2);
  }
}

/**
 * Format odds from decimal format for display based on region
 * This is the primary function for dashboard components that receive decimal odds from the API
 */
export function formatDecimalOddsForRegion(decimalOdds: number, region: UserRegion): string {
  return formatOddsForRegion(decimalOdds, region, 'decimal');
}

/**
 * Format odds from American format for display based on region
 * This is for the LiveFeedPreview sample data which uses American format
 */
export function formatAmericanOddsForRegion(americanOdds: number, region: UserRegion): string {
  return formatOddsForRegion(americanOdds, region, 'american');
}

/**
 * Get the odds format label for a region
 */
export function getOddsFormatLabel(region: UserRegion): string {
  const format = REGION_ODDS_FORMAT[region];
  switch (format) {
    case 'american':
      return 'American';
    case 'decimal':
      return 'Decimal';
    case 'fractional':
      return 'Fractional';
    default:
      return 'Decimal';
  }
}

/**
 * Get example odds display for a region (for UI hints)
 */
export function getOddsFormatExample(region: UserRegion): string {
  switch (REGION_ODDS_FORMAT[region]) {
    case 'american':
      return '+150 / -110';
    case 'decimal':
      return '2.50 / 1.91';
    case 'fractional':
      return '3/2 / 10/11';
    default:
      return '2.50 / 1.91';
  }
}

/**
 * Parse a regional odds string back to decimal odds.
 * Used for editable odds inputs in calculator modals.
 * 
 * US users type "+150" or "-110" → converted to decimal internally
 * UK users type "3/2" or "10/11" → converted to decimal internally
 * AU/EU users type "2.50" → used as-is
 */
export function parseRegionalOddsToDecimal(input: string, region: UserRegion): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const format = REGION_ODDS_FORMAT[region];

  switch (format) {
    case 'american': {
      // Handle +150, -110, etc.
      const num = parseFloat(trimmed.replace(/^\+/, ''));
      if (isNaN(num) || num === 0) return null;
      return americanToDecimal(num);
    }

    case 'fractional': {
      // Handle "3/2", "10/11", etc.
      const parts = trimmed.split('/');
      if (parts.length === 2) {
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den > 0) {
          return (num / den) + 1;
        }
      }
      // Also allow decimal input as fallback
      const asNum = parseFloat(trimmed);
      if (!isNaN(asNum) && asNum > 1) return asNum;
      return null;
    }

    case 'decimal':
    default: {
      const num = parseFloat(trimmed);
      if (isNaN(num) || num <= 1) return null;
      return num;
    }
  }
}

/**
 * Format decimal odds for display in a regional input field.
 * Unlike formatDecimalOddsForRegion, this is specifically named for
 * use with editable input fields to make the intent clear.
 */
export function formatOddsForInput(decimalOdds: number, region: UserRegion): string {
  return formatDecimalOddsForRegion(decimalOdds, region);
}