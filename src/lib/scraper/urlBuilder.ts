// src/lib/scraper/urlBuilder.ts
// Lightweight URL construction for bookmaker event pages
// No Puppeteer - instant URL generation

export interface BookmakerUrlInfo {
  eventUrl: string | null;      // Direct event URL if constructable
  competitionUrl: string | null; // Competition page URL (fallback)
  searchUrl: string | null;      // Search URL (last resort)
  needsScraping: boolean;        // True if we can't construct direct URL
}

export interface BookmakerUrls {
  [bookmaker: string]: BookmakerUrlInfo;
}

// Sport key mappings for each bookmaker
const TAB_SPORT_MAPPING: Record<string, { sport: string; competition: string }> = {
  'basketball_nba': { sport: 'Basketball', competition: 'NBA' },
  'basketball_ncaab': { sport: 'Basketball', competition: 'NCAA Basketball' },
  'basketball_euroleague': { sport: 'Basketball', competition: 'Euroleague' },
  'basketball_nbl': { sport: 'Basketball', competition: 'NBL' },
  'americanfootball_nfl': { sport: 'American Football', competition: 'NFL' },
  'americanfootball_ncaaf': { sport: 'American Football', competition: 'NCAA Football' },
  'icehockey_nhl': { sport: 'Ice Hockey', competition: 'NHL' },
  'baseball_mlb': { sport: 'Baseball', competition: 'MLB' },
  'aussierules_afl': { sport: 'Australian Rules', competition: 'AFL' },
  'rugbyleague_nrl': { sport: 'Rugby League', competition: 'NRL' },
  'soccer_epl': { sport: 'Soccer', competition: 'English Premier League' },
  'soccer_australia_aleague': { sport: 'Soccer', competition: 'A-League Men' },
  'tennis_atp_aus_open': { sport: 'Tennis', competition: 'Australian Open' },
  'mma_mixed_martial_arts': { sport: 'MMA', competition: 'UFC' },
  'golf_pga_championship': { sport: 'Golf', competition: 'PGA Championship' },
};

const POINTSBET_SPORT_MAPPING: Record<string, string> = {
  'basketball_nba': '/sports/basketball/NBA',
  'basketball_ncaab': '/sports/basketball/NCAA',
  'americanfootball_nfl': '/sports/american-football/NFL',
  'americanfootball_ncaaf': '/sports/american-football/NCAAF',
  'icehockey_nhl': '/sports/ice-hockey/NHL',
  'baseball_mlb': '/sports/baseball/MLB',
  'aussierules_afl': '/sports/aussie-rules/AFL',
  'rugbyleague_nrl': '/sports/rugby-league/NRL',
  'soccer_epl': '/sports/soccer/EPL',
  'soccer_australia_aleague': '/sports/soccer/A-League',
};

const SPORTSBET_SPORT_MAPPING: Record<string, string> = {
  'basketball_nba': '/betting/basketball/nba',
  'basketball_ncaab': '/betting/basketball/ncaa-basketball',
  'americanfootball_nfl': '/betting/american-football/nfl',
  'americanfootball_ncaaf': '/betting/american-football/ncaa-football',
  'icehockey_nhl': '/betting/ice-hockey/nhl',
  'baseball_mlb': '/betting/baseball/mlb',
  'aussierules_afl': '/betting/australian-rules/afl',
  'rugbyleague_nrl': '/betting/rugby-league/nrl',
  'soccer_epl': '/betting/soccer/england-premier-league',
  'soccer_australia_aleague': '/betting/soccer/australia-a-league',
};

const LADBROKES_SPORT_MAPPING: Record<string, string> = {
  'basketball_nba': '/sports/basketball/usa/nba',
  'basketball_ncaab': '/sports/basketball/usa/ncaa',
  'americanfootball_nfl': '/sports/american-football/nfl',
  'icehockey_nhl': '/sports/ice-hockey/nhl',
  'aussierules_afl': '/sports/australian-rules/australia/afl',
  'rugbyleague_nrl': '/sports/rugby-league/australia/nrl',
  'soccer_epl': '/sports/soccer/england/premier-league',
};

