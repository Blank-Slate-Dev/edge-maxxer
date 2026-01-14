// src/app/page.tsx
'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';
import { ProfitCounter } from '@/components/ProfitCounter';
import { 
  Sun, 
  Moon, 
  ArrowRight, 
  Check, 
  Zap, 
  Globe, 
  Shield, 
  Calculator,
  TrendingUp,
  BarChart3,
  ChevronDown
} from 'lucide-react';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ 
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              {theme === 'dark' ? (
                <Image
                  src="/logo_thin_dark_version.png"
                  alt="Edge Maxxer"
                  width={260}
                  height={62}
                  priority
                  className="h-14 w-auto"
                />
              ) : (
                <Image
                  src="/logo_thin_light_version.png"
                  alt="Edge Maxxer"
                  width={260}
                  height={62}
                  priority
                  className="h-14 w-auto"
                />
              )}
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a 
                href="#features" 
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Features
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

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--muted)' }}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link
                href="/login"
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm px-4 py-2 rounded-lg transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)'
                }}
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{ 
                backgroundColor: 'var(--surface)',
                color: 'var(--muted)',
                border: '1px solid var(--border)'
              }}
            >
              <span 
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#22c55e' }}
              />
              Now scanning 50+ bookmakers
            </div>

            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6"
              style={{ color: 'var(--foreground)' }}
            >
              Find guaranteed profits
              <br />
              <span style={{ color: 'var(--muted)' }}>across bookmakers</span>
            </h1>
            
            <p 
              className="text-lg mb-8 max-w-xl mx-auto leading-relaxed"
              style={{ color: 'var(--muted)' }}
            >
              The most affordable arbitrage scanner on the market. 
              Scan 4 regions in real-time and lock in risk-free returns.
            </p>

            {/* Profit Counter Highlight */}
            <div 
              className="inline-flex items-center gap-3 px-5 py-3 rounded-xl mb-8"
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

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-90 hover:gap-3"
                style={{ 
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)'
                }}
              >
                Get started for $4.99
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#pricing"
                className="px-6 py-3 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--surface)]"
                style={{ 
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                View pricing
              </Link>
            </div>

            <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
              First month just $4.99 • Cancel anytime
            </p>
          </div>

          {/* Product Preview */}
          <div 
            className="relative rounded-xl border overflow-hidden"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
          >
            {/* Browser Header */}
            <div 
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
              </div>
              <div 
                className="flex-1 mx-4 px-3 py-1 rounded text-xs text-center"
                style={{ 
                  backgroundColor: 'var(--background)',
                  color: 'var(--muted)'
                }}
              >
                edgemaxxer.com/dashboard
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="p-6">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Live Arbs', value: '23', highlight: true },
                  { label: 'Best Profit', value: '5.2%' },
                  { label: 'Events', value: '142' },
                  { label: 'Bookmakers', value: '47' },
                ].map((stat, i) => (
                  <div 
                    key={i}
                    className="p-4 rounded-lg border"
                    style={{ 
                      backgroundColor: 'var(--background)',
                      borderColor: stat.highlight ? '#22c55e' : 'var(--border)'
                    }}
                  >
                    <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
                      {stat.label}
                    </div>
                    <div 
                      className="text-2xl font-semibold font-mono"
                      style={{ color: stat.highlight ? '#22c55e' : 'var(--foreground)' }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample Table */}
              <div 
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: 'var(--border)' }}
              >
                <div 
                  className="grid grid-cols-4 gap-4 px-4 py-3 text-xs font-medium border-b"
                  style={{ 
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--muted)'
                  }}
                >
                  <div>Event</div>
                  <div>Bookmakers</div>
                  <div>Sport</div>
                  <div className="text-right">Profit</div>
                </div>
                {[
                  { event: 'Lakers vs Celtics', books: 'Sportsbet • TAB', sport: 'NBA', profit: '+5.2%' },
                  { event: 'Man City vs Arsenal', books: 'Bet365 • Ladbrokes', sport: 'EPL', profit: '+3.8%' },
                  { event: 'Djokovic vs Alcaraz', books: 'Unibet • Pointsbet', sport: 'Tennis', profit: '+2.9%' },
                ].map((row, i) => (
                  <div 
                    key={i}
                    className="grid grid-cols-4 gap-4 px-4 py-3 text-sm border-b last:border-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div style={{ color: 'var(--foreground)' }}>{row.event}</div>
                    <div style={{ color: 'var(--muted)' }}>{row.books}</div>
                    <div style={{ color: 'var(--muted)' }}>{row.sport}</div>
                    <div className="text-right font-mono font-medium" style={{ color: '#22c55e' }}>
                      {row.profit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-6 border-y" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '1,200+', label: 'Active users' },
              { value: '50+', label: 'Bookmakers' },
              { value: '4', label: 'Regions' },
              { value: '$9.99', label: 'Per month' },
            ].map((stat, i) => (
              <div key={i}>
                <div 
                  className="text-2xl font-semibold mb-1"
                  style={{ color: 'var(--foreground)' }}
                >
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 
              className="text-3xl font-semibold mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              Everything you need to profit
            </h2>
            <p style={{ color: 'var(--muted)' }}>
              Professional-grade tools at a fraction of the cost
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Real-time scanning',
                description: 'Scan 50+ bookmakers simultaneously. Get instant alerts when new opportunities appear.'
              },
              {
                icon: Globe,
                title: 'Multi-region support',
                description: 'Access AU, UK, US, and EU markets from a single dashboard.'
              },
              {
                icon: Shield,
                title: 'Stealth mode',
                description: 'Randomize stakes to avoid detection. Stay profitable longer.'
              },
              {
                icon: Calculator,
                title: 'Smart calculator',
                description: 'Calculate optimal stake distribution instantly for maximum profit.'
              },
              {
                icon: TrendingUp,
                title: 'Spreads & totals',
                description: 'Not just head-to-head. Find arbs in spreads, totals, and alternative lines.'
              },
              {
                icon: BarChart3,
                title: 'Account tracking',
                description: 'Monitor your bankroll and track account health across bookmakers.'
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className="p-6 rounded-xl border transition-all hover:border-[var(--muted)]"
                style={{ 
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)'
                }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--background)' }}
                >
                  <feature.icon className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
                </div>
                <h3 
                  className="font-medium mb-2"
                  style={{ color: 'var(--foreground)' }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl font-semibold mb-4"
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
                borderColor: '#22c55e'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium" style={{ color: '#22c55e' }}>
                  Edge Maxxer
                </div>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#22c55e', color: '#000' }}
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
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h2 
              className="text-3xl font-semibold mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              Simple pricing
            </h2>
            <p style={{ color: 'var(--muted)' }}>
              One plan. All features. No hidden fees.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-8">
            <div 
              className="inline-flex items-center p-1 rounded-lg"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              <button
                onClick={() => setBillingCycle('monthly')}
                className="px-4 py-2 text-sm rounded-md transition-all"
                style={{
                  backgroundColor: billingCycle === 'monthly' ? 'var(--background)' : 'transparent',
                  color: billingCycle === 'monthly' ? 'var(--foreground)' : 'var(--muted)',
                  boxShadow: billingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className="px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2"
                style={{
                  backgroundColor: billingCycle === 'yearly' ? 'var(--background)' : 'transparent',
                  color: billingCycle === 'yearly' ? 'var(--foreground)' : 'var(--muted)',
                  boxShadow: billingCycle === 'yearly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Yearly
                <span 
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: '#22c55e', color: '#000' }}
                >
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Price Card */}
          <div 
            className="rounded-xl border overflow-hidden"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span 
                    className="text-5xl font-semibold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    ${billingCycle === 'monthly' ? '9.99' : '99'}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                {billingCycle === 'monthly' && (
                  <p className="text-lg font-medium" style={{ color: '#22c55e' }}>
                    First month just $4.99
                  </p>
                )}
                {billingCycle === 'yearly' && (
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    $8.25/month
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'All 4 regions (AU, UK, US, EU)',
                  'Real-time arbitrage scanning',
                  'Spreads, totals & middles',
                  'Stealth mode',
                  'Bet tracking & history',
                  'Account health monitoring',
                  'Unlimited scans',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-4 h-4 shrink-0" style={{ color: '#22c55e' }} />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/signup"
                className="block w-full py-3 rounded-lg text-sm font-medium text-center transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)'
                }}
              >
                {billingCycle === 'monthly' ? 'Start for $4.99' : 'Get started'}
              </Link>
            </div>
            
            <div 
              className="px-8 py-4 text-center text-sm border-t"
              style={{ 
                borderColor: 'var(--border)',
                color: 'var(--muted)'
              }}
            >
              Cancel anytime • Instant access
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl font-semibold mb-4"
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
                a: 'We scan 50+ bookmakers across Australia, UK, US, and EU including Sportsbet, TAB, Bet365, Ladbrokes, DraftKings, FanDuel, and many more.'
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
            className="text-3xl font-semibold mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            Ready to find your edge?
          </h2>
          <p className="mb-8" style={{ color: 'var(--muted)' }}>
            Start scanning for arbitrage opportunities today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-90 hover:gap-3"
            style={{ 
              backgroundColor: 'var(--foreground)',
              color: 'var(--background)'
            }}
          >
            Get started for $4.99
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-12 px-6 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {theme === 'dark' ? (
              <Image
                src="/logo_thin_dark_version.png"
                alt="Edge Maxxer"
                width={100}
                height={24}
                className="h-5 w-auto opacity-50"
              />
            ) : (
              <Image
                src="/logo_thin_light_version.png"
                alt="Edge Maxxer"
                width={100}
                height={24}
                className="h-5 w-auto opacity-50"
              />
            )}
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
    </div>
  );
}