// src/lib/crawler/index.ts
// Puppeteer-based crawler for scraping bookmaker event URLs
// Uses Browserless.io in production for reliable browser automation

import puppeteer, { Browser, Page } from 'puppeteer-core';
import EventUrl from '@/lib/models/EventUrl';
import dbConnect from '@/lib/mongodb';

// Types
export interface ScrapedEvent {
  homeTeam: string;
  awayTeam: string;
  eventUrl: string;
  eventName: string;
  sport: string;
  commenceTime?: Date;
}

export interface CrawlResult {
  bookmaker: string;
  sport: string;
  eventsFound: number;
  eventsSaved: number;
  errors: string[];
  duration: number;
}

// ============ BOOKMAKER CONFIGURATIONS ============

interface BookmakerConfig {
  name: string;
  baseUrl: string;
  sports: Record<string, string>; // sport key -> URL path
}

const BOOKMAKERS: BookmakerConfig[] = [
  {
    name: 'sportsbet',
    baseUrl: 'https://www.sportsbet.com.au',
    sports: {
      'basketball_nba': '/betting/basketball-us/nba',
      'basketball_ncaab': '/betting/basketball-us/ncaa-mens-basketball',
      'americanfootball_nfl': '/betting/american-football/nfl',
      'americanfootball_ncaaf': '/betting/american-football/ncaa',
      'icehockey_nhl': '/betting/ice-hockey/nhl',
      'baseball_mlb': '/betting/baseball/mlb',
      'aussierules_afl': '/betting/australian-rules/afl',
      'rugbyleague_nrl': '/betting/rugby-league/nrl',
      'soccer_epl': '/betting/soccer/english-premier-league',
      'soccer_australia_aleague': '/betting/soccer/a-league-men',
      'cricket_test': '/betting/cricket',
      'cricket_bbl': '/betting/cricket/big-bash',
    },
  },
  {
    name: 'pointsbet',
    baseUrl: 'https://pointsbet.com.au',
    sports: {
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
    },
  },
  {
    name: 'tab',
    baseUrl: 'https://www.tab.com.au',
    sports: {
      'basketball_nba': '/sports/betting/Basketball/competitions/NBA',
      'basketball_ncaab': '/sports/betting/Basketball/competitions/NCAA%20Basketball',
      'americanfootball_nfl': '/sports/betting/American%20Football/competitions/NFL',
      'icehockey_nhl': '/sports/betting/Ice%20Hockey/competitions/NHL',
      'baseball_mlb': '/sports/betting/Baseball/competitions/MLB',
      'aussierules_afl': '/sports/betting/Australian%20Rules/competitions/AFL',
      'rugbyleague_nrl': '/sports/betting/Rugby%20League/competitions/NRL',
      'soccer_epl': '/sports/betting/Soccer/competitions/English%20Premier%20League',
    },
  },
  {
    name: 'ladbrokes',
    baseUrl: 'https://www.ladbrokes.com.au',
    sports: {
      'basketball_nba': '/sports/basketball/usa/nba',
      'basketball_ncaab': '/sports/basketball/usa/ncaa',
      'americanfootball_nfl': '/sports/american-football/nfl',
      'icehockey_nhl': '/sports/ice-hockey/nhl',
      'aussierules_afl': '/sports/australian-rules/australia/afl',
      'rugbyleague_nrl': '/sports/rugby-league/australia/nrl',
      'soccer_epl': '/sports/soccer/england/premier-league',
    },
  },
  {
    name: 'neds',
    baseUrl: 'https://www.neds.com.au',
    sports: {
      'basketball_nba': '/sports/basketball/usa/nba',
      'basketball_ncaab': '/sports/basketball/usa/ncaa',
      'americanfootball_nfl': '/sports/american-football/nfl',
      'icehockey_nhl': '/sports/ice-hockey/nhl',
      'aussierules_afl': '/sports/australian-rules/australia/afl',
      'rugbyleague_nrl': '/sports/rugby-league/australia/nrl',
      'soccer_epl': '/sports/soccer/england/premier-league',
    },
  },
  {
    name: 'unibet',
    baseUrl: 'https://www.unibet.com.au',
    sports: {
      'basketball_nba': '/betting/sports/filter/basketball/nba',
      'basketball_ncaab': '/betting/sports/filter/basketball/ncaa',
      'americanfootball_nfl': '/betting/sports/filter/american_football/nfl',
      'icehockey_nhl': '/betting/sports/filter/ice_hockey/nhl',
      'aussierules_afl': '/betting/sports/filter/australian_rules/afl',
      'rugbyleague_nrl': '/betting/sports/filter/rugby_league/nrl',
    },
  },
  {
    name: 'betright',
    baseUrl: 'https://www.betright.com.au',
    sports: {
      'basketball_nba': '/sports/basketball/usa/nba',
      'basketball_ncaab': '/sports/basketball/usa/ncaa-mens',
      'americanfootball_nfl': '/sports/american-football/usa/nfl',
      'aussierules_afl': '/sports/australian-rules/australia/afl',
      'rugbyleague_nrl': '/sports/rugby-league/australia/nrl',
    },
  },
  {
    name: 'tabtouch',
    baseUrl: 'https://www.tabtouch.com.au',
    sports: {
      'aussierules_afl': '/sports/australian-rules',
      'rugbyleague_nrl': '/sports/rugby-league',
      'basketball_nba': '/sports/basketball',
    },
  },
  {
    name: 'betr',
    baseUrl: 'https://www.betr.com.au',
    sports: {
      'basketball_nba': '/sports/basketball/nba',
      'americanfootball_nfl': '/sports/american-football/nfl',
      'aussierules_afl': '/sports/australian-rules/afl',
      'rugbyleague_nrl': '/sports/rugby-league/nrl',
    },
  },
  {
    name: 'bluebet',
    baseUrl: 'https://www.bluebet.com.au',
    sports: {
      'basketball_nba': '/sports/basketball/nba',
      'aussierules_afl': '/sports/australian-rules/afl',
      'rugbyleague_nrl': '/sports/rugby-league/nrl',
    },
  },
];

