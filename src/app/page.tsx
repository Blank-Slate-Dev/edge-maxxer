// src/app/page.tsx
//
// NOTE: This file stays a SERVER component for SEO/performance.
// The interactive landing experience remains in LandingPageClient.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { LandingPageClient } from './LandingPageClient';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function LandingPage() {
  return (
    <>
      {/*
        Internal linking strip (server-rendered):
        - Helps Google discover your SEO pages
        - Matches your existing UI styling
        - Does NOT add client JS
      */}
      <section
        className="w-full border-b"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-secondary)' }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm" style={{ color: 'var(--foreground)' }}>
              <span className="font-medium">Learn:</span>
              <span className="ml-2" style={{ color: 'var(--muted)' }}>
                Guides + comparisons for arbitrage betting and arb scanners.
              </span>
            </div>

            <nav aria-label="Learn navigation" className="flex flex-wrap gap-2 text-sm">
              <Link
                href="/learn"
                className="px-3 py-1.5 rounded-lg border hover:opacity-90 transition-opacity"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                Learn hub
              </Link>
              <Link
                href="/guides/arbitrage-betting"
                className="px-3 py-1.5 rounded-lg border hover:opacity-90 transition-opacity"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                Arbitrage betting guide
              </Link>
              <Link
                href="/alternatives/oddsjam"
                className="px-3 py-1.5 rounded-lg border hover:opacity-90 transition-opacity"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                OddsJam alternative
              </Link>
              <Link
                href="/australia/arbitrage-betting"
                className="px-3 py-1.5 rounded-lg border hover:opacity-90 transition-opacity"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                Australia
              </Link>
              <Link
                href="/sports/afl/arbitrage"
                className="px-3 py-1.5 rounded-lg border hover:opacity-90 transition-opacity"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                AFL
              </Link>
            </nav>
          </div>
        </div>
      </section>

      {/* Interactive landing page wrapper */}
      <Suspense fallback={null}>
        <LandingPageClient />
      </Suspense>
    </>
  );
}
