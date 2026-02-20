// src/app/page.tsx
//
// NOTE: This file stays a SERVER component for SEO/performance.
// The interactive landing experience remains in LandingPageClient.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LandingPageClient } from './LandingPageClient';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function LandingPage() {
  return (
    <>
      {/* Interactive landing page wrapper */}
      <Suspense fallback={null}>
        <LandingPageClient />
      </Suspense>
    </>
  );
}
