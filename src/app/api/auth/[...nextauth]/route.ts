// src/app/api/auth/[...nextauth]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

const handler = NextAuth(authOptions);

// Wrap the GET handler to intercept warmup requests.
// When ?warmup=1 is present, we establish the MongoDB connection
// and prime the Mongoose model in THIS function's process — the
// same one that will handle the credentials POST moments later.
async function wrappedGET(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  if (req.nextUrl.searchParams.get('warmup') === '1') {
    const t0 = Date.now();
    try {
      await dbConnect();
      // Touch the User model to ensure the schema is registered and
      // Mongoose has compiled it — eliminates first-query overhead.
      await User.findOne().select('_id').lean().limit(1);
      console.log(`[Auth Warmup] DB + model primed in ${Date.now() - t0}ms`);
    } catch (e) {
      console.log(`[Auth Warmup] Failed after ${Date.now() - t0}ms:`, e);
    }
    return NextResponse.json({ ok: true });
  }

  return handler(req, ctx) as Promise<NextResponse>;
}

export { wrappedGET as GET, handler as POST };