// src/lib/bookmakerLinks.ts

/**
 * Bookmaker homepage links.
 * Odds APIs generally do NOT provide stable deep links to specific events.
 * We resolve a bookmaker "key" (and optionally a display title) to a homepage URL.
 */

// Accept basically anything because upstream types can be loose.
type AnyInput = unknown;

function toCleanString(v: AnyInput): string {
  // Fast paths
  if (typeof v === "string") return v;
  if (v == null) return "";

  // Numbers / booleans
  if (typeof v === "number" || typeof v === "boolean") return String(v);

  // Common bookmaker object shapes (defensive)
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const maybe =
      (typeof obj.key === "string" && obj.key) ||
      (typeof obj.bookmaker === "string" && obj.bookmaker) ||
      (typeof obj.name === "string" && obj.name) ||
      (typeof obj.title === "string" && obj.title) ||
      "";
    if (maybe) return maybe;

    // Last resort: don't stringify huge objects; just return empty to avoid garbage keys
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
 * Canonical homepage URLs (our internal canonical keys).
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
  pointsbet_au: "https://www.pointsbet.com.au",
  sportsbet: "https://www.sportsbet.com.au",
  tab: "https://www.tab.com.au",
  tabtouch: "https://www.tabtouch.com.au",
  unibet_au: "https://www.unibet.com.au",

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

  // ---------- US 2 ----------
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

  // ---------- FR ----------
  netbet_fr: "https://www.netbet.fr",

  // ---------- SE ----------
  atg_se: "https://www.atg.se",
  mrgreen_se: "https://www.mrgreen.se",
  svenskaspel_se: "https://www.svenskaspel.se",
};

/**
 * Aliases: map whatever the API gives you -> our canonical key in BOOKMAKER_URLS.
 * (Fixes Betfair/BetRight/PointsBet + common naming drift.)
 */
const BOOKMAKER_ALIASES: Record<string, string> = {
  // ---- Betfair (AU) ----
  betfair: "betfair_ex_au",
  betfair_au: "betfair_ex_au",
  betfair_exchange: "betfair_ex_au",
  betfair_ex: "betfair_ex_au",
  betfair_exau: "betfair_ex_au",
  betfair_ex_au: "betfair_ex_au",

  // ---- Betfair (UK/EU) ----
  betfair_ex_uk: "betfair_ex_uk",
  betfair_sb_uk: "betfair_sb_uk",
  betfair_ex_eu: "betfair_ex_eu",

  // ---- BetRight (AU) ----
  bet_right: "betright",
  betright_au: "betright",
  betright: "betright",

  // ---- PointsBet (AU) ----
  pointsbet: "pointsbet_au",
  pointsbetau: "pointsbet_au",
  pointsbet_au: "pointsbet_au",

  // ---- Common AU drift ----
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
};

/**
 * Optional fallback by DISPLAY name if caller passes "PointsBet (AU)" etc.
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
};

/**
 * Resolve a bookmaker homepage URL.
 * Returns null if not supported (so your UI can show "Link unavailable" instead of "#").
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
 * Build a bookmaker link (homepage).
 */
export function buildBookmakerSearchUrl(bookmakerKey: AnyInput, bookmakerName?: AnyInput): string | null {
  return getBookmakerUrl(bookmakerKey, bookmakerName);
}
