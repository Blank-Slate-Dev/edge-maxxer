// src/app/tools/page.tsx
//
// Public tools hub page. Targets "arbitrage betting tools", "arb calculator",
// "betting odds converter", "free betting tools" etc.
// Links to all free tools — each earns its own indexed URL + backlink equity.

import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, ArrowLeftRight } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'Free Betting Tools — Arbitrage Calculator & Odds Converter',
  description:
    'Free sports betting tools: arbitrage calculator and odds converter. Calculate guaranteed profit for sure bets, convert between decimal, fractional, American and implied probability. No signup required.',
  alternates: {
    canonical: `${baseUrl}/tools`,
  },
  openGraph: {
    type: 'website',
    url: `${baseUrl}/tools`,
    title: 'Free Betting Tools — Arbitrage Calculator & Odds Converter',
    description:
      'Free sports betting tools from Edge Maxxer: arbitrage (sure bet) calculator and odds format converter.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Betting Tools | Edge Maxxer',
    description:
      'Arbitrage calculator and odds converter — free, no signup needed.',
  },
};

function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const TOOLS = [
  {
    icon: Calculator,
    title: 'Arbitrage Betting Calculator',
    description:
      'Enter decimal odds from two or three bookmakers and instantly get optimal stake sizes, guaranteed profit, and ROI. Supports 2-way and 3-way markets.',
    href: '/tools/arbitrage-calculator',
    badge: 'Most popular',
    detail: 'Works for all sports · 2-way & 3-way markets · Copy-paste output',
  },
  {
    icon: ArrowLeftRight,
    title: 'Betting Odds Converter',
    description:
      'Convert between decimal (AU/EU), fractional (UK), American (moneyline), Hong Kong odds and implied probability. Includes a reference table of common odds.',
    href: '/tools/odds-converter',
    badge: 'Free',
    detail: 'Decimal · Fractional · American · HK · Implied %',
  },
];

export default function ToolsPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${baseUrl}/tools` },
    ],
  };

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free Arbitrage Betting Tools',
    description: 'Free sports betting calculators and converters from Edge Maxxer.',
    url: `${baseUrl}/tools`,
    hasPart: TOOLS.map((t) => ({
      '@type': 'SoftwareApplication',
      name: t.title,
      url: `${baseUrl}${t.href}`,
      applicationCategory: 'FinanceApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'AUD' },
    })),
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={collectionLd} />
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <PublicNav />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs mb-6" style={{ color: 'var(--muted)' }}>
            <Link href="/" className="hover:opacity-70">Home</Link>
            <span>/</span>
            <span style={{ color: 'var(--foreground)' }}>Tools</span>
          </nav>

          <header className="mb-8 space-y-3">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Free betting tools
            </h1>
            <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
              Free calculators and converters for{' '}
              <strong>arbitrage betting</strong> and{' '}
              <strong>odds format conversion</strong>. No account needed — just open and use.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-4">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group rounded-2xl border p-5 sm:p-6 transition-all hover:border-[var(--primary)] flex flex-col gap-4"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors group-hover:bg-[var(--primary-alpha-15)]"
                      style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--primary)' }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                          {tool.title}
                        </h2>
                        {tool.badge && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: 'var(--primary-alpha-15)',
                              color: 'var(--primary)',
                            }}
                          >
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-6" style={{ color: 'var(--muted)' }}>
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs px-2 py-1 rounded-lg font-mono"
                      style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--muted)' }}
                    >
                      {tool.detail}
                    </span>
                    <span
                      className="text-sm font-medium transition-opacity group-hover:opacity-70"
                      style={{ color: 'var(--primary)' }}
                    >
                      Open →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Internal links */}
          <div
            className="mt-10 rounded-2xl border p-5 sm:p-6"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>
              More resources
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Arbitrage betting guide', href: '/guides/arbitrage-betting' },
                { label: 'Learn hub', href: '/learn' },
                { label: 'Free live scanner', href: '/dashboard' },
                { label: 'Australia arbitrage', href: '/australia/arbitrage-betting' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:border-[var(--primary)]"
                  style={{ borderColor: 'var(--border-light)', color: 'var(--muted)', backgroundColor: 'var(--surface-hover)' }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}