// ============ BROWSER MANAGEMENT ============

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance) {
    return browserInstance;
  }
  
  const browserlessApiKey = process.env.BROWSERLESS_API_KEY;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  
  if (isProduction && browserlessApiKey) {
    // Production - connect to Browserless.io
    const browserlessUrl = `wss://production-sfo.browserless.io?token=${browserlessApiKey}`;
    
    browserInstance = await puppeteer.connect({
      browserWSEndpoint: browserlessUrl,
    });
    
    console.log('[Crawler] Connected to Browserless.io');
  } else if (isProduction) {
    // No Browserless key - throw error
    throw new Error('BROWSERLESS_API_KEY not configured. Add it to your environment variables.');
  } else {
    // Local development - use full puppeteer
    const puppeteerFull = await import('puppeteer');
    browserInstance = await puppeteerFull.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }) as unknown as Browser;
  }
  
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      // For Browserless connections, we use disconnect instead of close
      // This releases the browser back to the pool instead of terminating it
      const browserlessApiKey = process.env.BROWSERLESS_API_KEY;
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
      
      if (isProduction && browserlessApiKey) {
        await browserInstance.disconnect();
        console.log('[Crawler] Disconnected from Browserless.io');
      } else {
        await browserInstance.close();
      }
    } catch (e) {
      // Browserless connections may already be closed
      console.log('[Crawler] Browser already closed');
    }
    browserInstance = null;
  }
}

// ============ GENERIC EVENT SCRAPER ============

