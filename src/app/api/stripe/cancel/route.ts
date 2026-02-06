// src/app/api/stripe/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Cancel at period end (user keeps access until subscription expires)
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update user record to reflect cancellation
    await User.findByIdAndUpdate(user._id, {
      subscriptionStatus: 'canceled',
    });

    console.log(`[Stripe Cancel] Subscription ${user.stripeSubscriptionId} set to cancel at period end for user ${user.email}`);

    // Cast to access raw Stripe fields (same pattern as webhook)
    const rawSub = subscription as unknown as Record<string, unknown>;
    const periodEnd = rawSub.current_period_end;

    return NextResponse.json({
      success: true,
      cancelAt: typeof periodEnd === 'number' && periodEnd > 0
        ? new Date(periodEnd * 1000).toISOString()
        : user.subscriptionEndsAt?.toISOString(),
    });
  } catch (error) {
    console.error('[Stripe Cancel] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}