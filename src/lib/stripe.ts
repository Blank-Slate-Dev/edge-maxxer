// src/lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Price IDs from your Stripe Dashboard
// You'll need to create these products/prices in Stripe and update these IDs
export const PRICE_IDS = {
  // 3-day trial - one-time payment
  TRIAL_3DAY: process.env.STRIPE_PRICE_TRIAL_3DAY || 'price_trial_3day',
  
  // Monthly subscription - $4.99 first month, then $9.99/month
  // This uses a coupon for the first month discount
  MONTHLY: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly',
  
  // Yearly subscription - $99/year
  YEARLY: process.env.STRIPE_PRICE_YEARLY || 'price_yearly',
};

// Coupon for first month discount ($5 off = $9.99 - $5 = $4.99)
export const FIRST_MONTH_COUPON = process.env.STRIPE_COUPON_FIRST_MONTH || 'FIRST_MONTH_DISCOUNT';

export type PlanType = 'trial' | 'monthly' | 'yearly';

export interface PlanConfig {
  id: PlanType;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  description: string;
  priceId: string;
  isRecurring: boolean;
  trialDays?: number;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  trial: {
    id: 'trial',
    name: '3-Day Trial',
    price: 2.99,
    period: '3 days',
    description: 'Try all features',
    priceId: PRICE_IDS.TRIAL_3DAY,
    isRecurring: false,
    trialDays: 3,
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    price: 4.99,
    originalPrice: 9.99,
    period: 'first month',
    description: 'Then $9.99/month',
    priceId: PRICE_IDS.MONTHLY,
    isRecurring: true,
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly',
    price: 99,
    period: 'year',
    description: 'Save 17% vs monthly',
    priceId: PRICE_IDS.YEARLY,
    isRecurring: true,
  },
};