const NEDS_SPORT_MAPPING: Record<string, string> = {
  'basketball_nba': '/sports/basketball/usa/nba',
  'basketball_ncaab': '/sports/basketball/usa/ncaa',
  'americanfootball_nfl': '/sports/american-football/nfl',
  'icehockey_nhl': '/sports/ice-hockey/nhl',
  'aussierules_afl': '/sports/australian-rules/australia/afl',
  'rugbyleague_nrl': '/sports/rugby-league/australia/nrl',
  'soccer_epl': '/sports/soccer/england/premier-league',
};

const UNIBET_SPORT_MAPPING: Record<string, string> = {
  'basketball_nba': '/betting/sports/filter/basketball/nba',
  'basketball_ncaab': '/betting/sports/filter/basketball/ncaa',
  'americanfootball_nfl': '/betting/sports/filter/american_football/nfl',
  'icehockey_nhl': '/betting/sports/filter/ice_hockey/nhl',
  'aussierules_afl': '/betting/sports/filter/australian_rules/afl',
  'rugbyleague_nrl': '/betting/sports/filter/rugby_league/nrl',
};

const BETRIGHT_SPORT_MAPPING: Record<string, string> = {
  'basketball_nba': '/sports/basketball/usa/nba',
  'basketball_ncaab': '/sports/basketball/usa/ncaa-mens',
  'americanfootball_nfl': '/sports/american-football/usa/nfl',
  'aussierules_afl': '/sports/australian-rules/australia/afl',
  'rugbyleague_nrl': '/sports/rugby-league/australia/nrl',
};

/**
 * Normalize bookmaker key from various formats
 * e.g., "PointsBet (AU)" -> "pointsbet"
 */
function normalizeBookmakerKey(bookmaker: string): string {
  return bookmaker
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, '') // Remove (AU), (UK), etc.
    .replace(/[^a-z0-9]/g, '')    // Remove special chars
    .replace(/au$/, '');           // Remove trailing 'au'
}

/**
 * Build TAB URL - can construct direct event URL
 */
function buildTabUrl(sportKey: string, homeTeam: string, awayTeam: string): BookmakerUrlInfo {
  const sportInfo = TAB_SPORT_MAPPING[sportKey];
  
  if (!sportInfo) {
    return {
      eventUrl: null,
      competitionUrl: null,
      searchUrl: `https://www.tab.com.au/search?query=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`,
      needsScraping: false,
    };
  }
  
  // TAB uses predictable URL structure
  const matchName = `${homeTeam} v ${awayTeam}`;
  const eventUrl = `https://www.tab.com.au/sports/betting/${encodeURIComponent(sportInfo.sport)}/competitions/${encodeURIComponent(sportInfo.competition)}/matches/${encodeURIComponent(matchName)}`;
  const competitionUrl = `https://www.tab.com.au/sports/betting/${encodeURIComponent(sportInfo.sport)}/competitions/${encodeURIComponent(sportInfo.competition)}`;
  
  return {
    eventUrl,
    competitionUrl,
    searchUrl: `https://www.tab.com.au/search?query=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`,
    needsScraping: false, // TAB URLs are predictable
  };
}

/**
 * Build PointsBet URL - needs scraping for exact event URL
 */
function buildPointsBetUrl(sportKey: string, homeTeam: string, awayTeam: string): BookmakerUrlInfo {
  const sportPath = POINTSBET_SPORT_MAPPING[sportKey];
  const baseUrl = 'https://pointsbet.com.au';
  
  if (!sportPath) {
    return {
      eventUrl: null,
      competitionUrl: null,
      searchUrl: `${baseUrl}/search?q=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`,
      needsScraping: true,
    };
  }
  
  return {
    eventUrl: null, // PointsBet uses internal IDs - need to scrape or find on page
    competitionUrl: `${baseUrl}${sportPath}`,
    searchUrl: `${baseUrl}/search?q=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`,
    needsScraping: true, // PointsBet needs event finding on competition page
  };
}

