// src/app/page.tsx
'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  AuthModals, 
  SportsbooksModal, 
  useGeoRegion,
  LiveFeedPreview,
  StepsSection,
  FeaturesShowcase,
  TestimonialsSection,
  SportsbookSlider,
  ProfitCounter
} from '@/components';
import { CheckoutModal } from '@/components/CheckoutModal';
import { 
  Sun, 
  Moon, 
  ArrowRight, 
  Check, 
  ChevronDown,
  Loader2,
} from 'lucide-react';

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

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const [authModal, setAuthModal] = useState<AuthModalType>(null);
  const [sportsbooksOpen, setSportsbooksOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanType | null>(null);
  
  const detectedRegion = useGeoRegion();

  const handleSelectPlan = async (planId: PlanType) => {
    // If not logged in, show signup modal and store the plan they wanted
    if (!session) {
      setPendingPlan(planId);
      setAuthModal('signup');
      return;
    }

    // User is logged in, open embedded checkout modal
    setCheckoutPlan(planId);
  };

  // Handle successful signup - proceed to checkout if they had a pending plan
  const handleAuthClose = () => {
    setAuthModal(null);
    
    // If user just signed up and had selected a plan, open checkout modal
    if (pendingPlan && session) {
      setCheckoutPlan(pendingPlan);
      setPendingPlan(null);
    }
  };

  const handleCheckoutClose = () => {
    setCheckoutPlan(null);
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
        style={{ 
          backgroundColor: 'color-mix(in srgb, var(--background) 80%, transparent)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo wrapper - matches Header.tsx structure */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center">
                {/* Both logos rendered, CSS controls visibility based on theme */}
                <Image
                  src="/logo_thin_dark_version.png"
                  alt="Edge Maxxer"
                  width={300}
                  height={72}
                  priority
                  className="h-16 w-auto logo-dark"
                />
                <Image
                  src="/logo_thin_light_version.png"
                  alt="Edge Maxxer"
                  width={300}
                  height={72}
                  priority
                  className="h-16 w-auto logo-light"
                />
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-8">
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

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--muted)' }}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {session ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg transition-all hover:opacity-90"
                  style={{ 
                    backgroundColor: '#14b8a6',
                    color: '#fff'
                  }}
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setAuthModal('login')}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[var(--surface)]"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setAuthModal('signup')}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg transition-all hover:opacity-90"
                    style={{ 
                      backgroundColor: '#14b8a6',
                      color: '#fff'
                    }}
                  >
                    Join Now
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        {/* Grid pattern background */}
        <div className="absolute inset-0 hero-grid-pattern" />
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-start">
            {/* Left: Text Content */}
            <div className="max-w-xl lg:max-w-lg">
              {/* Live badge */}
              <div 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
                style={{ 
                  backgroundColor: 'var(--surface)',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)'
                }}
              >
                <span 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: '#22c55e' }}
                />
                LIVE MARKET REFRESHED EVERY 2S
              </div>

              {/* Headline */}
              <h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
                style={{ color: 'var(--foreground)' }}
              >
                Beat the{' '}
                <span className="gradient-text">House.</span>
              </h1>
              
              {/* Subheadline */}
              <p 
                className="text-lg md:text-xl font-semibold mb-4"
                style={{ color: 'var(--foreground)' }}
              >
                Stop Guessing. Start Profiting. Bet both sides—profit no matter the outcome.
              </p>

              <p 
                className="text-base mb-8 leading-relaxed"
                style={{ color: 'var(--muted)' }}
              >
                We spent years mastering arbitrage betting. We built the tool we always needed, now we're sharing it with you. Our software scans over 80 sportsbooks for profitable discrepancies 24/7.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <button
                  onClick={() => handleSelectPlan('trial')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ 
                    backgroundColor: '#14b8a6',
                    color: '#fff'
                  }}
                >
                  Try for $2.99
                </button>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--surface)]"
                  style={{ 
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                >
                  View pricing
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Profit Counter */}
              <div 
                className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg mb-10"
                style={{ 
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)'
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: '#22c55e' }}
                />
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  Users have made
                </span>
                <ProfitCounter initialValue={0} refreshInterval={5000} />
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  in profit
                </span>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-8 md:gap-12 mb-6">
                {[
                  { value: '80+', label: 'SPORTSBOOKS' },
                  { value: '<2s', label: 'LATENCY' },
                  { value: '24/7', label: 'UPTIME' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div 
                      className="text-2xl md:text-3xl font-bold mb-0.5"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {stat.value}
                    </div>
                    <div 
                      className="text-[10px] tracking-wider"
                      style={{ color: 'var(--muted)' }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sportsbook logos slider */}
              <div className="mb-4">
                <SportsbookSlider onViewAll={() => setSportsbooksOpen(true)} compact />
              </div>
            </div>

            {/* Right: Feed Preview - aligned with headline */}
            <div className="relative flex justify-center lg:justify-start lg:mt-16">
              <LiveFeedPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <div id="features">
        <StepsSection />
      </div>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Features Showcase */}
      <FeaturesShowcase />

      {/* Comparison */}
      <section className="py-20 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl font-bold mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              Stop overpaying for arb software
            </h2>
            <p style={{ color: 'var(--muted)' }}>
              Same features, 10x lower price
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Competitors */}
            <div 
              className="p-6 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="text-sm font-medium mb-4" style={{ color: 'var(--muted)' }}>
                Other scanners
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Monthly cost</span>
                  <span className="font-medium line-through" style={{ color: 'var(--foreground)' }}>$50 - $199</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Typical arbs</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>1-2% profit</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Hidden API fees</span>
                  <span className="font-medium" style={{ color: 'var(--danger)' }}>Often yes</span>
                </div>
              </div>
            </div>

            {/* Edge Maxxer */}
            <div 
              className="p-6 rounded-xl border-2"
              style={{ 
                backgroundColor: 'var(--surface)',
                borderColor: '#14b8a6'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium" style={{ color: '#14b8a6' }}>
                  Edge Maxxer
                </div>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#14b8a6', color: '#fff' }}
                >
                  Save 90%
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Monthly cost</span>
                  <span className="text-xl font-semibold" style={{ color: '#22c55e' }}>$9.99</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Typical arbs</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>5-7% profit</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Hidden fees</span>
                  <span className="font-medium" style={{ color: '#22c55e' }}>Never</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl font-bold mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              Choose your plan
            </h2>
            <p style={{ color: 'var(--muted)' }}>
              All plans include every feature. No hidden fees.
            </p>
          </div>

          {/* Pricing Cards - 3 side by side */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border overflow-hidden transition-all flex flex-col ${
                  plan.popular ? 'ring-2 ring-[#14b8a6]' : ''
                }`}
                style={{ 
                  backgroundColor: 'var(--surface)',
                  borderColor: plan.popular ? '#14b8a6' : 'var(--border)'
                }}
              >
                {plan.badge && (
                  <div 
                    className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold z-10"
                    style={{ 
                      backgroundColor: plan.badgeColor || '#14b8a6',
                      color: '#fff'
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                {plan.popular && (
                  <div 
                    className="text-center py-2 text-xs font-medium"
                    style={{ backgroundColor: '#14b8a6', color: '#fff' }}
                  >
                    Most Popular
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <h3 
                    className="text-lg font-semibold mb-4"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {plan.name}
                  </h3>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      {plan.originalPrice && (
                        <span 
                          className="text-lg line-through"
                          style={{ color: 'var(--muted)' }}
                        >
                          ${plan.originalPrice}
                        </span>
                      )}
                      <span 
                        className="text-4xl font-bold"
                        style={{ color: 'var(--foreground)' }}
                      >
                        ${plan.price}
                      </span>
                      <span style={{ color: 'var(--muted)' }}>
                        /{plan.period}
                      </span>
                    </div>
                    {plan.periodNote && (
                      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        {plan.periodNote}
                      </p>
                    )}
                  </div>

                  <p 
                    className="text-sm mb-6"
                    style={{ color: 'var(--muted)' }}
                  >
                    {plan.description}
                  </p>

                  <div className="flex-1" />

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className="w-full py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 hover:opacity-90"
                    style={{ 
                      backgroundColor: plan.popular ? '#14b8a6' : 'var(--background)',
                      color: plan.popular ? '#fff' : 'var(--foreground)',
                      border: plan.popular ? 'none' : '1px solid var(--border)'
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
            className="rounded-xl border p-8"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
          >
            <h3 
              className="text-lg font-semibold mb-6 text-center"
              style={{ color: 'var(--foreground)' }}
            >
              All plans include
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" style={{ color: '#22c55e' }} />
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust note */}
          <p 
            className="text-center text-sm mt-6"
            style={{ color: 'var(--muted)' }}
          >
            Cancel anytime • Instant access • Secure payment via Stripe
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl font-bold mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'What is sports arbitrage?',
                a: 'Arbitrage betting exploits odds differences between bookmakers to guarantee profit regardless of outcome. When bookmakers disagree on odds, you can bet both sides and lock in a profit.'
              },
              {
                q: 'How much can I realistically make?',
                a: 'Returns depend on your bankroll and activity. With a $1,000 bankroll, users typically see 3-5% monthly returns from arbitrage opportunities.'
              },
              {
                q: 'Will I get limited by bookmakers?',
                a: 'All profitable bettors face limiting eventually. Our stealth mode helps you stay under the radar longer by randomizing stakes and suggesting distribution strategies.'
              },
              {
                q: 'What is the BYOK model?',
                a: 'Bring Your Own Key. You get a free API key from The Odds API, which lets us keep prices 10x lower than competitors who charge for API costs.'
              },
              {
                q: 'Which bookmakers do you support?',
                a: 'We scan 80+ bookmakers across Australia, UK, US, and EU including Sportsbet, TAB, Bet365, Ladbrokes, DraftKings, FanDuel, and many more.'
              },
              {
                q: 'What happens after my 3-day trial?',
                a: 'The 3-day trial is a one-time payment with no automatic renewal. After 3 days, you can choose to subscribe to our monthly or yearly plan to continue using the service.'
              },
            ].map((faq, i) => (
              <div 
                key={i}
                className="rounded-lg border overflow-hidden"
                style={{ 
                  backgroundColor: openFaq === i ? 'var(--surface)' : 'transparent',
                  borderColor: 'var(--border)'
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {faq.q}
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--muted)' }}
                  />
                </button>
                {openFaq === i && (
                  <div 
                    className="px-4 pb-4 text-sm leading-relaxed"
                    style={{ color: 'var(--muted)' }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section 
        className="py-20 px-6 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 
            className="text-3xl font-bold mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            Ready to find your edge?
          </h2>
          <p className="mb-8" style={{ color: 'var(--muted)' }}>
            Start scanning for arbitrage opportunities today.
          </p>
          <button
            onClick={() => handleSelectPlan('trial')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 hover:gap-3"
            style={{ 
              backgroundColor: '#14b8a6',
              color: '#fff'
            }}
          >
            Try for $2.99
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-12 px-6 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Both logos rendered, CSS controls visibility based on theme */}
            <Image
              src="/logo_thin_dark_version.png"
              alt="Edge Maxxer"
              width={100}
              height={24}
              className="h-5 w-auto opacity-50 logo-dark"
            />
            <Image
              src="/logo_thin_light_version.png"
              alt="Edge Maxxer"
              width={100}
              height={24}
              className="h-5 w-auto opacity-50 logo-light"
            />
            <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--muted)' }}>
              <Link href="/terms" className="hover:opacity-70 transition-opacity">Terms</Link>
              <Link href="/privacy" className="hover:opacity-70 transition-opacity">Privacy</Link>
              <a href="mailto:support@edgemaxxer.com" className="hover:opacity-70 transition-opacity">Contact</a>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              © {new Date().getFullYear()} Edge Maxxer. Gambling involves risk. Please gamble responsibly.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModals 
        isOpen={authModal} 
        onClose={handleAuthClose}
        onSwitch={setAuthModal}
        onAuthSuccess={() => {
          // After successful auth, if there was a pending plan, open checkout
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

      {/* Embedded Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutPlan !== null}
        onClose={handleCheckoutClose}
        plan={checkoutPlan}
      />
    </div>
  );
}