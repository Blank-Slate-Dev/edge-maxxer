// src/app/australia/arbitrage-betting/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'Arbitrage Betting Australia (Sure Bets) | Edge Maxxer',
  description:
    'Arbitrage betting in Australia: what to know about sure bets, execution constraints, market rules, and how an arb scanner helps you find opportunities faster.',
  alternates: {
    canonical: `${baseUrl}/australia/arbitrage-betting`,
  },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/australia/arbitrage-betting`,
    title: 'Arbitrage Betting Australia (Sure Bets) | Edge Maxxer',
    description:
      'Australia-focused guide to arbitrage betting (sure bets): execution realities, settlement rules, and how scanners fit into a practical workflow.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arbitrage Betting Australia (Sure Bets) | Edge Maxxer',
    description:
      'Australia-focused guide to arbitrage betting (sure bets): execution realities, settlement rules, and how scanners fit into a practical workflow.',
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

export default function AustraliaArbitrageBettingPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: 'Australia', item: `${baseUrl}/australia/arbitrage-betting` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is arbitrage betting allowed in Australia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Rules and enforcement vary. You should follow Australian laws in your state/territory and each bookmaker’s terms. Operators may limit accounts based on betting behavior.',
        },
      },
      {
        '@type': 'Question',
        name: 'What’s the biggest execution issue in Australia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Limits and fast line movement are common execution challenges. The best results usually come from disciplined staking, rule checks, and focusing on more liquid markets.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need a scanner to arb bet?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'No, but scanners can save time by monitoring odds and surfacing discrepancies quickly. They help workflow, but they don’t remove real-world risks like voids, limits, or settlement differences.',
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={faqLd} />

      <header className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium hover:opacity-90 transition-opacity"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)', backgroundColor: 'var(--surface)' }}
          >
            ← Back to Learn
          </Link>

          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)', backgroundColor: 'var(--surface)' }}
          >
            Region: Australia
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Arbitrage betting in Australia (sure bets): what matters
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          This page is for Australian intent searches like <strong>arbitrage betting Australia</strong> or{' '}
          <strong>sure bet finder Australia</strong>. The basics are universal — but execution is shaped by rules, limits,
          and market conditions.
        </p>

        <div
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--surface))',
          }}
        >
          <p className="text-sm leading-6" style={{ color: 'var(--foreground)' }}>
            <strong>Responsible gambling:</strong> Betting involves risk. Arbitrage can reduce variance but cannot
            remove risks like limits, voids, and rule differences. Follow local laws and bookmaker terms.
          </p>
        </div>
      </header>

      <article className="mt-10 space-y-6">
        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Australia-specific execution notes
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            <li>• Expect varying limits and faster price changes around team news and market open.</li>
            <li>• Confirm settlement rules, especially for niche markets and player props.</li>
            <li>• Track where slippage happens (which books, which sports, which time windows).</li>
            <li>• Focus on consistency rather than chasing tiny margins you can’t execute reliably.</li>
          </ul>
        </section>

        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            A clean workflow (that scales)
          </h2>
          <ol className="mt-3 space-y-2 text-sm leading-6 list-decimal pl-5" style={{ color: 'var(--muted)' }}>
            <li>Use a scanner to surface candidates quickly.</li>
            <li>Rule-check the market definition before staking big.</li>
            <li>Place the more fragile side first (the one likely to move or limit).</li>
            <li>Record outcomes so you learn which markets are stable.</li>
          </ol>
        </section>

        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Related pages
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/guides/arbitrage-betting"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              Arbitrage betting guide
            </Link>
            <Link
              href="/sports/afl/arbitrage"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              AFL arbitrage
            </Link>
            <Link
              href="/alternatives/oddsjam"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              OddsJam alternative
            </Link>
          </div>
        </section>

        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                Try Edge Maxxer
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                Create an account to access the scanner dashboard.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
            >
              Sign up
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
