// src/app/api/bets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Bet from '@/lib/models/Bet';

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
    
    const bet = await Bet.create({
      ...betData,
      oddsUserId: userId,
      createdAt: betData.createdAt || new Date().toISOString(),
    });

    // Update global profit counter
    if (bet.expectedProfit > 0) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/global-stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profit: bet.expectedProfit }),
        });
      } catch (err) {
        console.error('Failed to update global stats:', err);
      }
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
    
    // Ensure user owns this bet
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