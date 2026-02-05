// src/app/api/warmup/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

// Lightweight endpoint to pre-warm the MongoDB connection pool.
// Called from the login UI so the connection is ready by the time
// the user submits credentials.
export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    // Even if it fails, return 200 — this is best-effort warming.
    // The actual login will surface real errors.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}