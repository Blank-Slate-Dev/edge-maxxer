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
  bet365_au: {
    key: 'bet365_au',
    name: 'Bet365 AU',
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

  ladbrokes_au: {
    key: 'ladbrokes_au',
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
      'Shares data with Neds (same owner - Entain)',
    ],
    recommendations: [
      'Extremely conservative stake rounding',
      'Heavy mug betting required (1:1 ratio)',
      'Avoid all obscure markets',
      'Only bet on major televised events',
      'Never take best odds if significantly higher',
    ],
  },

  neds: {
    key: 'neds',
    name: 'Neds',
    riskLevel: 'extreme',
    limitingSpeed: 'days',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '1-2 weeks',
    stakeStrategy: 'conservative',
    notes: [
      'Owned by Entain (same as Ladbrokes)',
      'Shares data with Ladbrokes',
      'Limits as aggressively as Ladbrokes',
      'Getting limited at one likely affects the other',
    ],
    recommendations: [
      'Treat identically to Ladbrokes',
      'If limited at Ladbrokes, expect limits here too',
      'Extremely conservative stake rounding',
      'Heavy mug betting required',
    ],
  },

  // High Risk - Will limit within weeks
  sportsbet: {
    key: 'sportsbet',
    name: 'SportsBet',
    riskLevel: 'high',
    limitingSpeed: 'weeks',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '2-6 months',
    stakeStrategy: 'moderate',
    notes: [
      'Owned by Flutter (same as BetEasy was)',
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

  pointsbetau: {
    key: 'pointsbetau',
    name: 'PointsBet AU',
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

  unibet: {
    key: 'unibet',
    name: 'Unibet',
    riskLevel: 'high',
    limitingSpeed: 'weeks',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '2-4 months',
    stakeStrategy: 'moderate',
    notes: [
      'Owned by Kindred Group',
      'Moderate limiting behavior',
      'Will limit consistent winners',
    ],
    recommendations: [
      'Round stakes to nearest $5',
      'Mix in recreational bets',
      'Avoid always taking best odds',
      'Use their promotions naturally',
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

  tabtouch: {
    key: 'tabtouch',
    name: 'TABtouch',
    riskLevel: 'medium',
    limitingSpeed: 'months',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '3-12 months',
    stakeStrategy: 'moderate',
    notes: [
      'Western Australia TAB',
      'Similar to TAB in limiting behavior',
      'Government-affiliated',
    ],
    recommendations: [
      'Similar approach to TAB',
      'Good for racing with MBL protection',
      'Naturalize sports bet stakes',
    ],
  },

  betr_au: {
    key: 'betr_au',
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

  betright: {
    key: 'betright',
    name: 'Bet Right',
    riskLevel: 'medium',
    limitingSpeed: 'months',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '2-6 months',
    stakeStrategy: 'moderate',
    notes: [
      'Smaller Australian bookmaker',
      'Less aggressive than major corporates',
      'May have lower limits',
    ],
    recommendations: [
      'Use naturalized stakes',
      'Don\'t go too hard too fast',
      'Mix in some losing bets',
    ],
  },

  playup: {
    key: 'playup',
    name: 'PlayUp',
    riskLevel: 'medium',
    limitingSpeed: 'months',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '2-6 months',
    stakeStrategy: 'moderate',
    notes: [
      'Mid-tier Australian bookmaker',
      'Moderate limiting behavior',
      'Growing bookmaker',
    ],
    recommendations: [
      'Standard naturalization approach',
      'Mix recreational bets',
      'Avoid obvious arb patterns',
    ],
  },

  boombet: {
    key: 'boombet',
    name: 'BoomBet',
    riskLevel: 'medium',
    limitingSpeed: 'months',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '2-6 months',
    stakeStrategy: 'moderate',
    notes: [
      'Smaller Australian bookmaker',
      'Less data on limiting patterns',
      'May have lower maximum stakes',
    ],
    recommendations: [
      'Use naturalized stakes',
      'Standard precautions apply',
      'Mix in recreational betting',
    ],
  },

  dabble_au: {
    key: 'dabble_au',
    name: 'Dabble AU',
    riskLevel: 'medium',
    limitingSpeed: 'months',
    minBetLawProtection: true,
    acceptsWinners: false,
    avgAccountLifespan: '2-6 months',
    stakeStrategy: 'moderate',
    notes: [
      'Social betting platform',
      'Newer to market',
      'Unknown long-term limiting behavior',
    ],
    recommendations: [
      'Use naturalized stakes',
      'Engage with social features',
      'Standard precautions',
    ],
  },

  // Low Risk / Winner Friendly
  betfair_ex_au: {
    key: 'betfair_ex_au',
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
    ],
    recommendations: [
      'Use freely - no stake naturalization needed',
      'Factor in 5% commission to calculations',
      'Check liquidity before placing bookie bet',
      'Keep under $100k profit/year to avoid Expert Fee',
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
  
  // Try with common suffixes
  const withAu = `${normalized}_au`;
  const withAuSuffix = `${normalized}au`;
  if (BOOKMAKER_PROFILES[withAu]) {
    return BOOKMAKER_PROFILES[withAu];
  }
  if (BOOKMAKER_PROFILES[withAuSuffix]) {
    return BOOKMAKER_PROFILES[withAuSuffix];
  }
  
  // Search by name
  for (const profile of Object.values(BOOKMAKER_PROFILES)) {
    const profileNormalized = profile.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (profileNormalized.includes(normalized) || normalized.includes(profileNormalized)) {
      return profile;
    }
  }
  
  // Common aliases mapping to API keys
  const aliases: Record<string, string> = {
    'bet365': 'bet365_au',
    'ladbrokes': 'ladbrokes_au',
    'pointsbet': 'pointsbetau',
    'betfair': 'betfair_ex_au',
    'betfairexchange': 'betfair_ex_au',
    'betr': 'betr_au',
    'dabble': 'dabble_au',
    'tabwa': 'tabtouch',
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

// AU Bookmaker API keys for reference
export const AU_BOOKMAKER_KEYS = [
  'betfair_ex_au',
  'betr_au',
  'betright',
  'bet365_au',
  'boombet',
  'dabble_au',
  'ladbrokes_au',
  'neds',
  'playup',
  'pointsbetau',
  'sportsbet',
  'tab',
  'tabtouch',
  'unibet',
] as const;

export type AUBookmakerKey = typeof AU_BOOKMAKER_KEYS[number];