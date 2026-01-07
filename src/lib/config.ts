// src/lib/config.ts

export const config = {
  // API settings
  api: {
    baseUrl: 'https://api.the-odds-api.com/v4',
    cacheTime: {
      odds: 30,      // seconds
      arbs: 15,      // seconds
      sports: 3600,  // 1 hour
    },
  },

  // Regions to fetch odds from (more regions = more bookmakers = more arb chances)
  regions: ['au', 'uk', 'eu'] as const,

  // Australian bookmakers we can actually bet with
  aussieBookmakers: [
    'sportsbet',
    'tab',
    'pointsbet_au',
    'pointsbet',
    'unibet',
    'unibet_au',
    'neds',
    'ladbrokes',
    'ladbrokes_au',
    'betfair_ex_au',
    'betfair',
    'bet365',
    'bet365_au',
    'bluebet',
    'topsport',
    'betr_au',
    'playup',
    'betright',
    'palmerbet',
    'boombet',
  ],

  // Default filter settings
  filters: {
    minProfit: -2,          // Show near-arbs (up to 2% loss)
    maxHoursUntilStart: 72, // 3 days
    nearArbThreshold: 2,    // Show opportunities up to 2% loss (near-arbs)
    valueThreshold: 5,      // Show value bets 5%+ above market average
  },

  // Sports categories for organization
  sportCategories: {
    popular: [
      'aussierules_afl',
      'rugbyleague_nrl',
      'soccer_epl',
      'basketball_nba',
      'tennis_atp',
      'tennis_wta',
      'cricket_test_match',
      'cricket_icc_world_cup',
      'americanfootball_nfl',
      'icehockey_nhl',
      'baseball_mlb',
      'mma_mixed_martial_arts',
      'boxing_boxing',
    ],
    tennis: [
      'tennis_atp',
      'tennis_wta',
      'tennis_itf_men',
      'tennis_itf_women',
      'tennis_atp_challenger',
    ],
    soccer: [
      'soccer_epl',
      'soccer_australia_aleague',
      'soccer_spain_la_liga',
      'soccer_germany_bundesliga',
      'soccer_italy_serie_a',
      'soccer_france_ligue_one',
      'soccer_uefa_champs_league',
      'soccer_uefa_europa_league',
      'soccer_usa_mls',
    ],
    basketball: [
      'basketball_nba',
      'basketball_nbl',
      'basketball_euroleague',
      'basketball_ncaab',
    ],
    aussie: [
      'aussierules_afl',
      'rugbyleague_nrl',
      'rugbyunion_super_rugby',
      'cricket_big_bash',
      'soccer_australia_aleague',
      'basketball_nbl',
    ],
  },
} as const;

export type Region = typeof config.regions[number];
