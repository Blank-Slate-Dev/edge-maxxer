// src/app/api/global-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import GlobalStats from '@/lib/models/GlobalStats';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

// =========================================================================
// IN-MEMORY CACHE for GET requests
// The landing page ProfitCounter polls this every 15 seconds, and every
// visitor triggers it. Without caching, that's a DB round-trip per visitor
// per poll. With a 30-second cache, we serve stale-but-acceptable data
// from memory and only hit MongoDB twice per minute regardless of traffic.
// =========================================================================
let cachedStats: {
  totalProfit: number;
  totalBets: number;
  totalUsers: number;
  lastUpdated: Date | null;
} | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

// Maximum profit that can be added in a single update (prevents abuse/errors)
const MAX_PROFIT_PER_UPDATE = 10000;

// Secret key for admin operations (set this in your environment variables)
const ADMIN_RESET_KEY = process.env.ADMIN_RESET_KEY || 'your-secret-reset-key';

// GET - Fetch global stats (public, cached)
export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still fresh
    if (cachedStats && (now - cacheTimestamp) < CACHE_TTL_MS) {
      return NextResponse.json(cachedStats);
    }

    await dbConnect();
    
    // Fetch stats and user count in parallel
    const [stats, userCount] = await Promise.all([
      GlobalStats.findById('global').lean(),
      User.countDocuments(),
    ]);
    
    // Initialize stats if doesn't exist
    if (!stats) {
      await GlobalStats.create({
        _id: 'global',
        totalProfit: 0,
        totalBets: 0,
      });
    }

    const result = {
      totalProfit: stats?.totalProfit ?? 0,
      totalBets: stats?.totalBets ?? 0,
      totalUsers: userCount,
      lastUpdated: stats?.lastUpdated ?? null,
    };

    // Update cache
    cachedStats = result;
    cacheTimestamp = now;

    return NextResponse.json(result);
  } catch (error) {
    console.error('GlobalStats GET error:', error);

    // If DB fails but we have stale cache, return it rather than erroring
    if (cachedStats) {
      return NextResponse.json(cachedStats);
    }

    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

// POST - Add profit when bet is logged (webhook)
export async function POST(request: NextRequest) {
  try {
    const { profit } = await request.json();

    if (typeof profit !== 'number' || profit <= 0) {
      return NextResponse.json({ error: 'Invalid profit amount' }, { status: 400 });
    }

    // Cap the profit at $10,000 per update to prevent abuse/errors
    if (profit > MAX_PROFIT_PER_UPDATE) {
      console.warn(`Profit amount ${profit} exceeds maximum of ${MAX_PROFIT_PER_UPDATE}. Capping.`);
      return NextResponse.json({ 
        error: `Profit amount exceeds maximum of $${MAX_PROFIT_PER_UPDATE.toLocaleString()} per update` 
      }, { status: 400 });
    }

    await dbConnect();
    
    const stats = await GlobalStats.findByIdAndUpdate(
      'global',
      {
        $inc: { totalProfit: profit, totalBets: 1 },
        $set: { lastUpdated: new Date() },
      },
      { new: true, upsert: true }
    );

    // Invalidate cache so the next GET picks up fresh data
    cachedStats = null;
    cacheTimestamp = 0;

    return NextResponse.json({
      totalProfit: stats.totalProfit,
      totalBets: stats.totalBets,
      added: profit,
    });
  } catch (error) {
    console.error('GlobalStats POST error:', error);
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
  }
}

// DELETE - Reset the counter (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check for admin key in header or query param
    const { searchParams } = new URL(request.url);
    const adminKey = request.headers.get('x-admin-key') || searchParams.get('key');

    if (adminKey !== ADMIN_RESET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Get a specific value to reset to
    let resetTo = 0;
    try {
      const body = await request.json();
      if (typeof body.resetTo === 'number' && body.resetTo >= 0) {
        resetTo = body.resetTo;
      }
    } catch {
      // No body provided, reset to 0
    }

    await dbConnect();
    
    const stats = await GlobalStats.findByIdAndUpdate(
      'global',
      {
        $set: { 
          totalProfit: resetTo,
          totalBets: 0,
          lastUpdated: new Date() 
        },
      },
      { new: true, upsert: true }
    );

    // Invalidate cache
    cachedStats = null;
    cacheTimestamp = 0;

    return NextResponse.json({
      message: 'Stats reset successfully',
      totalProfit: stats.totalProfit,
      totalBets: stats.totalBets,
    });
  } catch (error) {
    console.error('GlobalStats DELETE error:', error);
    return NextResponse.json({ error: 'Failed to reset stats' }, { status: 500 });
  }
}
