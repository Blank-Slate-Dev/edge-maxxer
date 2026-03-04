// src/components/PublicNav.tsx
//
// Shared nav for all public/SEO pages:
// /learn, /guides/*, /tools/*, /alternatives/*, /australia/*, /uk/*, /us/*, /eu/*, /sports/*
//
// Intentionally lightweight — no session, no subscription state.
// Just the logo (links to /), theme toggle, and a "Try free" CTA.

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function PublicNav() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="border-b sticky top-0 z-50 transition-colors"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--background)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">

          {/* Logo — links to home */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo_thin_dark_version.png"
              alt="Edge Maxxer"
              width={300}
              height={72}
              priority
              className="h-10 sm:h-12 lg:h-16 w-auto logo-dark"
            />
            <Image
              src="/logo_thin_light_version.png"
              alt="Edge Maxxer"
              width={300}
              height={72}
              priority
              className="h-10 sm:h-12 lg:h-16 w-auto logo-light"
            />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
              style={{ color: 'var(--muted)' }}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Try free CTA */}
            <Link
              href="/dashboard"
              className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
            >
              Try free
            </Link>

          </div>
        </div>
      </div>
    </header>
  );
}