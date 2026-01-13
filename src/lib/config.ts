// src/lib/config.ts

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

  // Regions - AU for normal mode
  regions: ['au'] as const,
  
  // ALL regions for global mode (valid API regions only)
  allRegions: ['au', 'uk', 'us', 'eu'] as const,

  // Australian bookmakers we can actually bet with
  aussieBookmakers: [
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
  ],

  // ALL global bookmakers for "see what's out there" mode
  allBookmakers: [
    // Australia
    'betfair_ex_au', 'betr_au', 'betright', 'bet365_au', 'boombet', 'dabble_au',
    'ladbrokes_au', 'neds', 'playup', 'pointsbetau', 'sportsbet', 'tab', 'tabtouch', 'unibet',
    // UK
    'betfair_ex_uk', 'betvictor', 'betway', 'boylesports', 'coral', 'ladbrokes_uk',
    'leovegas', 'matchbook', 'paddypower', 'skybet', 'unibet_uk', 'virginbet', 'williamhill',
    // US
    'betonlineag', 'betmgm', 'betrivers', 'betus', 'bovada', 'draftkings', 'fanduel',
    'lowvig', 'mybookieag', 'pointsbetus', 'superbook', 'unibet_us', 'williamhill_us', 'wynnbet',
    // Europe
    'sport888', 'betclic', 'betsson', 'coolbet', 'marathonbet', 'nordicbet', 
    'pinnacle', 'suprabets', 'unibet_eu',
    // Other
    'betfair_ex_eu', 'onexbet',
  ],

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
    // AU
    betfair_ex_au: 'Betfair', betr_au: 'Betr', betright: 'BetRight', bet365_au: 'Bet365',
    boombet: 'BoomBet', dabble_au: 'Dabble', ladbrokes_au: 'Ladbrokes', neds: 'Neds',
    playup: 'PlayUp', pointsbetau: 'PointsBet', sportsbet: 'SportsBet', tab: 'TAB',
    tabtouch: 'TABtouch', unibet: 'Unibet',
    // UK
    betfair_ex_uk: 'Betfair UK', betvictor: 'BetVictor', betway: 'Betway', boylesports: 'BoyleSports',
    coral: 'Coral', ladbrokes_uk: 'Ladbrokes UK', leovegas: 'LeoVegas', matchbook: 'Matchbook',
    paddypower: 'Paddy Power', skybet: 'Sky Bet', unibet_uk: 'Unibet UK', virginbet: 'Virgin Bet',
    williamhill: 'William Hill',
    // US
    betonlineag: 'BetOnline', betmgm: 'BetMGM', betrivers: 'BetRivers', betus: 'BetUS',
    bovada: 'Bovada', draftkings: 'DraftKings', fanduel: 'FanDuel', lowvig: 'LowVig',
    mybookieag: 'MyBookie', pointsbetus: 'PointsBet US', superbook: 'SuperBook',
    unibet_us: 'Unibet US', williamhill_us: 'Caesars', wynnbet: 'WynnBET',
    // EU
    sport888: '888sport', betclic: 'Betclic', betsson: 'Betsson', coolbet: 'Coolbet',
    marathonbet: 'Marathonbet', nordicbet: 'NordicBet', pinnacle: 'Pinnacle',
    suprabets: 'Suprabets', unibet_eu: 'Unibet EU',
    // Other
    betfair_ex_eu: 'Betfair EU', onexbet: '1xBet',
  } as Record<string, string>,

  // Bookmaker regions
  bookmakerRegions: {
    // AU
    betfair_ex_au: 'AU', betr_au: 'AU', betright: 'AU', bet365_au: 'AU', boombet: 'AU',
    dabble_au: 'AU', ladbrokes_au: 'AU', neds: 'AU', playup: 'AU', pointsbetau: 'AU',
    sportsbet: 'AU', tab: 'AU', tabtouch: 'AU', unibet: 'AU',
    // UK
    betfair_ex_uk: 'UK', betvictor: 'UK', betway: 'UK', boylesports: 'UK', coral: 'UK',
    ladbrokes_uk: 'UK', leovegas: 'UK', matchbook: 'UK', paddypower: 'UK', skybet: 'UK',
    unibet_uk: 'UK', virginbet: 'UK', williamhill: 'UK',
    // US
    betonlineag: 'US', betmgm: 'US', betrivers: 'US', betus: 'US', bovada: 'US',
    draftkings: 'US', fanduel: 'US', lowvig: 'US', mybookieag: 'US', pointsbetus: 'US',
    superbook: 'US', unibet_us: 'US', williamhill_us: 'US', wynnbet: 'US',
    // EU
    sport888: 'EU', betclic: 'EU', betsson: 'EU', coolbet: 'EU', marathonbet: 'EU',
    nordicbet: 'EU', pinnacle: 'EU', suprabets: 'EU', unibet_eu: 'EU',
    // Other
    betfair_ex_eu: 'EU', onexbet: 'INT',
  } as Record<string, string>,
} as const;

export type Region = typeof config.regions[number];
export type AUBookmaker = typeof config.aussieBookmakers[number];

// Helper functions
export function getBookmakerName(key: string): string {
  return config.bookmakerNames[key] || key;
}

export function getBookmakerRegion(key: string): string {
  return config.bookmakerRegions[key] || '??';
}