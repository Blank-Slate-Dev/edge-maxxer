// src/app/api/extension-token/route.ts
// Manage extension authentication tokens

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Generate a new extension token
function generateToken(): string {
  return `em_${crypto.randomBytes(32).toString('hex')}`;
}

// GET - Get current extension token (or generate if none)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    const userId = (session.user as { id: string }).id;
    const user = await User.findById(userId).select('extensionToken');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Return existing token or generate new one
    if (!user.extensionToken) {
      const newToken = generateToken();
      await User.findByIdAndUpdate(userId, { extensionToken: newToken });
      return NextResponse.json({ token: newToken, isNew: true });
    }
    
    return NextResponse.json({ token: user.extensionToken, isNew: false });
    
  } catch (error) {
    console.error('[Extension Token] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST - Generate new token (regenerate)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    const userId = (session.user as { id: string }).id;
    
    const newToken = generateToken();
    await User.findByIdAndUpdate(userId, { extensionToken: newToken });
    
    return NextResponse.json({ 
      token: newToken, 
      message: 'New token generated. Update your extension.',
    });
    
  } catch (error) {
    console.error('[Extension Token] POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE - Revoke token
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    const userId = (session.user as { id: string }).id;
    
    await User.findByIdAndUpdate(userId, { $unset: { extensionToken: 1 } });
    
    return NextResponse.json({ 
      message: 'Extension token revoked. Extension will be disconnected.',
    });
    
  } catch (error) {
    console.error('[Extension Token] DELETE error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}