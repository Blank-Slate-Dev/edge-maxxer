// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import type Stripe from 'stripe';

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    switch (event.type) {
      // One-time payment completed (3-day trial)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'payment') {
          // This is the 3-day trial one-time payment
          const userId = session.metadata?.userId;
          const plan = session.metadata?.plan;

          if (userId && plan === 'trial') {
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 3);

            await User.findByIdAndUpdate(userId, {
              plan: 'trial',
              subscriptionStatus: 'active',
              subscriptionEndsAt: trialEndsAt,
              stripeCustomerId: session.customer as string,
            });

            console.log(`Activated 3-day trial for user ${userId}`);
          }
        }
        break;
      }

      // Subscription created/updated
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const plan = subscription.metadata?.plan as 'monthly' | 'yearly' | undefined;

        if (userId && plan) {
          const status = subscription.status;
          
          // Get current_period_end from the raw event data
          // Cast to unknown first, then to Record to satisfy TypeScript
          const rawSubscription = event.data.object as unknown as Record<string, unknown>;
          const periodEnd = rawSubscription.current_period_end;
          
          let currentPeriodEnd: Date;
          if (typeof periodEnd === 'number' && periodEnd > 0) {
            currentPeriodEnd = new Date(periodEnd * 1000);
          } else {
            // Fallback: set to 1 month or 1 year from now based on plan
            currentPeriodEnd = new Date();
            if (plan === 'yearly') {
              currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
            } else {
              currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
            }
          }

          let subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'inactive' = 'inactive';
          
          if (status === 'active' || status === 'trialing') {
            subscriptionStatus = 'active';
          } else if (status === 'past_due') {
            subscriptionStatus = 'past_due';
          } else if (status === 'canceled' || status === 'unpaid') {
            subscriptionStatus = 'canceled';
          }

          await User.findByIdAndUpdate(userId, {
            plan: plan,
            subscriptionStatus: subscriptionStatus,
            subscriptionEndsAt: currentPeriodEnd,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
          });

          console.log(`Updated subscription for user ${userId}: ${plan} - ${subscriptionStatus} - ends ${currentPeriodEnd}`);
        }
        break;
      }

      // Subscription deleted/canceled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await User.findByIdAndUpdate(userId, {
            subscriptionStatus: 'canceled',
            // Keep the end date so they can use until period ends
          });

          console.log(`Subscription canceled for user ${userId}`);
        }
        break;
      }

      // Invoice payment failed
      case 'invoice.payment_failed': {
        // Cast to unknown first, then to Record to satisfy TypeScript
        const rawInvoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = rawInvoice.subscription as string | null;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            await User.findByIdAndUpdate(userId, {
              subscriptionStatus: 'past_due',
            });

            console.log(`Payment failed for user ${userId}`);
            // TODO: Send email notification to user about failed payment
          }
        }
        break;
      }

      // Invoice paid (renewal)
      case 'invoice.paid': {
        // Cast to unknown first, then to Record to satisfy TypeScript
        const rawInvoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = rawInvoice.subscription as string | null;
        const billingReason = rawInvoice.billing_reason as string | null;

        if (subscriptionId && billingReason === 'subscription_cycle') {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            // Get current_period_end from raw subscription data
            const rawSub = subscription as unknown as Record<string, unknown>;
            const periodEnd = rawSub.current_period_end;
            
            let currentPeriodEnd: Date;
            if (typeof periodEnd === 'number' && periodEnd > 0) {
              currentPeriodEnd = new Date(periodEnd * 1000);
            } else {
              // Fallback: extend by 1 month
              currentPeriodEnd = new Date();
              currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
            }

            await User.findByIdAndUpdate(userId, {
              subscriptionStatus: 'active',
              subscriptionEndsAt: currentPeriodEnd,
            });

            console.log(`Subscription renewed for user ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}