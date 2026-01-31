// src/app/api/cron/crawl-urls/route.ts
// Cron job to crawl bookmaker event URLs
// Runs every 5 minutes, crawls one bookmaker per run (round-robin)

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { 
  crawlBookmakerSport, 
  getNextBookmaker, 
  getBookmakerSports,
  closeBrowser, 
  getCrawlerStats,
  getSupportedBookmakers
} from '@/lib/crawler';

// Track state between invocations
let lastCrawledBookmaker: string | undefined;
let lastCrawledSport: string | undefined;
let crawlIndex = 0;

const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max Vercel timeout

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && !isVercelCron) {
      console.log('[CrawlUrls] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[CrawlUrls] Starting URL crawler...');
    
    await dbConnect();
    
    // Get all bookmakers and their sports
    const bookmakers = getSupportedBookmakers();
    
    // Build a flat list of [bookmaker, sport] pairs to crawl
    const crawlPairs: [string, string][] = [];
    for (const bm of bookmakers) {
      for (const sport of getBookmakerSports(bm)) {
        crawlPairs.push([bm, sport]);
      }
    }
    
    // Round-robin through the list
    crawlIndex = crawlIndex % crawlPairs.length;
    const [bookmakerToCrawl, sportToCrawl] = crawlPairs[crawlIndex];
    crawlIndex++;
    
    console.log(`[CrawlUrls] Crawling: ${bookmakerToCrawl}/${sportToCrawl} (index ${crawlIndex-1}/${crawlPairs.length})`);
    
    // Crawl just one bookmaker/sport combo per run (fits in Vercel timeout)
    const result = await crawlBookmakerSport(bookmakerToCrawl, sportToCrawl);
    
    // Update state
    lastCrawledBookmaker = bookmakerToCrawl;
    lastCrawledSport = sportToCrawl;
    
    // Close browser to free resources
    await closeBrowser();
    
    // Get stats
    const stats = await getCrawlerStats();
    
    const totalDuration = Date.now() - startTime;
    
    console.log(`[CrawlUrls] Done: ${result.eventsFound} found, ${result.eventsSaved} saved, ${totalDuration}ms`);
    
    // Calculate next crawl
    const nextIndex = crawlIndex % crawlPairs.length;
    const [nextBookmaker, nextSport] = crawlPairs[nextIndex];
    
    return NextResponse.json({
      success: true,
      crawled: {
        bookmaker: bookmakerToCrawl,
        sport: sportToCrawl,
      },
      result,
      stats,
      next: {
        bookmaker: nextBookmaker,
        sport: nextSport,
        index: nextIndex,
        total: crawlPairs.length,
      },
      duration: totalDuration,
    });
    
  } catch (error) {
    console.error('[CrawlUrls] Error:', error);
    
    // Try to close browser on error
    try { await closeBrowser(); } catch {}
    
    return NextResponse.json(
      { error: 'Crawler failed', details: String(error) },
      { status: 500 }
    );
  }
}

// POST endpoint for manual trigger / status check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { bookmaker, sport, action } = body;
    
    await dbConnect();
    
    // Just get stats
    if (action === 'stats') {
      const stats = await getCrawlerStats();
      return NextResponse.json({
        success: true,
        stats,
        lastCrawled: lastCrawledBookmaker,
        lastCrawledSport,
        supportedBookmakers: getSupportedBookmakers(),
      });
    }
    
    // Crawl specific bookmaker/sport
    if (bookmaker) {
      console.log(`[CrawlUrls] Manual crawl: ${bookmaker}/${sport || 'all sports'}`);
      
      let results;
      if (sport) {
        results = [await crawlBookmakerSport(bookmaker, sport)];
      } else {
        // Import crawlBookmaker for full bookmaker crawl
        const { crawlBookmaker } = await import('@/lib/crawler');
        results = await crawlBookmaker(bookmaker);
      }
      
      await closeBrowser();
      
      const stats = await getCrawlerStats();
      
      return NextResponse.json({
        success: true,
        bookmaker,
        sport: sport || 'all',
        results,
        stats,
      });
    }
    
    // Return general stats
    const stats = await getCrawlerStats();
    
    return NextResponse.json({
      success: true,
      stats,
      lastCrawled: lastCrawledBookmaker,
      lastCrawledSport,
      supportedBookmakers: getSupportedBookmakers(),
    });
    
  } catch (error) {
    console.error('[CrawlUrls] Error:', error);
    try { await closeBrowser(); } catch {}
    return NextResponse.json(
      { error: 'Request failed', details: String(error) },
      { status: 500 }
    );
  }
}