// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User, { UserRegion } from '@/lib/models/User';

const VALID_REGIONS: UserRegion[] = ['US', 'EU', 'UK', 'AU'];

// GET - Fetch user settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findById((session.user as { id: string }).id).select('oddsApiKey subscription trialEndsAt region');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      oddsApiKey: user.oddsApiKey || '',
      subscription: user.subscription,
      trialEndsAt: user.trialEndsAt,
      region: user.region || 'AU',
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

    const { oddsApiKey, region } = await request.json();

    await dbConnect();
    
    // Build update object
    const updateData: { oddsApiKey?: string; region?: UserRegion } = {};
    
    if (oddsApiKey !== undefined) {
      updateData.oddsApiKey = oddsApiKey || '';
    }
    
    if (region !== undefined && VALID_REGIONS.includes(region)) {
      updateData.region = region;
    }
    
    const user = await User.findByIdAndUpdate(
      (session.user as { id: string }).id,
      updateData,
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Settings updated',
      oddsApiKey: user.oddsApiKey,
      region: user.region,
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
