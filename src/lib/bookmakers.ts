// src/lib/bookmakers.ts
// Centralized bookmaker configuration - matches The Odds API bookmaker keys

export type BookmakerRegion = 'US' | 'UK' | 'EU' | 'AU' | 'FR' | 'SE' | 'US_DFS' | 'US_EX';
export type DisplayRegion = 'US' | 'UK' | 'EU' | 'AU' | 'ALL';

export interface BookmakerConfig {
  key: string;           // The Odds API bookmaker key
  name: string;          // Display name
  color: string;         // Brand color (background)
  textColor: string;     // Text color for contrast
  logo?: string;         // Path to logo image (if exists)
  region: BookmakerRegion;
  isPaid?: boolean;      // Only available on paid API subscriptions
}

// All bookmakers from The Odds API - organized by region
export const BOOKMAKERS: BookmakerConfig[] = [
  // ==================== US BOOKMAKERS ====================
  { key: 'betonlineag', name: 'BetOnline.ag', color: '#8B0000', textColor: '#fff', region: 'US' },
  { key: 'betmgm', name: 'BetMGM', color: '#c4a962', textColor: '#000', region: 'US' },
  { key: 'betrivers', name: 'BetRivers', color: '#1a4731', textColor: '#fff', region: 'US' },
  { key: 'betus', name: 'BetUS', color: '#00008B', textColor: '#fff', region: 'US' },
  { key: 'bovada', name: 'Bovada', color: '#cc0000', textColor: '#fff', region: 'US' },
  { key: 'williamhill_us', name: 'Caesars', color: '#0a3d2e', textColor: '#c9b037', region: 'US', isPaid: true },
  { key: 'draftkings', name: 'DraftKings', color: '#53d337', textColor: '#000', region: 'US' },
  { key: 'fanatics', name: 'Fanatics', color: '#0052cc', textColor: '#fff', region: 'US', isPaid: true },
  { key: 'fanduel', name: 'FanDuel', color: '#1493ff', textColor: '#fff', region: 'US' },
  { key: 'lowvig', name: 'LowVig.ag', color: '#228B22', textColor: '#fff', region: 'US' },
  { key: 'mybookieag', name: 'MyBookie.ag', color: '#FF6600', textColor: '#fff', region: 'US' },
  { key: 'ballybet', name: 'Bally Bet', color: '#ef3e42', textColor: '#fff', region: 'US' },
  { key: 'betanysports', name: 'BetAnything', color: '#1E90FF', textColor: '#fff', region: 'US' },
  { key: 'betparx', name: 'betPARX', color: '#FFD700', textColor: '#000', region: 'US' },
  { key: 'espnbet', name: 'ESPN BET', color: '#d00', textColor: '#fff', region: 'US' },
  { key: 'fliff', name: 'Fliff', color: '#ff6b35', textColor: '#fff', region: 'US' },
  { key: 'hardrockbet', name: 'Hard Rock Bet', color: '#000', textColor: '#f7d046', region: 'US' },
  { key: 'rebet', name: 'ReBet', color: '#4B0082', textColor: '#fff', region: 'US', isPaid: true },

  // ==================== US DFS ====================
  { key: 'betr_us_dfs', name: 'Betr Picks', color: '#00CED1', textColor: '#000', region: 'US_DFS' },
  { key: 'pick6', name: 'DraftKings Pick6', color: '#53d337', textColor: '#000', region: 'US_DFS' },
  { key: 'prizepicks', name: 'PrizePicks', color: '#6B21A8', textColor: '#fff', region: 'US_DFS' },
  { key: 'underdog', name: 'Underdog Fantasy', color: '#FACC15', textColor: '#000', region: 'US_DFS' },

  // ==================== US EXCHANGES ====================
  { key: 'betopenly', name: 'BetOpenly', color: '#0EA5E9', textColor: '#fff', region: 'US_EX' },
  { key: 'kalshi', name: 'Kalshi', color: '#111827', textColor: '#fff', region: 'US_EX' },
  { key: 'novig', name: 'Novig', color: '#10B981', textColor: '#fff', region: 'US_EX' },
  { key: 'polymarket', name: 'Polymarket', color: '#3B82F6', textColor: '#fff', region: 'US_EX' },
  { key: 'prophetx', name: 'ProphetX', color: '#8B5CF6', textColor: '#fff', region: 'US_EX' },

  // ==================== UK BOOKMAKERS ====================
  { key: 'sport888', name: '888sport', color: '#1d1d1d', textColor: '#f90', region: 'UK' },
  { key: 'betfair_ex_uk', name: 'Betfair Exchange', color: '#ffb80c', textColor: '#000', region: 'UK' },
  { key: 'betfair_sb_uk', name: 'Betfair Sportsbook', color: '#ffb80c', textColor: '#000', region: 'UK' },
  { key: 'betvictor', name: 'BetVictor', color: '#cc0001', textColor: '#fff', region: 'UK' },
  { key: 'betway', name: 'Betway', color: '#00a826', textColor: '#fff', region: 'UK' },
  { key: 'boylesports', name: 'BoyleSports', color: '#00a651', textColor: '#fff', region: 'UK' },
  { key: 'casumo', name: 'Casumo', color: '#7B2D8E', textColor: '#fff', region: 'UK' },
  { key: 'coral', name: 'Coral', color: '#003c71', textColor: '#ffc72c', region: 'UK' },
  { key: 'grosvenor', name: 'Grosvenor', color: '#000', textColor: '#C5A572', region: 'UK' },
  { key: 'ladbrokes_uk', name: 'Ladbrokes', color: '#d5001f', textColor: '#fff', region: 'UK' },
  { key: 'leovegas', name: 'LeoVegas', color: '#FF6600', textColor: '#fff', region: 'UK' },
  { key: 'livescorebet', name: 'LiveScore Bet', color: '#ff6b00', textColor: '#fff', region: 'UK' },
  { key: 'matchbook', name: 'Matchbook', color: '#00A86B', textColor: '#fff', region: 'UK' },
  { key: 'paddypower', name: 'Paddy Power', color: '#004833', textColor: '#fff', region: 'UK' },
  { key: 'skybet', name: 'Sky Bet', color: '#004990', textColor: '#fff', region: 'UK' },
  { key: 'smarkets', name: 'Smarkets', color: '#3577D4', textColor: '#fff', region: 'UK' },
  { key: 'unibet_uk', name: 'Unibet', color: '#147b45', textColor: '#fff', region: 'UK' },
  { key: 'virginbet', name: 'Virgin Bet', color: '#e10a0a', textColor: '#fff', region: 'UK' },
  { key: 'williamhill', name: 'William Hill', color: '#002d5c', textColor: '#fff', region: 'UK' },

  // ==================== EU BOOKMAKERS ====================
  { key: 'onexbet', name: '1xBet', color: '#1d5b99', textColor: '#fff', region: 'EU' },
  { key: 'betclic_fr', name: 'Betclic', color: '#d4001a', textColor: '#fff', region: 'EU' },
  { key: 'betfair_ex_eu', name: 'Betfair Exchange', color: '#ffb80c', textColor: '#000', region: 'EU' },
  { key: 'betsson', name: 'Betsson', color: '#000', textColor: '#FFD700', region: 'EU' },
  { key: 'codere_it', name: 'Codere', color: '#006847', textColor: '#fff', region: 'EU' },
  { key: 'coolbet', name: 'Coolbet', color: '#1E3A5F', textColor: '#fff', region: 'EU' },
  { key: 'everygame', name: 'Everygame', color: '#B22222', textColor: '#fff', region: 'EU' },
  { key: 'gtbets', name: 'GTbets', color: '#FF4500', textColor: '#fff', region: 'EU' },
  { key: 'leovegas_se', name: 'LeoVegas', color: '#FF6600', textColor: '#fff', region: 'EU' },
  { key: 'marathonbet', name: 'Marathon Bet', color: '#0033A0', textColor: '#fff', region: 'EU' },
  { key: 'nordicbet', name: 'NordicBet', color: '#00205B', textColor: '#fff', region: 'EU' },
  { key: 'parionssport_fr', name: 'Parions Sport', color: '#009639', textColor: '#fff', region: 'EU' },
  { key: 'pinnacle', name: 'Pinnacle', color: '#002e6d', textColor: '#c9a227', region: 'EU' },
  { key: 'pmu_fr', name: 'PMU', color: '#003d2d', textColor: '#fff', region: 'EU' },
  { key: 'suprabets', name: 'Suprabets', color: '#8B0000', textColor: '#FFD700', region: 'EU' },
  { key: 'tipico_de', name: 'Tipico', color: '#1A1A1A', textColor: '#FFD700', region: 'EU' },
  { key: 'unibet_fr', name: 'Unibet FR', color: '#147b45', textColor: '#fff', region: 'EU' },
  { key: 'unibet_it', name: 'Unibet IT', color: '#147b45', textColor: '#fff', region: 'EU' },
  { key: 'unibet_nl', name: 'Unibet NL', color: '#147b45', textColor: '#fff', region: 'EU' },
  { key: 'unibet_se', name: 'Unibet SE', color: '#147b45', textColor: '#fff', region: 'EU' },
  { key: 'winamax_de', name: 'Winamax DE', color: '#c8102e', textColor: '#fff', region: 'EU' },
  { key: 'winamax_fr', name: 'Winamax FR', color: '#c8102e', textColor: '#fff', region: 'EU' },

  // ==================== FR BOOKMAKERS ====================
  { key: 'netbet_fr', name: 'NetBet', color: '#00A651', textColor: '#fff', region: 'FR' },

  // ==================== SE BOOKMAKERS ====================
  { key: 'atg_se', name: 'ATG', color: '#003366', textColor: '#FFD700', region: 'SE' },
  { key: 'mrgreen_se', name: 'Mr Green', color: '#006400', textColor: '#fff', region: 'SE' },
  { key: 'svenskaspel_se', name: 'Svenska Spel', color: '#0066CC', textColor: '#fff', region: 'SE' },

  // ==================== AU BOOKMAKERS ====================
  { key: 'betfair_ex_au', name: 'Betfair Exchange', color: '#ffb80c', textColor: '#000', region: 'AU' },
  { key: 'betr_au', name: 'Betr', color: '#00CED1', textColor: '#000', region: 'AU' },
  { key: 'betright', name: 'Bet Right', color: '#FF1493', textColor: '#fff', region: 'AU' },
  { key: 'bet365_au', name: 'Bet365', color: '#027b5b', textColor: '#ffdf1a', region: 'AU', isPaid: true },
  { key: 'boombet', name: 'BoomBet', color: '#ff4500', textColor: '#fff', region: 'AU' },
  { key: 'dabble_au', name: 'Dabble', color: '#6c5ce7', textColor: '#fff', region: 'AU', isPaid: true },
  { key: 'ladbrokes_au', name: 'Ladbrokes', color: '#d5001f', textColor: '#fff', region: 'AU' },
  { key: 'neds', name: 'Neds', color: '#ff9800', textColor: '#000', region: 'AU' },
  { key: 'playup', name: 'PlayUp', color: '#1a1a2e', textColor: '#00d4ff', region: 'AU' },
  { key: 'pointsbetau', name: 'PointsBet', color: '#e44122', textColor: '#fff', region: 'AU' },
  { key: 'sportsbet', name: 'Sportsbet', color: '#ff5722', textColor: '#fff', region: 'AU' },
  { key: 'tab', name: 'TAB', color: '#f26522', textColor: '#fff', region: 'AU' },
  { key: 'tabtouch', name: 'TABtouch', color: '#E31837', textColor: '#fff', region: 'AU' },
  { key: 'unibet', name: 'Unibet', color: '#147b45', textColor: '#fff', region: 'AU' },
];

