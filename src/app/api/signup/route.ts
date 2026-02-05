// src/app/api/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User, { UserRegion } from '@/lib/models/User';

const VALID_REGIONS: UserRegion[] = ['US', 'EU', 'UK', 'AU'];

// Salt rounds for bcrypt hashing.
// 10 is the standard recommendation — secure enough for password hashing
// while keeping serverless function execution fast (~100-300ms).
// Previously was 12 (4096 iterations) which took 3-5s on Vercel.
const BCRYPT_SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, region, referralCode } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate region (default to AU if not provided or invalid)
    const validatedRegion: UserRegion = VALID_REGIONS.includes(region) ? region : 'AU';

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user with no subscription (they need to purchase a plan)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      region: validatedRegion,
      plan: 'none',
      subscriptionStatus: 'inactive',
      referredBy: referralCode || undefined,
    });

    // Don't return password
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      region: user.region,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      referralCode: user.referralCode,
    };

    return NextResponse.json(
      { message: 'Account created successfully', user: userResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
