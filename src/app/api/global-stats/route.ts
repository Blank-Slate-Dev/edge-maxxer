// src/app/api/global-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import GlobalStats from '@/lib/models/GlobalStats';

export const dynamic = 'force-dynamic';

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