async function scrapeEventsFromPage(
  page: Page, 
  bookmaker: string, 
  sport: string, 
  baseUrl: string
): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  
  try {
    // Generic extraction that works across most Australian bookmakers
    const extracted = await page.evaluate((base) => {
      const results: { homeTeam: string; awayTeam: string; eventUrl: string; eventName: string }[] = [];
      const debug: string[] = [];
      
      // Find all links that could be event links
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      debug.push(`Total links on page: ${allLinks.length}`);
      
      // Get page title and URL for debugging
      debug.push(`Page title: ${document.title}`);
      debug.push(`Page URL: ${window.location.href}`);
      
      // Sample some link hrefs for debugging
      const sampleLinks = allLinks.slice(0, 30).map(l => (l as HTMLAnchorElement).href);
      debug.push(`Sample links: ${JSON.stringify(sampleLinks)}`);
      
      let passedBaseFilter = 0;
      let passedEventFilter = 0;
      
      for (const link of allLinks) {
        const href = (link as HTMLAnchorElement).href;
        const text = (link.textContent || '').trim();
        
        // Skip irrelevant links
        if (!href || href.length < 30) continue;
        if (href.includes('login') || href.includes('register') || href.includes('help')) continue;
        if (href.includes('promotions') || href.includes('responsible')) continue;
        if (!href.startsWith(base)) continue;
        
        passedBaseFilter++;
        
        // Look for event patterns in URL
        const isEventUrl = 
          /\/\d{5,}/.test(href) ||           // Numeric ID after slash (common)
          /-\d{6,}/.test(href) ||            // Numeric ID after hyphen (Sportsbet: team-at-team-10559025)
          /\d{7,}$/.test(href) ||            // Numeric ID at end of URL
          href.includes('/match/') ||
          href.includes('/event/') ||
          href.includes('/matches/') ||
          href.includes('/game/') ||
          /\/[a-z-]+-v-[a-z-]+/i.test(href) ||   // team-v-team pattern
          /\/[a-z-]+-at-[a-z-]+/i.test(href) ||  // team-at-team pattern (Sportsbet)
          /\/[a-z-]+-vs-[a-z-]+/i.test(href);    // team-vs-team pattern
        
        if (!isEventUrl) continue;
        
        passedEventFilter++;
        debug.push(`Found event URL: ${href}`);
        
        // Try to extract team names
        let homeTeam = '';
        let awayTeam = '';
        
        // Method 1: Look for team elements within the link
        const teamEls = link.querySelectorAll('[class*="team"], [class*="participant"], [class*="competitor"], [class*="name"]');
        if (teamEls.length >= 2) {
          homeTeam = (teamEls[0].textContent || '').trim();
          awayTeam = (teamEls[1].textContent || '').trim();
        }
        
        // Method 2: Parse from text content
        if (!homeTeam || !awayTeam) {
          const patterns = [
            /^(.+?)\s+v\s+(.+?)$/i,
            /^(.+?)\s+vs\.?\s+(.+?)$/i,
            /^(.+?)\s+@\s+(.+?)$/i,
            /^(.+?)\s+-\s+(.+?)$/i,
            /^(.+?)\s+at\s+(.+?)$/i,
          ];
          
          for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
              homeTeam = match[1].trim();
              awayTeam = match[2].trim();
              break;
            }
          }
        }
        
        // Method 3: Parse from URL (TAB style - "team v team" in URL)
        if (!homeTeam || !awayTeam) {
          const urlMatch = href.match(/\/matches\/([^/]+)$/);
          if (urlMatch) {
            const decoded = decodeURIComponent(urlMatch[1]);
            const parts = decoded.split(' v ');
            if (parts.length === 2) {
              homeTeam = parts[0].trim();
              awayTeam = parts[1].trim();
            }
          }
        }
        
        // Method 4: Parse from URL slug (team-v-team or team-vs-team)
        if (!homeTeam || !awayTeam) {
          const slugMatch = href.match(/\/([a-z-]+)-(v|vs)-([a-z-]+)(?:\/|\?|$)/i);
          if (slugMatch) {
            homeTeam = slugMatch[1].replace(/-/g, ' ');
            awayTeam = slugMatch[3].replace(/-/g, ' ');
          }
        }
        
        // Method 5: Try parsing from href path segments (e.g., /team1-at-team2-12345/)
        if (!homeTeam || !awayTeam) {
          // Sportsbet style: /cleveland-cavaliers-at-denver-nuggets-10559025
          const atMatch = href.match(/\/([a-z][a-z0-9-]+)-at-([a-z][a-z0-9-]+?)(?:-\d+)?(?:\/|\?|#|$)/i);
          if (atMatch) {
            // In "X at Y" format, X is away team, Y is home team
            awayTeam = atMatch[1].replace(/-/g, ' ');
            homeTeam = atMatch[2].replace(/-/g, ' ');
            debug.push(`Extracted from at-URL: away=${awayTeam}, home=${homeTeam}`);
          }
        }
        
        // Method 6: Parse team names from URL with numeric suffix (Sportsbet)
        if (!homeTeam || !awayTeam) {
          // Match pattern: /sport/league/team1-at-team2-12345 or /team1-vs-team2-12345
          const urlParts = href.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          
          // Remove trailing numeric ID
          const withoutId = lastPart.replace(/-\d+$/, '');
          
          const vsMatch = withoutId.match(/^(.+?)-(at|vs|v)-(.+)$/i);
          if (vsMatch) {
            const team1 = vsMatch[1].replace(/-/g, ' ');
            const separator = vsMatch[2].toLowerCase();
            const team2 = vsMatch[3].replace(/-/g, ' ');
            
            // "at" means team1 is away, team2 is home
            if (separator === 'at') {
              awayTeam = team1;
              homeTeam = team2;
            } else {
              homeTeam = team1;
              awayTeam = team2;
            }
            debug.push(`Extracted from URL slug: home=${homeTeam}, away=${awayTeam}`);
          }
        }
        
        // Log what we found for debugging
        if (passedEventFilter <= 5) {
          debug.push(`Event URL: ${href}, text: "${text.substring(0, 50)}", teams: ${homeTeam} vs ${awayTeam}`);
        }
        
        // Validate we have both teams
        if (homeTeam && awayTeam && homeTeam !== awayTeam) {
          // Clean up team names
          homeTeam = homeTeam.replace(/^\d+\.\s*/, '').trim();
          awayTeam = awayTeam.replace(/^\d+\.\s*/, '').trim();
          
          // Remove odds/prices from names
          homeTeam = homeTeam.replace(/\s*\d+\.\d+\s*$/, '').trim();
          awayTeam = awayTeam.replace(/\s*\d+\.\d+\s*$/, '').trim();
          
          if (homeTeam.length > 2 && awayTeam.length > 2 && 
              homeTeam.length < 50 && awayTeam.length < 50) {
            results.push({
              homeTeam,
              awayTeam,
              eventUrl: href,
              eventName: `${homeTeam} v ${awayTeam}`,
            });
          }
        }
      }
      
      // Deduplicate by URL
      const seen = new Set<string>();
      const uniqueResults = results.filter(r => {
        if (seen.has(r.eventUrl)) return false;
        seen.add(r.eventUrl);
        return true;
      });
      
      debug.push(`Passed base filter: ${passedBaseFilter}`);
      debug.push(`Passed event filter: ${passedEventFilter}`);
      debug.push(`Unique results: ${uniqueResults.length}`);
      
      return { results: uniqueResults, debug };
    }, baseUrl);
    
    // Log debug info
    console.log(`[Crawler] Debug for ${bookmaker}/${sport}:`);
    extracted.debug.forEach(d => console.log(`  ${d}`));
    
    events.push(...extracted.results.map(e => ({ ...e, sport })));
    
  } catch (error) {
    console.error(`[Crawler] Error scraping ${bookmaker}/${sport}:`, error);
  }
  
  return events;
}

