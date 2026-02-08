// src/app/LandingPageClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Sun,
  Moon,
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';

// =========================================================================
// PERFORMANCE: Direct imports for critical above-fold components only.
// NO barrel imports from '@/components' — that pulled in everything.
// =========================================================================
import { AuthModals } from '@/components/AuthModals';
import { CheckoutModal } from '@/components/CheckoutModal';
import { useGeoRegion } from '@/components/SportsbooksModal';

// =========================================================================
// PERFORMANCE: Dynamic imports for below-fold / heavy components.
// These are loaded on-demand and don't block initial page render.
// =========================================================================
const SportsbookSlider = dynamic(
  () => import('@/components/SportsbookSlider').then(mod => ({ default: mod.SportsbookSlider })),
  { ssr: false }
);

const LiveFeedPreview = dynamic(
  () => import('@/components/LiveFeedPreview').then(mod => ({ default: mod.LiveFeedPreview })),
  { ssr: false, loading: () => <LiveFeedPlaceholder /> }
);

const ProfitCounter = dynamic(
  () => import('@/components/ProfitCounter').then(mod => ({ default: mod.ProfitCounter })),
  { ssr: false, loading: () => <span style={{ color: '#22c55e' }} className="text-xl font-semibold font-mono">$0.00</span> }
);

const StepsSection = dynamic(
  () => import('@/components/StepsSection').then(mod => ({ default: mod.StepsSection })),
  { ssr: false }
);

const FeaturesShowcase = dynamic(
  () => import('@/components/FeaturesShowcase').then(mod => ({ default: mod.FeaturesShowcase })),
  { ssr: false }
);

const TestimonialsSection = dynamic(
  () => import('@/components/TestimonialsSection').then(mod => ({ default: mod.TestimonialsSection })),
  { ssr: false }
);

const SportsbooksModal = dynamic(
  () => import('@/components/SportsbooksModal').then(mod => ({ default: mod.SportsbooksModal })),
  { ssr: false }
);

const ResponsibleGambling = dynamic(
  () => import('@/components/ResponsibleGambling').then(mod => ({ default: mod.ResponsibleGambling })),
  { ssr: false }
);

// Lightweight placeholder for the LiveFeedPreview while it loads
function LiveFeedPlaceholder() {
  return (
    <div 
      className="w-full rounded-2xl animate-pulse"
      style={{ 
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        height: '500px',
      }} 
    />
  );
}

type AuthModalType = 'login' | 'signup' | null;
type PlanType = 'trial' | 'monthly' | 'yearly';

interface PricingPlan {
  id: PlanType;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  periodNote?: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  popular?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'trial',
    name: '3-Day Trial',
    price: 2.99,
    period: 'one-time',
    description: 'Try all features risk-free',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 4.99,
    originalPrice: 9.99,
    period: 'first month',
    periodNote: 'then $9.99/mo',
    description: 'Full access, cancel anytime',
    popular: true,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 99,
    period: 'year',
    description: 'Best value — save 17%',
    badge: 'Best value',
    badgeColor: '#22c55e',
  },
];

const FEATURES = [
  'All 4 regions (AU, UK, US, EU)',
  'Real-time arbitrage scanning',
  'Spreads, totals & middles',
  'Positive EV alerts',
  'Stealth mode',
  'Bet tracking & history',
  'Account health monitoring',
  'Unlimited scans',
];

