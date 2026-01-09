// src/lib/stealth/bookmakerProfiles.ts

export interface BookmakerProfile {
  key: string;
  name: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  limitingSpeed: 'days' | 'weeks' | 'months' | 'never';
  minBetLawProtection: boolean; // For racing only
  acceptsWinners: boolean;
  notes: string[];
  recommendations: string[];
  avgAccountLifespan: string; // For arb bettors
  stakeStrategy: 'conservative' | 'moderate' | 'aggressive';
}

export const BOOKMAKER_PROFILES: Record<string, BookmakerProfile> = {
  // Extreme Risk - Will limit very quickly
  bet365: {
    key: 'bet365',
    name: 'Bet365',
    riskLevel: 'extreme',
    limitingSpeed: 'days',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '1-4 weeks',
    stakeStrategy: 'conservative',
    notes: [
      'Most aggressive limiter in Australia',
      'Known to limit to $2-3 stakes after single winning week',
      'Monitors CLV extremely closely',
      'Uses sophisticated device fingerprinting',
      'Will limit even with small profits',
    ],
    recommendations: [
      'Use round stakes only ($20, $25, $50)',
      'Never bet exact promo minimums',
      'Place mug bets on popular markets',
      'Avoid withdrawals for as long as possible',
      'Bet close to event start time',
      'Mix in some losing favorites',
    ],
  },

  ladbrokes: {
    key: 'ladbrokes',
    name: 'Ladbrokes',
    riskLevel: 'extreme',
    limitingSpeed: 'days',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '1-2 weeks',
    stakeStrategy: 'conservative',
    notes: [
      'Can ban promos within 4 days of signup',
      'Stakes limited to as low as 25 cents',
      'Very quick to detect arb patterns',
      'Shares data with other Flutter brands',
    ],
    recommendations: [
      'Extremely conservative stake rounding',
      'Heavy mug betting required (1:1 ratio)',
      'Avoid all obscure markets',
      'Only bet on major televised events',
      'Never take best odds if significantly higher',
    ],
  },

  // High Risk - Will limit within weeks
  sportsbet: {
    key: 'sportsbet',
    name: 'Sportsbet',
    riskLevel: 'high',
    limitingSpeed: 'weeks',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '2-6 months',
    stakeStrategy: 'moderate',
    notes: [
      'Owned by Flutter (same as Ladbrokes)',
      'Employs dedicated analysts to flag winners',
      'Typically limits within 2-6 months',
      'Popular in Australia - good liquidity',
    ],
    recommendations: [
      'Round stakes to nearest $5',
      'Place regular mug bets on AFL/NRL',
      'Use their Same Game Multi occasionally',
      'Avoid systematic best-odds taking',
      'Withdraw infrequently and small amounts',
    ],
  },

  pointsbet: {
    key: 'pointsbet',
    name: 'PointsBet',
    riskLevel: 'high',
    limitingSpeed: 'weeks',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '1-3 months',
    stakeStrategy: 'moderate',
    notes: [
      'Fast to limit individual bettors',
      'Unique PointsBetting product (avoid for arbs)',
      'Less sophisticated than Bet365 but still aggressive',
    ],
    recommendations: [
      'Occasionally use their PointsBetting feature (small stakes)',
      'Stick to major sports',
      'Round stakes to natural amounts',
      'Mix in some multis',
    ],
  },

  // Medium Risk
  tab: {
    key: 'tab',
    name: 'TAB',
    riskLevel: 'medium',
    limitingSpeed: 'months',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '3-12 months',
    stakeStrategy: 'moderate',
    notes: [
      'Government-affiliated, slower to act',
      'Strong MBL protection for racing',
      'Sports betting can still be limited',
      'Less sophisticated detection than corporates',
    ],
    recommendations: [
      'Good for racing arbs (MBL protected)',
      'Sports bets should still be naturalized',
      'Can be slightly more aggressive with stakes',
      'Still avoid obvious patterns',
    ],
  },

  betr: {
    key: 'betr',
    name: 'Betr',
    riskLevel: 'medium',
    limitingSpeed: 'months',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '2-6 months',
    stakeStrategy: 'moderate',
    notes: [
      'Newer bookmaker - less historical data on limiting',
      'Aggressive marketing suggests want volume',
      'Likely to tighten as they mature',
    ],
    recommendations: [
      'Take advantage while relatively new',
      'Still use naturalized stakes',
      'Engage with their promotions naturally',
      'Don\'t be their biggest winner',
    ],
  },

  // Low Risk / Winner Friendly
  betfair: {
    key: 'betfair',
    name: 'Betfair Exchange',
    riskLevel: 'low',
    limitingSpeed: 'never',
    minBetLawProtection: false,
    acceptsWinners: true,
    avgAccountLifespan: 'Unlimited',
    stakeStrategy: 'aggressive',
    notes: [
      'Exchange model - cannot limit stakes',
      'Earns commission regardless of outcome',
      'Expert Fee up to 40% for big winners (>$100k/year)',
      'Essential for lay bets in matched betting',
      'Betfair SPORTSBOOK (separate) does limit',
    ],
    recommendations: [
      'Use freely - no stake naturalization needed',
      'Factor in 5% commission to calculations',
      'Check liquidity before placing bookie bet',
      'Keep under $100k profit/year to avoid Expert Fee',
      'Only use EXCHANGE, not Sportsbook',
    ],
  },

  topsport: {
    key: 'topsport',
    name: 'TopSport',
    riskLevel: 'low',
    limitingSpeed: 'never',
    minBetLawProtection: true,
    acceptsWinners: true,
    avgAccountLifespan: 'Unlimited',
    stakeStrategy: 'aggressive',
    notes: [
      'Explicitly advertises "no limits on winners"',
      'Genuinely winner-friendly Australian book',
      'May have slightly worse odds as trade-off',
      'Lower limits than major books',
    ],
    recommendations: [
      'Can bet more naturally here',
      'Still don\'t be obnoxious about it',
      'Good for one leg of arbs',
      'Valuable account - don\'t abuse',
    ],
  },
};

// Helper to get profile by various name formats
export function getBookmakerProfile(name: string): BookmakerProfile | null {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Direct key match
  if (BOOKMAKER_PROFILES[normalized]) {
    return BOOKMAKER_PROFILES[normalized];
  }
  
  // Search by name
  for (const profile of Object.values(BOOKMAKER_PROFILES)) {
    const profileNormalized = profile.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (profileNormalized.includes(normalized) || normalized.includes(profileNormalized)) {
      return profile;
    }
  }
  
  // Common aliases
  const aliases: Record<string, string> = {
    'paddypower': 'sportsbet', // Same owner
    'betfairexchange': 'betfair',
    'betfairsportsbook': 'sportsbet', // Treat as high risk
    'neds': 'ladbrokes', // Same owner
    'unibet': 'sportsbet', // Similar risk profile
    'bluebet': 'tab', // Similar risk
    'palmerbet': 'tab',
  };
  
  if (aliases[normalized]) {
    return BOOKMAKER_PROFILES[aliases[normalized]];
  }
  
  return null;
}

// Get risk color for UI
export function getRiskColor(level: BookmakerProfile['riskLevel']): string {
  switch (level) {
    case 'extreme': return '#ef4444'; // red
    case 'high': return '#f97316'; // orange
    case 'medium': return '#eab308'; // yellow
    case 'low': return '#22c55e'; // green
    default: return '#888888';
  }
}

// Get all bookmaker keys
export function getAllBookmakerKeys(): string[] {
  return Object.keys(BOOKMAKER_PROFILES);
}
