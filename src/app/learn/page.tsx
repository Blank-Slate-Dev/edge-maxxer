// src/app/learn/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'Learn Arbitrage Betting & Sure Bets | Edge Maxxer',
  description:
    'Guides, tools, regional pages, and comparisons to help you understand arbitrage betting, sure bet scanners, and execution constraints (limits, voids, settlement rules).',
  alternates: { canonical: `${baseUrl}/learn` },
  openGraph: {
    type: 'website',
    url: `${baseUrl}/learn`,
    title: 'Learn Arbitrage Betting & Sure Bets | Edge Maxxer',
    description:
      'Guides, tools, regional pages, and comparisons to help you understand arbitrage betting and sure bet scanning.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learn Arbitrage Betting & Sure Bets | Edge Maxxer',
    description:
      'Guides, tools, regional pages, and comparisons to help you understand arbitrage betting and sure bet scanning.',
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

type Card = {
  title: string;
  description: string;
  href: string;
  badge?: string;
};

export default function LearnPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
    ],
  };

  const guides: Card[] = [
    {
      title: 'Arbitrage betting guide',
      description: 'The fundamentals of sure bets, how scanners work, and execution realities.',
      href: '/guides/arbitrage-betting',
      badge: 'Start here',
    },
  ];

  const tools: Card[] = [
    {
      title: 'Arbitrage betting calculator',
      description: 'Enter odds from two or three bookmakers and instantly get optimal stakes, guaranteed profit, and ROI.',
      href: '/tools/arbitrage-calculator',
      badge: 'Free tool',
    },
    {
      title: 'Odds converter',
      description: 'Convert between decimal, fractional, American, and implied probability formats.',
      href: '/tools/odds-converter',
      badge: 'Free tool',
    },
  ];

  const alternatives: Card[] = [
    {
      title: 'OddsJam alternative',
      description: 'Compare scanners by workflow, speed, and real execution constraints.',
      href: '/alternatives/oddsjam',
    },
    {
      title: 'RebelBetting alternative',
      description: 'What to compare (features, coverage, and practical usability).',
      href: '/alternatives/rebelbetting',
    },
    {
      title: 'BetBurger alternative',
      description: 'A structured way to evaluate alternatives without keyword stuffing.',
      href: '/alternatives/betburger',
    },
  ];

  const regions: Card[] = [
    {
      title: 'Australia arbitrage betting',
      description: 'Regional context, practical considerations, and common execution issues.',
      href: '/australia/arbitrage-betting',
      badge: 'High intent',
    },
    {
      title: 'UK arbitrage betting',
      description: 'UK-focused notes on limits, rules, and execution.',
      href: '/uk/arbitrage-betting',
    },
    {
      title: 'US arbitrage betting',
      description: 'US-focused notes with state + operator realities.',
      href: '/us/arbitrage-betting',
    },
    {
      title: 'EU arbitrage betting',
      description: 'EU market notes covering major operators and regulations.',
      href: '/eu/arbitrage-betting',
    },
  ];

  const sports: Card[] = [
    {
      title: 'AFL arbitrage',
      description: 'AFL market notes: timing, rules, and execution constraints.',
      href: '/sports/afl/arbitrage',
    },
    {
      title: 'NRL arbitrage',
      description: 'NRL market notes for arb bettors.',
      href: '/sports/nrl/arbitrage',
    },
    {
      title: 'NBA arbitrage',
      description: 'NBA market notes and execution realities.',
      href: '/sports/nba/arbitrage',
    },
    {
      title: 'NFL arbitrage',
      description: 'NFL market notes for international arbers.',
      href: '/sports/nfl/arbitrage',
    },
    {
      title: 'EPL arbitrage',
      description: 'English Premier League 3-way and 2-way arb notes.',
      href: '/sports/epl/arbitrage',
    },
  ];

  function Section({ title, items }: { title: string; items: Card[] }) {
    return (
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
          {title}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border p-4 transition-all hover:border-[var(--primary)] flex flex-col gap-2"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium leading-5" style={{ color: 'var(--foreground)' }}>
                  {c.title}
                </h3>
                {c.badge ? (
                  <div
                    className="shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted)', backgroundColor: 'var(--surface)' }}
                  >
                    {c.badge}
                  </div>
                ) : null}
              </div>
              <p className="text-xs leading-5" style={{ color: 'var(--muted)' }}>
                {c.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        <JsonLd data={breadcrumbLd} />

        <header className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Learn arbitrage betting & sure bets
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          Helpful, practical pages for high-intent topics like <strong>arbitrage betting</strong>,{' '}
          <strong>sure bet finder</strong>, and <strong>arb scanners</strong> — without spammy keyword stuffing.
        </p>

        <div
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--surface))',
          }}
        >
          <p className="text-sm leading-6" style={{ color: 'var(--foreground)' }}>
            <strong>Responsible gambling:</strong> Betting involves risk. Arbitrage can reduce variance but cannot remove
            risks like limits, voids, and settlement differences. Follow local laws and bookmaker terms.
          </p>
        </div>
      </header>

      <div className="mt-8 sm:mt-10 space-y-8">
        <Section title="Guides" items={guides} />
        <Section title="Free tools" items={tools} />
        <Section title="Alternatives (comparisons)" items={alternatives} />
        <Section title="Regional pages" items={regions} />
        <Section title="Sport pages" items={sports} />
      </div>

      <section
        className="mt-8 sm:mt-10 rounded-2xl border p-6"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Want the scanner?
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              Create an account to access the dashboard.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
          >
            Try free dashboard →
          </Link>
        </div>
      </section>
      </main>
    </div>
  );
}
