// src/app/api/global-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import GlobalStats from '@/lib/models/GlobalStats';

export const dynamic = 'force-dynamic';

// Maximum profit that can be added in a single update (prevents abuse/errors)
const MAX_PROFIT_PER_UPDATE = 10000;

// Secret key for admin operations (set this in your environment variables)
const ADMIN_RESET_KEY = process.env.ADMIN_RESET_KEY || 'your-secret-reset-key';

// GET - Fetch global stats (public)
export async function GET() {
  try {
    await dbConnect();
    
    let stats = await GlobalStats.findById('global');
    
    // Initialize if doesn't exist
    if (!stats) {
      stats = await GlobalStats.create({
        _id: 'global',
        totalProfit: 0,
        totalBets: 0,
      });
    }

    return NextResponse.json({
      totalProfit: stats.totalProfit,
      totalBets: stats.totalBets,
      lastUpdated: stats.lastUpdated,
    });
  } catch (error) {
    console.error('GlobalStats GET error:', error);
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