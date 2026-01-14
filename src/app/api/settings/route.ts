// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

// GET - Fetch user settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findById((session.user as { id: string }).id).select('oddsApiKey subscription trialEndsAt');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      oddsApiKey: user.oddsApiKey || '',
      subscription: user.subscription,
      trialEndsAt: user.trialEndsAt,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { oddsApiKey } = await request.json();

    await dbConnect();
    
    const user = await User.findByIdAndUpdate(
      (session.user as { id: string }).id,
      { oddsApiKey: oddsApiKey || '' },
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Settings updated',
      oddsApiKey: user.oddsApiKey,
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