/**
 * Build Sportsbet URL - can search by team names
 */
function buildSportsbetUrl(sportKey: string, homeTeam: string, awayTeam: string): BookmakerUrlInfo {
  const sportPath = SPORTSBET_SPORT_MAPPING[sportKey];
  const baseUrl = 'https://www.sportsbet.com.au';
  
  const searchQuery = `${homeTeam} vs ${awayTeam}`;
  
  if (!sportPath) {
    return {
      eventUrl: null,
      competitionUrl: null,
      searchUrl: `${baseUrl}/search?query=${encodeURIComponent(searchQuery)}`,
      needsScraping: true,
    };
  }
  
  return {
    eventUrl: null,
    competitionUrl: `${baseUrl}${sportPath}`,
    searchUrl: `${baseUrl}/search?query=${encodeURIComponent(searchQuery)}`,
    needsScraping: true,
  };
}

/**
 * Build Ladbrokes URL
 */
function buildLadbrokesUrl(sportKey: string, homeTeam: string, awayTeam: string): BookmakerUrlInfo {
  const sportPath = LADBROKES_SPORT_MAPPING[sportKey];
  const baseUrl = 'https://www.ladbrokes.com.au';
  
  const searchQuery = `${homeTeam} ${awayTeam}`;
  
  if (!sportPath) {
    return {
      eventUrl: null,
      competitionUrl: null,
      searchUrl: `${baseUrl}/search?query=${encodeURIComponent(searchQuery)}`,
      needsScraping: true,
    };
  }
  
  return {
    eventUrl: null,
    competitionUrl: `${baseUrl}${sportPath}`,
    searchUrl: `${baseUrl}/search?query=${encodeURIComponent(searchQuery)}`,
    needsScraping: true,
  };
}

/**
 * Build Neds URL
 */
function buildNedsUrl(sportKey: string, homeTeam: string, awayTeam: string): BookmakerUrlInfo {
  const sportPath = NEDS_SPORT_MAPPING[sportKey];
  const baseUrl = 'https://www.neds.com.au';
  
  const searchQuery = `${homeTeam} ${awayTeam}`;
  
  if (!sportPath) {
    return {
      eventUrl: null,
      competitionUrl: null,
      searchUrl: `${baseUrl}/search?query=${encodeURIComponent(searchQuery)}`,
      needsScraping: true,
    };
  }
  
  return {
    eventUrl: null,
    competitionUrl: `${baseUrl}${sportPath}`,
    searchUrl: `${baseUrl}/search?query=${encodeURIComponent(searchQuery)}`,
    needsScraping: true,
  };
}

/**
 * Build Unibet URL
 */
function buildUnibetUrl(sportKey: string, homeTeam: string, awayTeam: string): BookmakerUrlInfo {
  const sportPath = UNIBET_SPORT_MAPPING[sportKey];
  const baseUrl = 'https://www.unibet.com.au';
  
  if (!sportPath) {
    return {
      eventUrl: null,
      competitionUrl: null,
      searchUrl: `${baseUrl}/betting/sports/filter?query=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`,
      needsScraping: true,
    };
  }
  
  return {
    eventUrl: null,
    competitionUrl: `${baseUrl}${sportPath}`,
    searchUrl: `${baseUrl}/betting/sports/filter?query=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`,
    needsScraping: true,
  };
}

/**
 * Build BetRight URL
 */
function buildBetRightUrl(sportKey: string, homeTeam: string, awayTeam: string): BookmakerUrlInfo {
  const sportPath = BETRIGHT_SPORT_MAPPING[sportKey];
  const baseUrl = 'https://www.betright.com.au';
  
  if (!sportPath) {
    return {
      eventUrl: null,
      competitionUrl: null,
      searchUrl: `${baseUrl}/search?q=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`,
      needsScraping: true,
    };
  }
  
  return {
    eventUrl: null,
    competitionUrl: `${baseUrl}${sportPath}`,
    searchUrl: `${baseUrl}/search?q=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`,
    needsScraping: true,
  };
}

