// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, PLANS, FIRST_MONTH_COUPON, PlanType } from '@/lib/stripe';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to subscribe' },
        { status: 401 }
      );
    }

    const { plan, embedded = false } = await request.json() as { plan: PlanType; embedded?: boolean };

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
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

    // Check if user already has an active subscription
    if (user.subscriptionStatus === 'active' && user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date()) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }

    const selectedPlan = PLANS[plan];

    // Create or retrieve Stripe customer
    // Handle null, undefined, empty string, and the string "null"
    let customerId = user.stripeCustomerId;
    
    if (!customerId || customerId === 'null' || customerId === '') {
      console.log('Creating new Stripe customer for user:', user.email);
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;
      console.log('Created Stripe customer:', customerId);

      // Save customer ID to user
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Build checkout session based on plan type and mode
    if (plan === 'trial') {
      // 3-day trial is a one-time payment
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price: selectedPlan.priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: user._id.toString(),
          plan: 'trial',
        },
        success_url: `${baseUrl}/dashboard?checkout=success&plan=trial`,
        cancel_url: `${baseUrl}/?checkout=canceled`,
      };

      // Add embedded mode settings if requested
      if (embedded) {
        sessionConfig.ui_mode = 'embedded';
        sessionConfig.return_url = `${baseUrl}/dashboard?checkout=success&plan=trial`;
        delete sessionConfig.success_url;
        delete sessionConfig.cancel_url;
      }

      const checkoutSession = await stripe.checkout.sessions.create(sessionConfig);

      if (embedded) {
        return NextResponse.json({ clientSecret: checkoutSession.client_secret });
      }
      return NextResponse.json({ url: checkoutSession.url });
    } else {
      // Monthly or yearly subscription
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: selectedPlan.priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: user._id.toString(),
          plan: plan,
        },
        subscription_data: {
          metadata: {
            userId: user._id.toString(),
            plan: plan,
          },
        },
        success_url: `${baseUrl}/dashboard?checkout=success&plan=${plan}`,
        cancel_url: `${baseUrl}/?checkout=canceled`,
      };

      // Apply first month discount coupon for monthly plan
      if (plan === 'monthly') {
        sessionConfig.discounts = [
          {
            coupon: FIRST_MONTH_COUPON,
          },
        ];
      }

      // Add embedded mode settings if requested
      if (embedded) {
        sessionConfig.ui_mode = 'embedded';
        sessionConfig.return_url = `${baseUrl}/dashboard?checkout=success&plan=${plan}`;
        delete sessionConfig.success_url;
        delete sessionConfig.cancel_url;
      }

      const checkoutSession = await stripe.checkout.sessions.create(sessionConfig);

      if (embedded) {
        return NextResponse.json({ clientSecret: checkoutSession.client_secret });
      }
      return NextResponse.json({ url: checkoutSession.url });
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Error) {
      if (error.message.includes('No such coupon')) {
        return NextResponse.json(
          { error: 'Discount configuration error. Please contact support.' },
          { status: 500 }
        );
      }
      if (error.message.includes('No such price')) {
        return NextResponse.json(
          { error: 'Pricing configuration error. Please contact support.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}