export function LandingPageClient() {
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authModal, setAuthModal] = useState<AuthModalType>(null);
  const [sportsbooksOpen, setSportsbooksOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanType | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const detectedRegion = useGeoRegion();

  // Check if session is authenticated (handles both loaded and loading states gracefully)
  const isAuthenticated = status === 'authenticated' && !!session;
  const isLoading = status === 'loading';

  // Auto-open auth modal from URL query params (e.g., /?auth=login)
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'login' || authParam === 'signup') {
      setAuthModal(authParam);
    }
  }, [searchParams]);

  const handleSelectPlan = async (planId: PlanType) => {
    if (!session) {
      setPendingPlan(planId);
      setAuthModal('signup');
      return;
    }
    setCheckoutPlan(planId);
  };

  // Handle auth modal close - clears URL param if present
  const handleAuthModalClose = () => {
    setAuthModal(null);

    // Remove ?auth= from URL without reload
    if (searchParams.get('auth')) {
      router.replace('/', { scroll: false });
    }

    if (pendingPlan && session) {
      setCheckoutPlan(pendingPlan);
      setPendingPlan(null);
    }
  };

  const handleCheckoutClose = () => {
    setCheckoutPlan(null);
  };

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--background) 80%, transparent)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo_thin_dark_version.png"
                  alt="Edge Maxxer - Sports Arbitrage Betting Scanner"
                  width={300}
                  height={72}
                  priority
                  className="h-10 sm:h-12 lg:h-16 w-auto logo-dark"
                />
                <Image
                  src="/logo_thin_light_version.png"
                  alt="Edge Maxxer - Sports Arbitrage Betting Scanner"
                  width={300}
                  height={72}
                  priority
                  className="h-10 sm:h-12 lg:h-16 w-auto logo-light"
                />
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a
                href="#features"
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                How it Works
              </a>

              <a
                href="#pricing"
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Pricing
              </a>

              <a
                href="#faq"
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                FAQ
              </a>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--muted)' }}
                aria-label={`Switch to ${
                  theme === 'dark' ? 'light' : 'dark'
                } mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Auth buttons with loading state handling */}
              {isLoading ? (
                <div
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg"
                  style={{
                    backgroundColor: 'var(--surface)',
                    minWidth: '100px',
                  }}
                >
                  <div
                    className="h-5 w-16 animate-pulse rounded"
                    style={{ backgroundColor: 'var(--border)' }}
                  />
                </div>
              ) : isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium rounded-lg transition-all hover:opacity-90"
                  style={{
                    backgroundColor: '#14b8a6',
                    color: '#fff',
                  }}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => setAuthModal('login')}
                    className="hidden sm:block px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[var(--surface)]"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setAuthModal('signup')}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium rounded-lg transition-all hover:opacity-90"
                    style={{
                      backgroundColor: '#14b8a6',
                      color: '#fff',
                    }}
                  >
                    <span className="hidden sm:inline">Join Now</span>
                    <span className="sm:hidden">Join</span>
                  </button>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileNavOpen(true)}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)] md:hidden"
                style={{ color: 'var(--foreground)' }}
                aria-label="Open mobile menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute top-0 right-0 bottom-0 w-[75%] max-w-xs"
            style={{ backgroundColor: 'var(--background)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-4 py-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <span
                className="font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Menu
              </span>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-2 rounded-lg"
                style={{ color: 'var(--muted)' }}
                aria-label="Close mobile menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4">
              <button
                onClick={() => scrollToSection('features')}
                className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--foreground)' }}
              >
                How it Works
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--foreground)' }}
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--foreground)' }}
              >
                FAQ
              </button>
              {!isAuthenticated && !isLoading && (
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    setAuthModal('login');
                  }}
                  className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--surface)]"
                  style={{ color: 'var(--foreground)' }}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 relative overflow-x-hidden">
        <div className="absolute inset-0 hero-grid-pattern" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-8 items-start max-w-full lg:min-h-[700px]">
            {/* Left: Text Content */}
            <div className="w-full sm:max-w-xl lg:max-w-lg overflow-hidden">
              {/* Live badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium mb-4 sm:mb-6 max-w-full"
                style={{
                  backgroundColor: 'var(--surface)',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: '#22c55e' }}
                />
                <span className="truncate">INSTANT MARKET REFRESHING</span>
              </div>

              {/* Headline */}
              <h1
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1] mb-4 sm:mb-6"
                style={{ color: 'var(--foreground)' }}
              >
                Beat the <span className="gradient-text">House.</span>
              </h1>

              {/* Subheadline */}
              <p
                className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold mb-3 sm:mb-4"
                style={{ color: 'var(--foreground)' }}
              >
                Stop Guessing. Start Profiting. Bet both sides—profit no matter
                the outcome.
              </p>

              <p
                className="text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed"
                style={{ color: 'var(--muted)' }}
              >
                We spent years mastering arbitrage betting. We built the tool we
                always needed, now we&apos;re sharing it with you. Our software
                scans over 80 sportsbooks for profitable discrepancies 24/7.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button
                  onClick={() => handleSelectPlan('trial')}
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{
                    backgroundColor: '#14b8a6',
                    color: '#fff',
                  }}
                >
                  Try for $2.99
                </button>

                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--surface)]"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                >
                  View pricing
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Profit Counter */}
              <div
                className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg mb-8 sm:mb-10 max-w-full"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: '#22c55e' }}
                />
                <span
                  className="text-xs sm:text-sm whitespace-nowrap"
                  style={{ color: 'var(--muted)' }}
                >
                  Users have made
                </span>
                <ProfitCounter initialValue={0} refreshInterval={15000} />
                <span
                  className="text-xs sm:text-sm whitespace-nowrap"
                  style={{ color: 'var(--muted)' }}
                >
                  in profit
                </span>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-4 sm:mb-6">
                {[
                  { value: '80+', label: 'SPORTSBOOKS' },
                  { value: '<2s', label: 'LATENCY' },
                  { value: '24/7', label: 'UPTIME' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div
                      className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-0.5"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="text-[8px] sm:text-[9px] md:text-[10px] tracking-wider"
                      style={{ color: 'var(--muted)' }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sportsbook logos slider */}
              <div className="mb-4 overflow-hidden">
                <SportsbookSlider
                  onViewAll={() => setSportsbooksOpen(true)}
                  compact
                  region={detectedRegion}
                />
              </div>
            </div>

            {/* Right: Feed Preview */}
            <div className="w-full lg:mt-16">
              <LiveFeedPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <div id="features" className="scroll-mt-20 sm:scroll-mt-24">
        <StepsSection />
      </div>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Features Showcase */}
      <FeaturesShowcase />

      {/* Comparison */}
      <section
        className="py-16 sm:py-20 px-4 sm:px-6 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2
              className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              Stop overpaying for arb software
            </h2>
            <p className="text-sm sm:text-base" style={{ color: 'var(--muted)' }}>
              Same features, 33x lower price
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Competitors */}
            <div
              className="p-4 sm:p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="text-xs sm:text-sm font-medium mb-3 sm:mb-4"
                style={{ color: 'var(--muted)' }}
              >
                Other scanners
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                    Monthly cost
                  </span>
                  <span className="font-medium line-through text-sm" style={{ color: 'var(--foreground)' }}>
                    $150 - $350
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                    Typical arbs
                  </span>
                  <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                    1-2% profit
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                    Hidden API fees
                  </span>
                  <span className="font-medium text-sm" style={{ color: 'var(--danger)' }}>
                    Always
                  </span>
                </div>
              </div>
            </div>

            {/* Edge Maxxer */}
            <div
              className="p-4 sm:p-6 rounded-xl border-2"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: '#14b8a6',
              }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="text-xs sm:text-sm font-medium" style={{ color: '#14b8a6' }}>
                  Edge Maxxer
                </div>
                <span
                  className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#14b8a6', color: '#fff' }}
                >
                  Save 90%
                </span>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                    Monthly cost
                  </span>
                  <span className="text-lg sm:text-xl font-semibold" style={{ color: '#22c55e' }}>
                    $9.99
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                    Typical arbs
                  </span>
                  <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                    5-7% profit
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                    Hidden fees
                  </span>
                  <span className="font-medium text-sm" style={{ color: '#22c55e' }}>
                    Never
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-16 sm:py-20 px-4 sm:px-6 border-t scroll-mt-20 sm:scroll-mt-24"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2
              className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              Choose your plan
            </h2>
            <p className="text-sm sm:text-base" style={{ color: 'var(--muted)' }}>
              All plans include every feature. No hidden fees.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border overflow-hidden transition-all flex flex-col ${
                  plan.popular ? 'ring-2 ring-[#14b8a6]' : ''
                }`}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: plan.popular ? '#14b8a6' : 'var(--border)',
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold z-10"
                    style={{
                      backgroundColor: plan.badgeColor || '#14b8a6',
                      color: '#fff',
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                {plan.popular && (
                  <div
                    className="text-center py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium"
                    style={{ backgroundColor: '#14b8a6', color: '#fff' }}
                  >
                    Most Popular
                  </div>
                )}

                <div className="p-4 sm:p-6 flex flex-col flex-1">
                  <h3
                    className="text-base sm:text-lg font-semibold mb-3 sm:mb-4"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {plan.name}
                  </h3>

                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-baseline gap-1">
                      {plan.originalPrice && (
                        <span className="text-base sm:text-lg line-through" style={{ color: 'var(--muted)' }}>
                          ${plan.originalPrice}
                        </span>
                      )}
                      <span className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
                        ${plan.price}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        /{plan.period}
                      </span>
                    </div>
                    {plan.periodNote && (
                      <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        {plan.periodNote}
                      </p>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm mb-4 sm:mb-6" style={{ color: 'var(--muted)' }}>
                    {plan.description}
                  </p>

                  <div className="flex-1" />

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className="w-full py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 hover:opacity-90"
                    style={{
                      backgroundColor: plan.popular ? '#14b8a6' : 'var(--background)',
                      color: plan.popular ? '#fff' : 'var(--foreground)',
                      border: plan.popular ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    Get {plan.name}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Features list */}
          <div
            className="rounded-xl border p-4 sm:p-6 lg:p-8"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <h3
              className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 text-center"
              style={{ color: 'var(--foreground)' }}
            >
              All plans include
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" style={{ color: '#22c55e' }} />
                  <span className="text-xs sm:text-sm" style={{ color: 'var(--foreground)' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs sm:text-sm mt-4 sm:mt-6" style={{ color: 'var(--muted)' }}>
            Cancel anytime • Instant access • Secure payment via Stripe
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="py-16 sm:py-20 px-4 sm:px-6 border-t scroll-mt-20 sm:scroll-mt-24"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2
              className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {[
              {
                q: 'What is sports arbitrage?',
                a: 'Arbitrage betting exploits odds differences between bookmakers to guarantee profit regardless of outcome. When bookmakers disagree on odds, you can bet both sides and lock in a profit.',
              },
              {
                q: 'How much can I realistically make?',
                a: 'Returns depend on your bankroll and activity. With a $1,000 bankroll, users typically see 3-5% monthly returns from arbitrage opportunities.',
              },
              {
                q: 'Will I get limited by bookmakers?',
                a: 'All profitable bettors face limiting eventually. Our stealth mode helps you stay under the radar longer by randomizing stakes and suggesting distribution strategies.',
              },
              {
                q: 'Do I need my own API key?',
                a: 'No. Unlike other platforms, everything is included — we handle all the data feeds so you can focus on placing bets. No setup, no extra costs.',
              },
              {
                q: 'Which bookmakers do you support?',
                a: 'We scan 80+ bookmakers across Australia, UK, US, and EU including Sportsbet, TAB, Bet365, Ladbrokes, DraftKings, FanDuel, and many more.',
              },
              {
                q: 'What happens after my 3-day trial?',
                a: 'The 3-day trial is a one-time payment with no automatic renewal. After 3 days, you can choose to subscribe to our monthly or yearly plan to continue using the service.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: openFaq === i ? 'var(--surface)' : 'transparent',
                  borderColor: 'var(--border)',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-medium text-sm sm:text-base pr-4" style={{ color: 'var(--foreground)' }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--muted)' }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4" style={{ color: 'var(--foreground)' }}>
            Ready to find your edge?
          </h2>
          <p className="mb-6 sm:mb-8 text-sm sm:text-base" style={{ color: 'var(--muted)' }}>
            Start scanning for arbitrage opportunities today.
          </p>
          <button
            onClick={() => handleSelectPlan('trial')}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 hover:gap-3"
            style={{ backgroundColor: '#14b8a6', color: '#fff' }}
          >
            Try for $2.99
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center">
              <Image
                src="/logo_thin_dark_version.png"
                alt="Edge Maxxer"
                width={100}
                height={24}
                className="h-4 sm:h-5 w-auto logo-footer"
              />
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
              <Link href="/terms" className="hover:opacity-70 transition-opacity">
                Terms
              </Link>
              <Link href="/privacy" className="hover:opacity-70 transition-opacity">
                Privacy
              </Link>
              <a href="mailto:support@edgemaxxer.com" className="hover:opacity-70 transition-opacity">
                Contact
              </a>
            </div>
          </div>
          <div className="text-center mt-6 sm:mt-8">
            <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted)' }}>
              © {new Date().getFullYear()} Edge Maxxer. Gambling involves risk. Please gamble responsibly.
            </p>
          </div>
        </div>
      </footer>

      {/* Responsible Gambling Footer */}
      <ResponsibleGambling />

      {/* Modals */}
      <AuthModals
        isOpen={authModal}
        onClose={handleAuthModalClose}
        onSwitch={setAuthModal}
        onAuthSuccess={() => {
          if (pendingPlan) {
            setTimeout(() => {
              setCheckoutPlan(pendingPlan);
              setPendingPlan(null);
            }, 500);
          }
        }}
      />

      <SportsbooksModal
        isOpen={sportsbooksOpen}
        onClose={() => setSportsbooksOpen(false)}
        detectedRegion={detectedRegion}
      />

      <CheckoutModal
        isOpen={checkoutPlan !== null}
        onClose={handleCheckoutClose}
        plan={checkoutPlan}
      />
    </div>
  );
}
