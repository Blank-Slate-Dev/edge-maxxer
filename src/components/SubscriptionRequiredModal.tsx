// src/components/SubscriptionRequiredModal.tsx
'use client';

import { useEffect } from 'react';
import { X, Lock, Zap, TrendingUp, Shield, Clock } from 'lucide-react';

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialExpired?: boolean;
}

export function SubscriptionRequiredModal({ isOpen, onClose, trialExpired }: SubscriptionRequiredModalProps) {
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

  if (!isOpen) return null;

  const handleSubscribe = () => {
    window.location.href = 'https://www.edgemaxxer.com/#pricing';
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
        className="relative w-full max-w-md rounded-2xl border animate-scale-in"
        style={{ 
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors hover:bg-[var(--background)]"
          style={{ color: 'var(--muted)' }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8 text-center">
          {/* Icon */}
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

          {/* Title */}
          <h2 
            className="text-xl sm:text-2xl font-semibold mb-2"
            style={{ color: 'var(--foreground)' }}
          >
            {trialExpired ? 'Free Trial Ended' : 'Subscription Required'}
          </h2>

          {/* Description */}
          <p 
            className="text-sm sm:text-base mb-6"
            style={{ color: 'var(--muted)' }}
          >
            {trialExpired 
              ? 'Your 10-minute free trial has ended. Subscribe now to keep finding profitable arbitrage opportunities.'
              : 'Unlock the full power of Edge Maxxer\u0027s arbitrage scanner with an active subscription.'}
          </p>

          {/* Features list */}
          <div 
            className="rounded-xl p-4 mb-6 text-left"
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

          {/* CTA Button */}
          <button
            onClick={handleSubscribe}
            className="w-full py-3 px-6 text-base font-semibold rounded-xl transition-all hover:opacity-90"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
            }}
          >
            {trialExpired ? 'Subscribe Now' : 'View Pricing Plans'}
          </button>

          {/* Secondary text */}
          <p 
            className="text-xs mt-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Plans start from just $2.99 • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
