// src/components/CheckoutModal.tsx
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { useTheme } from '@/contexts/ThemeContext';
import { X, CreditCard, Shield, Lock } from 'lucide-react';

// NOTE: Stripe is NOT loaded at module level. It is loaded lazily inside the
// component only when the modal is actually open. This prevents Stripe's JS
// (and its tracking/fingerprinting scripts) from loading on every page,
// which was causing dozens of "Tracking Prevention blocked access to storage"
// console errors on the landing page in Edge and other privacy-aware browsers.

type PlanType = 'trial' | 'monthly' | 'yearly';

interface PlanInfo {
  id: PlanType;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
}

const PLAN_INFO: Record<PlanType, PlanInfo> = {
  trial: {
    id: 'trial',
    name: '3-Day Trial',
    price: 2.99,
    period: 'one-time',
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    price: 4.99,
    originalPrice: 9.99,
    period: 'first month',
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly',
    price: 99,
    period: 'year',
  },
};

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanType | null;
}

export function CheckoutModal({ isOpen, onClose, plan }: CheckoutModalProps) {
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  // Lazy-load Stripe only when the modal is open
  const stripePromise = useMemo(() => {
    if (!isOpen) return null;
    return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const fetchClientSecret = useCallback(async () => {
    if (!plan) throw new Error('No plan selected');

    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, embedded: true }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Failed to initialize checkout');
      throw new Error(data.error || 'Failed to initialize checkout');
    }

    return data.clientSecret;
  }, [plan]);

  const onComplete = useCallback(() => {
    // The embedded checkout will redirect to the return_url automatically
  }, []);

  if (!isOpen || !plan) return null;

  const planInfo = PLAN_INFO[plan];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
    >
      {/* Backdrop - click to close */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Modal Container - fixed height with internal scroll */}
      <div 
        className="relative w-full max-w-xl flex flex-col rounded-2xl border animate-scale-in"
        style={{ 
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          maxHeight: '75vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - fixed */}
        <div 
          className="flex-shrink-0 flex items-center justify-between p-4 border-b rounded-t-2xl"
          style={{ 
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)'
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--background)' }}
            >
              <CreditCard className="w-4 h-4" style={{ color: '#14b8a6' }} />
            </div>
            <div>
              <h2 
                className="text-base font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                Complete your purchase
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {planInfo.name} — ${planInfo.price}/{planInfo.period}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--background)]"
            style={{ color: 'var(--muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Checkout Content - scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          {error ? (
            <div className="text-center py-8">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'color-mix(in srgb, var(--danger) 15%, transparent)' }}
              >
                <X className="w-7 h-7" style={{ color: 'var(--danger)' }} />
              </div>
              <h3 
                className="text-base font-semibold mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Something went wrong
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                {error}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--background)]"
                style={{ 
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                Close
              </button>
            </div>
          ) : stripePromise ? (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ 
                fetchClientSecret, 
                onComplete,
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : null}
        </div>

        {/* Footer - fixed */}
        <div 
          className="flex-shrink-0 p-3 border-t rounded-b-2xl"
          style={{ 
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)'
          }}
        >
          <div className="flex items-center justify-center gap-6 text-xs" style={{ color: 'var(--muted)' }}>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>Secure checkout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              <span>Powered by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
