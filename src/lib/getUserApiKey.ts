// src/lib/getUserApiKey.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function getUserApiKey(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('[getUserApiKey] No session found');
      return null;
    }

    await dbConnect();
    
    const userId = (session.user as { id: string }).id;
    const user = await User.findById(userId).select('oddsApiKey');
    
    if (!user || !user.oddsApiKey) {
      console.log('[getUserApiKey] No API key saved for user');
      return null;
    }

    return user.oddsApiKey;
  } catch (error) {
    console.error('[getUserApiKey] Error:', error);
    return null;
  }
}