// Create a lookup map for quick access by key
export const BOOKMAKER_MAP: Record<string, BookmakerConfig> = BOOKMAKERS.reduce(
  (acc, book) => {
    acc[book.key] = book;
    return acc;
  },
  {} as Record<string, BookmakerConfig>
);

// Get bookmaker by key with fallback
export function getBookmaker(key: string): BookmakerConfig | undefined {
  return BOOKMAKER_MAP[key];
}

// Get bookmakers by display region (for UI grouping)
export function getBookmakersByDisplayRegion(region: DisplayRegion): BookmakerConfig[] {
  if (region === 'ALL') {
    // Return unique bookmakers (some appear in multiple regions)
    const seen = new Set<string>();
    return BOOKMAKERS.filter(book => {
      if (seen.has(book.key)) return false;
      seen.add(book.key);
      return true;
    });
  }

  // Map display regions to API regions
  const regionMapping: Record<Exclude<DisplayRegion, 'ALL'>, BookmakerRegion[]> = {
    US: ['US', 'US_DFS', 'US_EX'],
    UK: ['UK'],
    EU: ['EU', 'FR', 'SE'],
    AU: ['AU'],
  };

  const apiRegions = regionMapping[region];
  return BOOKMAKERS.filter(book => apiRegions.includes(book.region));
}

