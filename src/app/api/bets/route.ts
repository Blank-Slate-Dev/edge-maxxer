// src/app/api/bets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Bet from '@/lib/models/Bet';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

// Maximum profit that can be added in a single update
const MAX_PROFIT_PER_UPDATE = 10000;
// Minimum profit to trigger counter update (10 cents)
const MIN_PROFIT_THRESHOLD = 0.10;

/**
 * Check if a string is a valid MongoDB ObjectId
 */
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}

// Helper to update global stats
async function updateGlobalStats(profit: number) {
  if (profit < MIN_PROFIT_THRESHOLD || profit > MAX_PROFIT_PER_UPDATE) return;
  
  try {
    await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/global-stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profit }),
    });
  } catch (err) {
    console.error('Failed to update global stats:', err);
  }
}

// Helper to update user's total profit
async function updateUserProfit(userId: string, profit: number) {
  if (profit < MIN_PROFIT_THRESHOLD || profit > MAX_PROFIT_PER_UPDATE) return;
  
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { totalProfit: profit }
    });
  } catch (err) {
    console.error('Failed to update user profit:', err);
  }
}

// GET - Fetch all bets for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const userId = (session.user as { id: string }).id;
    const bets = await Bet.find({ oddsUserId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Transform _id to id for frontend compatibility
    const transformedBets = bets.map(bet => ({
      ...bet,
      id: bet._id.toString(),
      _id: undefined,
      oddsUserId: undefined,
    }));

    return NextResponse.json({ bets: transformedBets });
  } catch (error) {
    console.error('Bets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
  }
}

// POST - Create a new bet
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const betData = await request.json();
    
    await dbConnect();
    
    const userId = (session.user as { id: string }).id;
    
    // Strip the frontend-generated 'id' field so Mongoose auto-generates a valid ObjectId
    // The frontend sends ids like "bet_1770240562389_1x2g4a39h" which aren't valid ObjectIds
    const { id: _frontendId, ...cleanBetData } = betData;
    
    const bet = await Bet.create({
      ...cleanBetData,
      oddsUserId: userId,
      createdAt: cleanBetData.createdAt || new Date().toISOString(),
      extraProfitCounted: false, // Initialize flag
    });

    // Update global profit counter and user profit (only if above threshold)
    if (bet.expectedProfit >= MIN_PROFIT_THRESHOLD) {
      await updateGlobalStats(bet.expectedProfit);
      await updateUserProfit(userId, bet.expectedProfit);
    }

    return NextResponse.json({
      bet: {
        ...bet.toObject(),
        id: bet._id.toString(),
        _id: undefined,
        oddsUserId: undefined,
      },
    });
  } catch (error) {
    console.error('Bets POST error:', error);
    return NextResponse.json({ error: 'Failed to create bet' }, { status: 500 });
  }
}

// PUT - Update an existing bet
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Bet ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    const userId = (session.user as { id: string }).id;
    
    // Build the query — handle both ObjectId and legacy string IDs gracefully
    const query = isValidObjectId(id)
      ? { _id: id, oddsUserId: userId }
      : { _id: { $exists: true }, oddsUserId: userId }; // Fallback: we'll search differently
    
    // First, get the current bet to check for extra profit
    let currentBet;
    if (isValidObjectId(id)) {
      currentBet = await Bet.findOne({ _id: id, oddsUserId: userId });
    } else {
      // If the ID isn't a valid ObjectId, the bet likely doesn't exist in the DB yet
      // (it was created client-side and the server POST response was missed)
      console.warn(`Bets PUT: Non-ObjectId "${id}" received — bet may not exist on server`);
      return NextResponse.json({ error: 'Bet not found — invalid ID format' }, { status: 404 });
    }
    
    if (!currentBet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    // Check if we should add extra profit:
    // 1. Extra profit hasn't been counted yet for this bet
    // 2. actualProfit is being set
    // 3. actualProfit is higher than expectedProfit
    // 4. The extra profit is above the minimum threshold
    if (
      !currentBet.extraProfitCounted &&
      updates.actualProfit !== undefined &&
      updates.actualProfit > currentBet.expectedProfit
    ) {
      const extraProfit = updates.actualProfit - currentBet.expectedProfit;
      
      // Only update if extra profit meets threshold
      if (extraProfit >= MIN_PROFIT_THRESHOLD) {
        await updateGlobalStats(extraProfit);
        await updateUserProfit(userId, extraProfit);
        
        // Mark that extra profit has been counted
        updates.extraProfitCounted = true;
      }
    }

    // Now update the bet
    const bet = await Bet.findOneAndUpdate(
      { _id: id, oddsUserId: userId },
      { $set: updates },
      { new: true }
    );

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    return NextResponse.json({
      bet: {
        ...bet.toObject(),
        id: bet._id.toString(),
        _id: undefined,
        oddsUserId: undefined,
      },
    });
  } catch (error) {
    console.error('Bets PUT error:', error);
    return NextResponse.json({ error: 'Failed to update bet' }, { status: 500 });
  }
}

// DELETE - Delete a bet or clear all bets
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const betId = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    await dbConnect();
    
    const userId = (session.user as { id: string }).id;

    if (clearAll) {
      await Bet.deleteMany({ oddsUserId: userId });
      return NextResponse.json({ message: 'All bets cleared' });
    }

    if (!betId) {
      return NextResponse.json({ error: 'Bet ID is required' }, { status: 400 });
    }

    // Validate ObjectId before querying
    if (!isValidObjectId(betId)) {
      console.warn(`Bets DELETE: Non-ObjectId "${betId}" received`);
      return NextResponse.json({ error: 'Bet not found — invalid ID format' }, { status: 404 });
    }

    const result = await Bet.deleteOne({ _id: betId, oddsUserId: userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bet deleted' });
  } catch (error) {
    console.error('Bets DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete bet' }, { status: 500 });
  }
}
