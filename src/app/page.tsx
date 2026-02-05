// src/app/page.tsx
//
// =========================================================================
// PERFORMANCE FIX: Major rewrite for fast initial load.
//
// BEFORE: The entire landing page was 'use client' — meaning:
// - Zero server-side rendering (all JS had to download + execute first)
// - ALL components (LiveFeedPreview, StepsSection, FeaturesShowcase, etc.)
//   were bundled into one massive JS chunk
// - The barrel import from '@/components' pulled in EVERY component
//   (including dashboard-only ones like ArbTable, BetTracker, etc.)
//
// AFTER:
// - Static content (hero text, pricing, FAQ, comparison) is server-rendered
//   HTML that arrives instantly — no JS needed to display
// - Interactive parts (auth modals, theme toggle, session checks) are in
//   a thin client wrapper
// - Heavy below-fold components are dynamically imported with next/dynamic
//   so they load on-demand, not upfront
// - Direct imports instead of barrel exports to enable proper tree-shaking
// =========================================================================

import { Suspense } from 'react';
import { LandingPageClient } from './LandingPageClient';

// Main export — this is a SERVER component (no 'use client')
// It renders the client component inside Suspense for useSearchParams
export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingPageClient />
    </Suspense>
  );
}
