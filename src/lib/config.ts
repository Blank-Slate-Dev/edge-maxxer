// src/lib/config.ts

export type UserRegion = 'US' | 'EU' | 'UK' | 'AU';

// API region keys (what The Odds API expects)
export type ApiRegion = 'us' | 'us2' | 'us_dfs' | 'us_ex' | 'eu' | 'uk' | 'au' | 'fr' | 'se';

export const config = {
  // API settings
  api: {
    baseUrl: 'https://api.the-odds-api.com/v4',
    cacheTime: {
      odds: 30,
      arbs: 15,
      sports: 3600,
    },
  },

  // Region display order for tabs
  regionOrder: ['US', 'EU', 'UK', 'AU'] as const,

  // Map user regions to API regions
  userRegionToApiRegions: {
    US: ['us', 'us2', 'us_dfs', 'us_ex'],
    EU: ['eu', 'fr', 'se'],
    UK: ['uk'],
    AU: ['au'],
  } as Record<UserRegion, ApiRegion[]>,

  // Region display info
  regionInfo: {
    US: { label: 'United States', flag: '🇺🇸', color: 'red' },
    EU: { label: 'Europe', flag: '🇪🇺', color: 'purple' },
    UK: { label: 'United Kingdom', flag: '🇬🇧', color: 'blue' },
    AU: { label: 'Australia', flag: '🇦🇺', color: 'green' },
  } as Record<UserRegion, { label: string; flag: string; color: string }>,

  // Bookmakers by user region
  bookmakersByRegion: {
    AU: [
      // AU region (14 bookmakers)
      'betfair_ex_au', 'betr_au', 'betright', 'bet365_au', 'boombet', 'dabble_au',
      'ladbrokes_au', 'neds', 'playup', 'pointsbetau', 'sportsbet', 'tab', 'tabtouch', 'unibet',
    ],
    UK: [
      // UK region (19 bookmakers)
      'sport888', 'betfair_ex_uk', 'betfair_sb_uk', 'betvictor', 'betway', 'boylesports',
      'casumo', 'coral', 'grosvenor', 'ladbrokes_uk', 'leovegas', 'livescorebet',
      'matchbook', 'paddypower', 'skybet', 'smarkets', 'unibet_uk', 'virginbet', 'williamhill',
    ],
    US: [
      // US region (11 bookmakers)
      'betonlineag', 'betmgm', 'betrivers', 'betus', 'bovada', 'williamhill_us',
      'draftkings', 'fanatics', 'fanduel', 'lowvig', 'mybookieag',
      // US2 region (7 bookmakers)
      'ballybet', 'betanysports', 'betparx', 'espnbet', 'fliff', 'hardrockbet', 'rebet',
      // US_DFS - Daily Fantasy Sports (4 bookmakers)
      'betr_us_dfs', 'pick6', 'prizepicks', 'underdog',
      // US_EX - Exchanges (5 bookmakers)
      'betopenly', 'kalshi', 'novig', 'polymarket', 'prophetx',
    ],
    EU: [
      // EU region (29 bookmakers)
      'onexbet', 'sport888', 'betclic_fr', 'betanysports', 'betfair_ex_eu', 'betonlineag',
      'betsson', 'codere_it', 'betvictor', 'coolbet', 'everygame', 'gtbets', 'leovegas_se',
      'marathonbet', 'matchbook', 'mybookieag', 'nordicbet', 'parionssport_fr', 'pinnacle',
      'pmu_fr', 'suprabets', 'tipico_de', 'unibet_fr', 'unibet_it', 'unibet_nl', 'unibet_se',
      'williamhill', 'winamax_de', 'winamax_fr',
      // FR region - French bookmakers (1 additional)
      'netbet_fr',
      // SE region - Swedish bookmakers (3 additional)
      'atg_se', 'mrgreen_se', 'svenskaspel_se',
    ],
  } as Record<UserRegion, string[]>,

  // Default filter settings
  filters: {
    minProfit: -2,
    maxHoursUntilStart: 72,
    nearArbThreshold: 2,
    valueThreshold: 5,
  },

  // Sports categories
  sportCategories: {
    popular: [
      'aussierules_afl', 'rugbyleague_nrl', 'soccer_epl', 'basketball_nba',
      'tennis_atp', 'tennis_wta', 'cricket_test_match', 'cricket_icc_world_cup',
      'americanfootball_nfl', 'icehockey_nhl', 'baseball_mlb', 'mma_mixed_martial_arts', 'boxing_boxing',
    ],
    tennis: ['tennis_atp', 'tennis_wta', 'tennis_itf_men', 'tennis_itf_women', 'tennis_atp_challenger'],
    soccer: [
      'soccer_epl', 'soccer_australia_aleague', 'soccer_spain_la_liga', 'soccer_germany_bundesliga',
      'soccer_italy_serie_a', 'soccer_france_ligue_one', 'soccer_uefa_champs_league',
      'soccer_uefa_europa_league', 'soccer_usa_mls',
    ],
    basketball: ['basketball_nba', 'basketball_nbl', 'basketball_euroleague', 'basketball_ncaab'],
    aussie: [
      'aussierules_afl', 'rugbyleague_nrl', 'rugbyunion_super_rugby',
      'cricket_big_bash', 'soccer_australia_aleague', 'basketball_nbl',
    ],
  },

  // Bookmaker display names
  bookmakerNames: {
    // AU (14)
    betfair_ex_au: 'Betfair', betr_au: 'Betr', betright: 'BetRight', bet365_au: 'Bet365',
    boombet: 'BoomBet', dabble_au: 'Dabble', ladbrokes_au: 'Ladbrokes', neds: 'Neds',
    playup: 'PlayUp', pointsbetau: 'PointsBet', sportsbet: 'SportsBet', tab: 'TAB',
    tabtouch: 'TABtouch', unibet: 'Unibet',
    // UK (19)
    sport888: '888sport', betfair_ex_uk: 'Betfair UK', betfair_sb_uk: 'Betfair SB',
    betvictor: 'BetVictor', betway: 'Betway', boylesports: 'BoyleSports',
    casumo: 'Casumo', coral: 'Coral', grosvenor: 'Grosvenor', ladbrokes_uk: 'Ladbrokes UK',
    leovegas: 'LeoVegas', livescorebet: 'LiveScore Bet', matchbook: 'Matchbook',
    paddypower: 'Paddy Power', skybet: 'Sky Bet', smarkets: 'Smarkets',
    unibet_uk: 'Unibet UK', virginbet: 'Virgin Bet', williamhill: 'William Hill',
    // US (11)
    betonlineag: 'BetOnline', betmgm: 'BetMGM', betrivers: 'BetRivers', betus: 'BetUS',
    bovada: 'Bovada', draftkings: 'DraftKings', fanduel: 'FanDuel', lowvig: 'LowVig',
    mybookieag: 'MyBookie', pointsbetus: 'PointsBet US', superbook: 'SuperBook',
    unibet_us: 'Unibet US', williamhill_us: 'Caesars', wynnbet: 'WynnBET', fanatics: 'Fanatics',
    // US2 (7)
    ballybet: 'Bally Bet', betanysports: 'BetAnything', betparx: 'betPARX',
    espnbet: 'theScore Bet', fliff: 'Fliff', hardrockbet: 'Hard Rock Bet', rebet: 'ReBet',
    // US_DFS - Daily Fantasy Sports (4)
    betr_us_dfs: 'Betr Picks', pick6: 'DraftKings Pick6', prizepicks: 'PrizePicks', underdog: 'Underdog Fantasy',
    // US_EX - Exchanges (5)
    betopenly: 'BetOpenly', kalshi: 'Kalshi', novig: 'Novig', polymarket: 'Polymarket', prophetx: 'ProphetX',
    // EU (29)
    onexbet: '1xBet', betclic_fr: 'Betclic FR', betfair_ex_eu: 'Betfair EU',
    betsson: 'Betsson', codere_it: 'Codere IT', coolbet: 'Coolbet',
    everygame: 'Everygame', gtbets: 'GTbets', leovegas_se: 'LeoVegas SE',
    marathonbet: 'Marathonbet', nordicbet: 'NordicBet', parionssport_fr: 'Parions Sport',
    pinnacle: 'Pinnacle', pmu_fr: 'PMU', suprabets: 'Suprabets',
    tipico_de: 'Tipico DE', unibet_fr: 'Unibet FR', unibet_it: 'Unibet IT',
    unibet_nl: 'Unibet NL', unibet_se: 'Unibet SE', unibet_eu: 'Unibet EU',
    winamax_de: 'Winamax DE', winamax_fr: 'Winamax FR',
    // FR - French (1 additional)
    netbet_fr: 'NetBet FR',
    // SE - Swedish (3 additional)
    atg_se: 'ATG SE', mrgreen_se: 'Mr Green SE', svenskaspel_se: 'Svenska Spel',
  } as Record<string, string>,

  // Bookmaker regions (for display badges)
  bookmakerRegions: {
    // AU (14)
    betfair_ex_au: 'AU', betr_au: 'AU', betright: 'AU', bet365_au: 'AU', boombet: 'AU',
    dabble_au: 'AU', ladbrokes_au: 'AU', neds: 'AU', playup: 'AU', pointsbetau: 'AU',
    sportsbet: 'AU', tab: 'AU', tabtouch: 'AU', unibet: 'AU',
    // UK (19)
    sport888: 'UK', betfair_ex_uk: 'UK', betfair_sb_uk: 'UK', betvictor: 'UK', betway: 'UK',
    boylesports: 'UK', casumo: 'UK', coral: 'UK', grosvenor: 'UK', ladbrokes_uk: 'UK',
    leovegas: 'UK', livescorebet: 'UK', matchbook: 'UK', paddypower: 'UK', skybet: 'UK',
    smarkets: 'UK', unibet_uk: 'UK', virginbet: 'UK', williamhill: 'UK',
    // US (11)
    betonlineag: 'US', betmgm: 'US', betrivers: 'US', betus: 'US', bovada: 'US',
    draftkings: 'US', fanduel: 'US', lowvig: 'US', mybookieag: 'US', pointsbetus: 'US',
    superbook: 'US', unibet_us: 'US', williamhill_us: 'US', wynnbet: 'US', fanatics: 'US',
    // US2 (7)
    ballybet: 'US', betanysports: 'US', betparx: 'US', espnbet: 'US',
    fliff: 'US', hardrockbet: 'US', rebet: 'US',
    // US_DFS - Daily Fantasy Sports (4)
    betr_us_dfs: 'US', pick6: 'US', prizepicks: 'US', underdog: 'US',
    // US_EX - Exchanges (5)
    betopenly: 'US', kalshi: 'US', novig: 'US', polymarket: 'US', prophetx: 'US',
    // EU (29)
    onexbet: 'EU', betclic_fr: 'EU', betfair_ex_eu: 'EU', betsson: 'EU', codere_it: 'EU',
    coolbet: 'EU', everygame: 'EU', gtbets: 'EU', leovegas_se: 'EU', marathonbet: 'EU',
    nordicbet: 'EU', parionssport_fr: 'EU', pinnacle: 'EU', pmu_fr: 'EU', suprabets: 'EU',
    tipico_de: 'EU', unibet_fr: 'EU', unibet_it: 'EU', unibet_nl: 'EU', unibet_se: 'EU',
    unibet_eu: 'EU', winamax_de: 'EU', winamax_fr: 'EU',
    // FR - French (1 additional)
    netbet_fr: 'EU',
    // SE - Swedish (3 additional)
    atg_se: 'EU', mrgreen_se: 'EU', svenskaspel_se: 'EU',
  } as Record<string, string>,
} as const;