/**
 * Build URLs for a single bookmaker
 */
function buildBookmakerUrl(
  bookmaker: string,
  sportKey: string,
  homeTeam: string,
  awayTeam: string
): BookmakerUrlInfo {
  const normalizedKey = normalizeBookmakerKey(bookmaker);
  
  switch (normalizedKey) {
    case 'tab':
    case 'tabtouch':
      return buildTabUrl(sportKey, homeTeam, awayTeam);
      
    case 'pointsbet':
      return buildPointsBetUrl(sportKey, homeTeam, awayTeam);
      
    case 'sportsbet':
      return buildSportsbetUrl(sportKey, homeTeam, awayTeam);
      
    case 'ladbrokes':
      return buildLadbrokesUrl(sportKey, homeTeam, awayTeam);
      
    case 'neds':
      return buildNedsUrl(sportKey, homeTeam, awayTeam);
      
    case 'unibet':
      return buildUnibetUrl(sportKey, homeTeam, awayTeam);
      
    case 'betright':
      return buildBetRightUrl(sportKey, homeTeam, awayTeam);
      
    default:
      // Unknown bookmaker - try generic search
      console.log(`[UrlBuilder] Unknown bookmaker: ${bookmaker}`);
      return {
        eventUrl: null,
        competitionUrl: null,
        searchUrl: null,
        needsScraping: true,
      };
  }
}

/**
 * Build URLs for all bookmakers involved in an arb
 * This is the main function called from auto-scan
 */
export function buildEventUrls(
  sportKey: string,
  homeTeam: string,
  awayTeam: string,
  bookmakers: string[]
): BookmakerUrls {
  const urls: BookmakerUrls = {};
  
  for (const bookmaker of bookmakers) {
    urls[bookmaker] = buildBookmakerUrl(bookmaker, sportKey, homeTeam, awayTeam);
  }
  
  return urls;
}

/**
 * Get the best available URL for a bookmaker
 * Priority: eventUrl > competitionUrl > searchUrl
 */
export function getBestUrl(urlInfo: BookmakerUrlInfo): string | null {
  return urlInfo.eventUrl || urlInfo.competitionUrl || urlInfo.searchUrl;
}

/**
 * Simplified function - returns just the best URL string for each bookmaker
 */
export function buildSimpleEventUrls(
  sportKey: string,
  homeTeam: string,
  awayTeam: string,
  bookmakers: string[]
): Record<string, string | null> {
  const fullUrls = buildEventUrls(sportKey, homeTeam, awayTeam, bookmakers);
  const simpleUrls: Record<string, string | null> = {};
  
  for (const [bookmaker, urlInfo] of Object.entries(fullUrls)) {
    simpleUrls[bookmaker] = getBestUrl(urlInfo);
  }
  
  return simpleUrls;
}

/**
 * Get full URL info for extension (includes all URL types)
 */
export function buildFullEventUrls(
  sportKey: string,
  homeTeam: string,
  awayTeam: string,
  bookmakers: string[]
): Record<string, { eventUrl: string | null; competitionUrl: string | null; searchUrl: string | null }> {
  const fullUrls = buildEventUrls(sportKey, homeTeam, awayTeam, bookmakers);
  const result: Record<string, { eventUrl: string | null; competitionUrl: string | null; searchUrl: string | null }> = {};
  
  for (const [bookmaker, urlInfo] of Object.entries(fullUrls)) {
    result[bookmaker] = {
      eventUrl: urlInfo.eventUrl,
      competitionUrl: urlInfo.competitionUrl,
      searchUrl: urlInfo.searchUrl,
    };
  }
  
  return result;
}