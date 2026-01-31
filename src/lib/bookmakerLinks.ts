// src/lib/bookmakerLinks.ts

/**
 * Bookmaker URLs with support for deep links from crawler
 * 
 * The buildBookmakerUrl function now supports both:
 * 1. Cached deep links (from crawler database)
 * 2. Fallback to homepage if no deep link available
 */

// Accept basically anything because upstream types can be loose.
type AnyInput = unknown;

interface EventInfo {
  home_team?: string;
  away_team?: string;
  sport_key?: string;
  sport_title?: string;
  commence_time?: string;
  // Pre-fetched deep link URL from crawler
  deep_link?: string | null;
}

function toCleanString(v: AnyInput): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  if (typeof v === "number" || typeof v === "boolean") return String(v);

  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const maybe =
      (typeof obj.key === "string" && obj.key) ||
      (typeof obj.bookmaker === "string" && obj.bookmaker) ||
      (typeof obj.name === "string" && obj.name) ||
      (typeof obj.title === "string" && obj.title) ||
      "";
    if (maybe) return maybe;
    return "";
  }

  return "";
}

function normalizeKey(v: AnyInput): string {
  const s = toCleanString(v);
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
}

/**
 * Canonical homepage URLs
 */
const BOOKMAKER_URLS: Record<string, string> = {
  // ---------- AU ----------
  betfair_ex_au: "https://www.betfair.com.au",
  betr_au: "https://www.betr.com.au",
  betright: "https://www.betright.com.au",
  bet365_au: "https://www.bet365.com.au",
  boombet: "https://www.boombet.com.au",
  dabble_au: "https://www.dabble.com.au",
  ladbrokes_au: "https://www.ladbrokes.com.au",
  neds: "https://www.neds.com.au",
  playup: "https://www.playup.com.au",
  pointsbetau: "https://www.pointsbet.com.au",
  pointsbet_au: "https://www.pointsbet.com.au",
  sportsbet: "https://www.sportsbet.com.au",
  tab: "https://www.tab.com.au",
  tabtouch: "https://www.tabtouch.com.au",
  unibet_au: "https://www.unibet.com.au",
  bluebet: "https://www.bluebet.com.au",

  // ---------- UK ----------
  sport888: "https://www.888sport.com",
  betfair_ex_uk: "https://www.betfair.com",
  betfair_sb_uk: "https://www.betfair.com/sport",
  betvictor: "https://www.betvictor.com",
  betway: "https://www.betway.com",
  boylesports: "https://www.boylesports.com",
  casumo: "https://www.casumo.com/en-gb/sports",
  coral: "https://www.coral.co.uk",
  grosvenor: "https://www.grosvenorsport.com",
  ladbrokes_uk: "https://www.ladbrokes.com",
  leovegas: "https://www.leovegas.com",
  livescorebet: "https://www.livescorebet.com",
  matchbook: "https://www.matchbook.com",
  paddypower: "https://www.paddypower.com",
  skybet: "https://www.skybet.com",
  smarkets: "https://www.smarkets.com",
  unibet_uk: "https://www.unibet.co.uk",
  virginbet: "https://www.virginbet.com",
  williamhill: "https://www.williamhill.com",

  // ---------- US ----------
  betonlineag: "https://www.betonline.ag",
  betmgm: "https://www.betmgm.com",
  betrivers: "https://www.betrivers.com",
  betus: "https://www.betus.com.pa",
  bovada: "https://www.bovada.lv",
  draftkings: "https://www.draftkings.com",
  fanduel: "https://www.fanduel.com",
  lowvig: "https://www.lowvig.ag",
  mybookieag: "https://www.mybookie.ag",
  williamhill_us: "https://www.caesars.com/sportsbook-and-casino",
  fanatics: "https://sportsbook.fanatics.com",
  ballybet: "https://www.ballybet.com",
  betanysports: "https://www.betanysports.eu",
  betparx: "https://www.betparx.com",
  espnbet: "https://www.espnbet.com",
  fliff: "https://www.fliff.com",
  hardrockbet: "https://www.hardrock.bet",
  rebet: "https://www.rebet.app",

  // ---------- DFS ----------
  betr_us_dfs: "https://www.betr.app",
  pick6: "https://pick6.draftkings.com",
  prizepicks: "https://www.prizepicks.com",
  underdog: "https://underdogfantasy.com",

  // ---------- Exchanges ----------
  betopenly: "https://www.betopenly.com",
  kalshi: "https://www.kalshi.com",
  novig: "https://www.novig.com",
  polymarket: "https://www.polymarket.com",
  prophetx: "https://www.prophetx.co",

  // ---------- EU ----------
  onexbet: "https://www.1xbet.com",
  betclic_fr: "https://www.betclic.fr",
  betfair_ex_eu: "https://www.betfair.com",
  betsson: "https://www.betsson.com",
  codere_it: "https://www.codere.it",
  coolbet: "https://www.coolbet.com",
  everygame: "https://www.everygame.eu",
  gtbets: "https://www.gtbets.ag",
  leovegas_se: "https://www.leovegas.se",
  marathonbet: "https://www.marathonbet.com",
  nordicbet: "https://www.nordicbet.com",
  parionssport_fr: "https://www.enligne.parionssport.fdj.fr",
  pinnacle: "https://www.pinnacle.com",
  pmu_fr: "https://www.pmu.fr",
  suprabets: "https://www.suprabets.com",
  tipico_de: "https://www.tipico.de",
  unibet_fr: "https://www.unibet.fr",
  unibet_it: "https://www.unibet.it",
  unibet_nl: "https://www.unibet.nl",
  unibet_se: "https://www.unibet.se",
  unibet_eu: "https://www.unibet.eu",
  winamax_de: "https://www.winamax.de",
  winamax_fr: "https://www.winamax.fr",
  netbet_fr: "https://www.netbet.fr",
  atg_se: "https://www.atg.se",
  mrgreen_se: "https://www.mrgreen.se",
  svenskaspel_se: "https://www.svenskaspel.se",
};