// ============ MAIN CRAWL FUNCTIONS ============

/**
 * Crawl a single bookmaker for a specific sport
 */
export async function crawlBookmakerSport(bookmakerName: string, sport: string): Promise<CrawlResult> {
  const startTime = Date.now();
  const result: CrawlResult = {
    bookmaker: bookmakerName,
    sport,
    eventsFound: 0,
    eventsSaved: 0,
    errors: [],
    duration: 0,
  };
  
  const bookmaker = BOOKMAKERS.find(b => b.name === bookmakerName.toLowerCase());
  if (!bookmaker) {
    result.errors.push(`Unknown bookmaker: ${bookmakerName}`);
    result.duration = Date.now() - startTime;
    return result;
  }
  
  const sportPath = bookmaker.sports[sport];
  if (!sportPath) {
    result.errors.push(`Sport not configured for ${bookmakerName}: ${sport}`);
    result.duration = Date.now() - startTime;
    return result;
  }
  
  // Smart caching: Skip if we already have recent URLs for this combo
  try {
    await dbConnect();
    const recentCount = await EventUrl.countDocuments({
      bookmaker: bookmaker.name,
      sport,
      scrapedAt: { $gt: new Date(Date.now() - 6 * 60 * 60 * 1000) }, // Within last 6 hours
    });
    
    if (recentCount >= 5) {
      console.log(`[Crawler] Skipping ${bookmaker.name}/${sport} - already have ${recentCount} recent URLs cached`);
      result.eventsFound = recentCount;
      result.eventsSaved = 0;
      result.duration = Date.now() - startTime;
      return result;
    }
  } catch (err) {
    // Continue with crawl if check fails
    console.log(`[Crawler] Cache check failed, proceeding with crawl`);
  }
  
  const url = `${bookmaker.baseUrl}${sportPath}`;
  console.log(`[Crawler] Scraping ${bookmaker.name}/${sport}: ${url}`);
  
  let page: Page | null = null;
  
  try {
    await dbConnect();
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Block unnecessary resources for speed
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // Set realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate with timeout
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Scroll to load lazy content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Scrape events
    const events = await scrapeEventsFromPage(page, bookmaker.name, sport, bookmaker.baseUrl);
    result.eventsFound = events.length;
    
    console.log(`[Crawler] Found ${events.length} events on ${bookmaker.name}/${sport}`);
    
    // Save to database
    for (const event of events) {
      try {
        await EventUrl.upsertEventUrl(
          bookmaker.name,
          event.sport,
          event.homeTeam,
          event.awayTeam,
          event.eventUrl,
          event.eventName,
          event.commenceTime
        );
        result.eventsSaved++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Crawler] Error saving event:`, msg);
      }
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Crawler] Error crawling ${bookmaker.name}/${sport}:`, errorMsg);
    result.errors.push(errorMsg);
  } finally {
    if (page) {
      await page.close();
    }
    // Always disconnect from Browserless after each crawl to release the unit
    await closeBrowser();
  }
  
  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Crawl a single bookmaker for all its sports
 */
export async function crawlBookmaker(bookmakerName: string): Promise<CrawlResult[]> {
  const bookmaker = BOOKMAKERS.find(b => b.name === bookmakerName.toLowerCase());
  if (!bookmaker) {
    return [{ 
      bookmaker: bookmakerName, 
      sport: '', 
      eventsFound: 0, 
      eventsSaved: 0, 
      errors: ['Unknown bookmaker'], 
      duration: 0 
    }];
  }
  
  const results: CrawlResult[] = [];
  
  for (const sport of Object.keys(bookmaker.sports)) {
    const result = await crawlBookmakerSport(bookmakerName, sport);
    results.push(result);
    
    // Small delay between sports to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  return results;
}

/**
 * Crawl ONE sport from each bookmaker (faster, more coverage)
 */
export async function crawlSportAcrossBookmakers(sport: string): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];
  
  for (const bookmaker of BOOKMAKERS) {
    if (bookmaker.sports[sport]) {
      const result = await crawlBookmakerSport(bookmaker.name, sport);
      results.push(result);
      
      // Delay between bookmakers
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

/**
 * Get next bookmaker to crawl (round-robin)
 */
export function getNextBookmaker(lastCrawled?: string): string {
  const names = BOOKMAKERS.map(b => b.name);
  
  if (!lastCrawled) return names[0];
  
  const idx = names.indexOf(lastCrawled);
  return names[(idx + 1) % names.length];
}

/**
 * Get list of supported bookmakers
 */
export function getSupportedBookmakers(): string[] {
  return BOOKMAKERS.map(b => b.name);
}

/**
 * Get sports for a bookmaker
 */
export function getBookmakerSports(bookmakerName: string): string[] {
  const bookmaker = BOOKMAKERS.find(b => b.name === bookmakerName.toLowerCase());
  return bookmaker ? Object.keys(bookmaker.sports) : [];
}

/**
 * Lookup a URL from the database
 */
export async function lookupEventUrl(
  bookmaker: string,
  homeTeam: string,
  awayTeam: string,
  sport?: string
): Promise<string | null> {
  await dbConnect();
  const result = await EventUrl.findEventUrl(bookmaker, homeTeam, awayTeam, sport);
  return result?.eventUrl || null;
}

/**
 * Lookup URLs for multiple bookmakers
 */
export async function lookupEventUrls(
  bookmakers: string[],
  homeTeam: string,
  awayTeam: string,
  sport?: string
): Promise<Record<string, string>> {
  await dbConnect();
  return EventUrl.findUrlsForArb(bookmakers, homeTeam, awayTeam, sport);
}

/**
 * Get crawler stats
 */
export async function getCrawlerStats(): Promise<{ total: number; byBookmaker: Record<string, number> }> {
  await dbConnect();
  return EventUrl.getStats();
}