// Helper functions
export function getBookmakerName(key: string): string {
  return config.bookmakerNames[key] || key;
}

export function getBookmakerRegion(key: string): string {
  return config.bookmakerRegions[key] || '??';
}

/**
 * Get API regions to query based on selected user regions
 */
export function getApiRegionsForUserRegions(selectedRegions: UserRegion[]): string {
  const apiRegions = new Set<string>();
  for (const userRegion of selectedRegions) {
    const regions = config.userRegionToApiRegions[userRegion] || [];
    regions.forEach(r => apiRegions.add(r));
  }
  return Array.from(apiRegions).join(',');
}

/**
 * Get all bookmakers for selected user regions
 */
export function getBookmakersForRegions(selectedRegions: UserRegion[]): string[] {
  const bookmakers = new Set<string>();
  for (const userRegion of selectedRegions) {
    const regionBookmakers = config.bookmakersByRegion[userRegion] || [];
    regionBookmakers.forEach(b => bookmakers.add(b));
  }
  return Array.from(bookmakers);
}

/**
 * Count bookmakers for a set of regions
 */
export function countBookmakersForRegions(selectedRegions: UserRegion[]): number {
  return getBookmakersForRegions(selectedRegions).length;
}

// Legacy exports for backwards compatibility
export const aussieBookmakers = config.bookmakersByRegion.AU;
export const allBookmakers = [
  ...config.bookmakersByRegion.AU,
  ...config.bookmakersByRegion.UK,
  ...config.bookmakersByRegion.US,
  ...config.bookmakersByRegion.EU,
];
export const regions = ['au'] as const;
export const allRegions = ['au', 'uk', 'us', 'eu'] as const;

export type AUBookmaker = typeof aussieBookmakers[number];