/**
 * Aliases to map API keys to our canonical keys
 */
const BOOKMAKER_ALIASES: Record<string, string> = {
  // Betfair (AU)
  betfair: "betfair_ex_au",
  betfair_au: "betfair_ex_au",
  betfair_exchange: "betfair_ex_au",
  betfair_ex: "betfair_ex_au",
  betfair_exau: "betfair_ex_au",
  betfair_ex_au: "betfair_ex_au",

  // Betfair (UK/EU)
  betfair_ex_uk: "betfair_ex_uk",
  betfair_sb_uk: "betfair_sb_uk",
  betfair_ex_eu: "betfair_ex_eu",

  // BetRight (AU)
  bet_right: "betright",
  betright_au: "betright",
  betright: "betright",

  // PointsBet (AU)
  pointsbet: "pointsbet_au",
  pointsbetau: "pointsbet_au",
  pointsbet_au: "pointsbet_au",

  // Common AU drift
  unibet: "unibet_au",
  unibet_au: "unibet_au",
  ladbrokes: "ladbrokes_au",
  ladbrokes_au: "ladbrokes_au",
  betr: "betr_au",
  betr_au: "betr_au",
  bet365au: "bet365_au",
  bet365_au: "bet365_au",
  tab_au: "tab",
  tab: "tab",
  sports_bet: "sportsbet",
  sportsbet: "sportsbet",
  bluebet: "bluebet",
  bluebet_au: "bluebet",
};

/**
 * Display name fallbacks
 */
const BOOKMAKER_NAME_FALLBACKS: Record<string, string> = {
  betfair: "betfair_ex_au",
  "betfair exchange": "betfair_ex_au",
  betright: "betright",
  "bet right": "betright",
  pointsbet: "pointsbet_au",
  "pointsbet (au)": "pointsbet_au",
  unibet: "unibet_au",
  "unibet (au)": "unibet_au",
  ladbrokes: "ladbrokes_au",
  "ladbrokes (au)": "ladbrokes_au",
  betr: "betr_au",
  "betr (au)": "betr_au",
  "bet365 (au)": "bet365_au",
  "bet 365 (au)": "bet365_au",
  sportsbet: "sportsbet",
  tab: "tab",
  tabtouch: "tabtouch",
  neds: "neds",
  playup: "playup",
  dabble: "dabble_au",
  boombet: "boombet",
  bluebet: "bluebet",
};

/**
 * Get canonical bookmaker key
 */
export function getCanonicalBookmaker(bookmakerKey: AnyInput): string {
  const key = normalizeKey(bookmakerKey);
  return BOOKMAKER_ALIASES[key] ?? key;
}

/**
 * Get bookmaker homepage URL
 */
export function getBookmakerUrl(bookmakerKey: AnyInput, bookmakerName?: AnyInput): string | null {
  const key = normalizeKey(bookmakerKey);
  const canonical = BOOKMAKER_ALIASES[key] ?? key;

  if (BOOKMAKER_URLS[canonical]) return BOOKMAKER_URLS[canonical];

  const nameKey = normalizeKey(bookmakerName);
  const nameCanonical = BOOKMAKER_NAME_FALLBACKS[nameKey];
  if (nameCanonical && BOOKMAKER_URLS[nameCanonical]) return BOOKMAKER_URLS[nameCanonical];

  return null;
}

/**
 * Build a bookmaker URL - uses deep link if available, otherwise homepage
 * 
 * Usage:
 * ```tsx
 * // With pre-fetched deep link
 * const url = buildBookmakerSearchUrl(bookmaker, { 
 *   home_team: 'Lakers', 
 *   away_team: 'Celtics',
 *   deep_link: opp.deepLinks?.[bookmaker] // from crawler
 * });
 * 
 * // Without deep link (falls back to homepage)
 * const url = buildBookmakerSearchUrl(bookmaker);
 * ```
 */
export function buildBookmakerSearchUrl(
  bookmakerKey: AnyInput, 
  eventInfo?: EventInfo | AnyInput
): string | null {
  // If a pre-fetched deep link is provided, use it
  if (eventInfo && typeof eventInfo === 'object' && 'deep_link' in eventInfo) {
    const info = eventInfo as EventInfo;
    if (info.deep_link) {
      return info.deep_link;
    }
  }
  
  // Fall back to homepage
  return getBookmakerUrl(bookmakerKey);
}

/**
 * Check if a bookmaker is supported
 */
export function isBookmakerSupported(bookmakerKey: AnyInput): boolean {
  return getBookmakerUrl(bookmakerKey) !== null;
}

/**
 * Get all supported bookmaker keys
 */
export function getSupportedBookmakers(): string[] {
  return Object.keys(BOOKMAKER_URLS);
}