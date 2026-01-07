// src/lib/normalization/eventMatcher.ts
import type { SportEvent, NormalizedEvent } from '../types';

/**
 * Normalizes team/player names for matching across different data sources.
 * 
 * Different bookmakers and data providers may use slightly different names:
 * - "LA Lakers" vs "Los Angeles Lakers"
 * - "J. Sinner" vs "Jannik Sinner"
 * - "Man Utd" vs "Manchester United"
 */

// Common abbreviations and their expansions
const TEAM_ABBREVIATIONS: Record<string, string> = {
  'la': 'los angeles',
  'ny': 'new york',
  'nyk': 'new york knicks',
  'gsw': 'golden state warriors',
  'lal': 'los angeles lakers',
  'lac': 'los angeles clippers',
  'man': 'manchester',
  'utd': 'united',
  'fc': '',
  'cf': '',
  'afc': '',
};

// Words to remove when normalizing
const NOISE_WORDS = ['fc', 'cf', 'afc', 'sc', 'ac', 'the'];

/**
 * Normalizes a team or player name for consistent matching.
 */
export function normalizeName(name: string): string {
  let normalized = name.toLowerCase().trim();
  
  // Replace common abbreviations
  for (const [abbrev, expansion] of Object.entries(TEAM_ABBREVIATIONS)) {
    // Only replace if it's a word boundary
    const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
    normalized = normalized.replace(regex, expansion);
  }
  
  // Remove noise words
  for (const word of NOISE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(regex, '');
  }
  
  // Remove punctuation and extra whitespace
  normalized = normalized
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
}

/**
 * Calculates string similarity using Levenshtein distance.
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const maxLen = Math.max(a.length, b.length);
  return 1 - matrix[b.length][a.length] / maxLen;
}

/**
 * Checks if two names match (after normalization).
 */
export function namesMatch(name1: string, name2: string, threshold: number = 0.85): boolean {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  
  // Exact match after normalization
  if (norm1 === norm2) return true;
  
  // Check if one contains the other (for cases like "Sinner" vs "Jannik Sinner")
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Fuzzy match
  return stringSimilarity(norm1, norm2) >= threshold;
}

/**
 * Normalizes a sport event for matching.
 */
export function normalizeEvent(event: SportEvent): NormalizedEvent {
  return {
    id: event.id,
    sportKey: event.sportKey,
    sportTitle: event.sportTitle,
    commenceTime: event.commenceTime,
    homeTeam: event.homeTeam,
    awayTeam: event.awayTeam,
    normalizedHome: normalizeName(event.homeTeam),
    normalizedAway: normalizeName(event.awayTeam),
  };
}

/**
 * Checks if two events match (same teams, similar start time).
 */
export function eventsMatch(
  event1: NormalizedEvent,
  event2: NormalizedEvent,
  timeToleranceMinutes: number = 30
): boolean {
  // Check sport matches
  if (event1.sportKey !== event2.sportKey) return false;
  
  // Check time tolerance
  const timeDiff = Math.abs(
    event1.commenceTime.getTime() - event2.commenceTime.getTime()
  );
  if (timeDiff > timeToleranceMinutes * 60 * 1000) return false;
  
  // Check teams match (in either order since home/away might differ)
  const homeToHome = namesMatch(event1.normalizedHome, event2.normalizedHome);
  const awayToAway = namesMatch(event1.normalizedAway, event2.normalizedAway);
  const homeToAway = namesMatch(event1.normalizedHome, event2.normalizedAway);
  const awayToHome = namesMatch(event1.normalizedAway, event2.normalizedHome);
  
  return (homeToHome && awayToAway) || (homeToAway && awayToHome);
}

/**
 * Normalizes outcome names within a market.
 * Returns a map from normalized name to original name.
 */
export function normalizeOutcomeNames(
  outcomes: { name: string }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const outcome of outcomes) {
    const normalized = normalizeName(outcome.name);
    map.set(normalized, outcome.name);
  }
  return map;
}

/**
 * Finds matching outcome between two sets by name.
 */
export function findMatchingOutcome<T extends { name: string }>(
  targetName: string,
  outcomes: T[]
): T | undefined {
  const normalizedTarget = normalizeName(targetName);
  
  // Try exact match first
  const exact = outcomes.find(o => normalizeName(o.name) === normalizedTarget);
  if (exact) return exact;
  
  // Try fuzzy match
  return outcomes.find(o => namesMatch(o.name, targetName));
}