// Get abbreviation for logo fallback
export function getBookmakerAbbr(name: string): string {
  // Special cases
  const specialAbbrs: Record<string, string> = {
    'bet365': '365',
    'Bet365': '365',
    '888sport': '888',
    '1xBet': '1X',
    'BetMGM': 'MGM',
    'DraftKings': 'DK',
    'FanDuel': 'FD',
    'Caesars': 'CZ',
    'PointsBet': 'PB',
    'Betfair Exchange': 'BF',
    'Betfair Sportsbook': 'BF',
    'William Hill': 'WH',
    'Paddy Power': 'PP',
    'Hard Rock Bet': 'HR',
    'ESPN BET': 'ESPN',
    'LeoVegas': 'LV',
    'BetVictor': 'BV',
    'LiveScore Bet': 'LS',
    'PrizePicks': 'PP',
    'Underdog Fantasy': 'UD',
  };

  if (specialAbbrs[name]) {
    return specialAbbrs[name];
  }

  // Default: first letters of each word, max 3 chars
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

// Check if logo exists (for runtime checking)
export function getLogoPath(key: string): string {
  return `/books/${key}.png`;
}

// Featured bookmakers for the slider (popular ones from each region)
export const FEATURED_BOOKMAKERS: string[] = [
  'draftkings',
  'fanduel',
  'betmgm',
  'williamhill_us',
  'espnbet',
  'betrivers',
  'sport888',
  'betfair_ex_uk',
  'williamhill',
  'paddypower',
  'skybet',
  'ladbrokes_uk',
  'pinnacle',
  'onexbet',
  'betsson',
  'unibet_uk',
  'sportsbet',
  'tab',
  'ladbrokes_au',
  'pointsbetau',
  'neds',
  'betfair_ex_au',
];

// Get featured bookmakers config
export function getFeaturedBookmakers(): BookmakerConfig[] {
  return FEATURED_BOOKMAKERS
    .map(key => BOOKMAKER_MAP[key])
    .filter((book): book is BookmakerConfig => book !== undefined);
}