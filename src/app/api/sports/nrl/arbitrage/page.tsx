// src/app/sports/nrl/arbitrage/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'NRL Arbitrage Betting (Sure Bets) | Edge Maxxer',
  description:
    'NRL arbitrage betting: practical notes on market rules, timing, and execution. Learn how to use an arb scanner for NRL sure bet opportunities responsibly.',
  alternates: { canonical: `${baseUrl}/sports/nrl/arbitrage` },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/sports/nrl/arbitrage`,
    title: 'NRL Arbitrage Betting (Sure Bets) | Edge Maxxer',
    description:
      'Practical NRL arbitrage notes: market rules, timing, and execution constraints that matter when using a sure bet scanner.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NRL Arbitrage Betting (Sure Bets) | Edge Maxxer',
    description:
      'Practical NRL arbitrage notes: market rules, timing, and execution constraints that matter when using a sure bet scanner.',
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

export default function NrlArbitragePage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: 'Sports', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 4, name: 'NRL Arbitrage', item: `${baseUrl}/sports/nrl/arbitrage` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What NRL markets are easiest to execute for arbitrage?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'More liquid, clearly defined markets are usually easiest to execute. The exact markets vary by bookmaker, but the principle is: clearer rules + higher liquidity = fewer surprises.',
        },
      },
      {
        '@type': 'Question',
        name: 'What’s the biggest NRL arbitrage risk?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Mismatch in market definitions and settlement rules, plus rapid line movement close to kick-off or team news. Always confirm rules and place both sides quickly.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need an arb scanner for NRL?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'You can arb manually, but scanners help by monitoring odds and surfacing discrepancies quickly. They improve workflow but don’t remove risks like limits, voids, or rule differences.',
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
            Sport: NRL
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
          NRL arbitrage betting (sure bets): practical notes
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          For searches like <strong>NRL arbitrage betting</strong> or <strong>NRL sure bets</strong>. The fundamentals
          are the same — but rugby league can move quickly around team changes, weather, and late market shifts.
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
            remove risks like limits, voids, and settlement differences. Follow local laws and bookmaker terms.
          </p>
        </div>
      </header>

      <article className="mt-10 space-y-6">
        <section className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            NRL execution tips that matter
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            <li>• Rule-check market definitions, especially totals/handicaps across books.</li>
            <li>• Expect movement close to kick-off and after late team news.</li>
            <li>• Start with clearer, more liquid markets while you learn execution.</li>
            <li>• Track where slippage happens (books, time windows, sports).</li>
          </ul>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
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
              href="/australia/arbitrage-betting"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              Australia arbitrage betting
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

        <section className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                Try Edge Maxxer
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                Create an account and use the dashboard scanner to explore opportunities.
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
