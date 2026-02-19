// src/app/sports/afl/arbitrage/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'AFL Arbitrage Betting (Sure Bets) | Edge Maxxer',
  description:
    'AFL arbitrage betting: what to watch for in market rules, timing, and execution. Practical notes for using an arb scanner on AFL markets.',
  alternates: {
    canonical: `${baseUrl}/sports/afl/arbitrage`,
  },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/sports/afl/arbitrage`,
    title: 'AFL Arbitrage Betting (Sure Bets) | Edge Maxxer',
    description:
      'Practical AFL arbitrage notes: market rules, timing, and execution constraints that matter when using a sure bet scanner.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AFL Arbitrage Betting (Sure Bets) | Edge Maxxer',
    description:
      'Practical AFL arbitrage notes: market rules, timing, and execution constraints that matter when using a sure bet scanner.',
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

export default function AflArbitragePage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: 'Sports', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 4, name: 'AFL Arbitrage', item: `${baseUrl}/sports/afl/arbitrage` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What AFL markets are easiest to execute for arbitrage?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'More liquid and clearly defined markets are usually easier to execute than niche props. The exact markets vary by bookmaker, but the general principle is: higher liquidity + clearer rules = fewer surprises.',
        },
      },
      {
        '@type': 'Question',
        name: 'What’s the biggest AFL arbitrage risk?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Mismatch in market definitions and settlement rules, plus rapid line movement close to bounce or team news. Always confirm rules and place both sides quickly.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need an arb scanner for AFL?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'You can arb manually, but scanners help by monitoring odds and surfacing mismatches quickly. They improve workflow but don’t remove risks like limits, voids, or rule differences.',
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
            Sport: AFL
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
          AFL arbitrage betting (sure bets): practical notes
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          This page is for people searching <strong>AFL arbitrage betting</strong> or <strong>AFL sure bets</strong>.
          The fundamentals are the same — but AFL can move quickly around team news and market open.
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
        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            AFL execution tips that matter
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            <li>• Always rule-check market definitions (especially anything niche).</li>
            <li>• Expect faster movement close to bounce and around late team changes.</li>
            <li>• Prefer clearer, more liquid markets when you’re starting.</li>
            <li>• Track where slippage happens so you can adjust your workflow.</li>
          </ul>
        </section>

        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            How scanners fit into AFL arbing
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            A scanner helps you spot mismatches faster. The edge comes from execution: placing both sides quickly,
            handling limits, and avoiding rule mismatches.
          </p>
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
