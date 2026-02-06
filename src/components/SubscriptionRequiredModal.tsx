// src/components/SubscriptionRequiredModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Lock, Zap, TrendingUp, Shield, Clock, Check, Star } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';

type PlanType = 'trial' | 'monthly' | 'yearly';

interface PlanOption {
  id: PlanType;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  description: string;
  badge?: string;
}

const PLANS: PlanOption[] = [
  {
    id: 'trial',
    name: '3-Day Trial',
    price: 2.99,
    period: 'one-time',
    description: 'Try all features for 3 days',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 4.99,
    originalPrice: 9.99,
    period: '/first month',
    description: 'Then $9.99/month',
    badge: 'Most Popular',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 99,
    period: '/year',
    description: 'Save 17% vs monthly',
    badge: 'Best Value',
  },
];

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialExpired?: boolean;
}

export function SubscriptionRequiredModal({ isOpen, onClose, trialExpired }: SubscriptionRequiredModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPlan(null);
      setCheckoutOpen(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen && !checkoutOpen) {
      document.body.style.overflow = 'hidden';
    } else if (!isOpen) {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, checkoutOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !checkoutOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, checkoutOpen]);

  if (!isOpen) return null;

  // If checkout is open, render it on top
  if (checkoutOpen && selectedPlan) {
    return (
      <CheckoutModal
        isOpen={true}
        onClose={() => {
          setCheckoutOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
      />
    );
  }

  const handlePlanSelect = (planId: PlanType) => {
    setSelectedPlan(planId);
    setCheckoutOpen(true);
  };

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
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg rounded-2xl border animate-scale-in"
        style={{ 
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors hover:bg-[var(--background)] z-10"
          style={{ color: 'var(--muted)' }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Icon & Title */}
          <div className="text-center mb-6">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ 
                backgroundColor: trialExpired 
                  ? 'color-mix(in srgb, var(--warning) 15%, transparent)'
                  : 'color-mix(in srgb, var(--primary) 15%, transparent)',
              }}
            >
              {trialExpired ? (
                <Clock className="w-8 h-8" style={{ color: 'var(--warning)' }} />
              ) : (
                <Lock className="w-8 h-8" style={{ color: 'var(--primary)' }} />
              )}
            </div>

            <h2 
              className="text-xl sm:text-2xl font-semibold mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              {trialExpired ? 'Free Trial Ended' : 'Subscription Required'}
            </h2>

            <p 
              className="text-sm sm:text-base"
              style={{ color: 'var(--muted)' }}
            >
              {trialExpired 
                ? 'Your 10-minute free trial has ended. Choose a plan to keep finding profitable arbitrage opportunities.'
                : 'Choose a plan to unlock the full power of Edge Maxxer\'s arbitrage scanner.'}
            </p>
          </div>

          {/* Plan Cards */}
          <div className="space-y-3 mb-6">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handlePlanSelect(plan.id)}
                className="w-full text-left rounded-xl border p-4 transition-all hover:border-[var(--primary)] group relative"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--primary) 5%, var(--background))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--background)';
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <span
                    className="absolute -top-2.5 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: plan.id === 'yearly' ? 'var(--success)' : 'var(--primary)',
                      color: 'white',
                    }}
                  >
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {plan.name}
                      </span>
                    </div>
                    <p 
                      className="text-xs"
                      style={{ color: 'var(--muted)' }}
                    >
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="flex items-baseline gap-1">
                      {plan.originalPrice && (
                        <span 
                          className="text-sm line-through"
                          style={{ color: 'var(--muted)' }}
                        >
                          ${plan.originalPrice}
                        </span>
                      )}
                      <span 
                        className="text-xl font-bold"
                        style={{ color: 'var(--foreground)' }}
                      >
                        ${plan.price}
                      </span>
                      <span 
                        className="text-xs"
                        style={{ color: 'var(--muted)' }}
                      >
                        {plan.period}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Features list */}
          <div 
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: 'var(--background)' }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)' }}
                >
                  <Zap className="w-4 h-4" style={{ color: 'var(--success)' }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                  Real-time arbitrage detection
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}
                >
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                  H2H, spreads, totals & middles
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 15%, transparent)' }}
                >
                  <Shield className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                  Multi-region bookmaker coverage
                </span>
              </div>
            </div>
          </div>

          {/* Cancel anytime note */}
          <p 
            className="text-xs text-center"
            style={{ color: 'var(--muted-foreground)' }}
          >
            All plans include full access • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
