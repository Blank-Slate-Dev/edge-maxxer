// src/app/sports/nfl/arbitrage/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'NFL Arbitrage Betting (Sure Bets) | Edge Maxxer',
  description:
    'NFL arbitrage betting: practical notes on market rules, timing, and execution. Learn how to use an arb scanner for NFL sure bet opportunities responsibly.',
  alternates: { canonical: `${baseUrl}/sports/nfl/arbitrage` },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/sports/nfl/arbitrage`,
    title: 'NFL Arbitrage Betting (Sure Bets) | Edge Maxxer',
    description:
      'Practical NFL arbitrage notes: market rules, timing, and execution constraints that matter when using a sure bet scanner.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Arbitrage Betting (Sure Bets) | Edge Maxxer',
    description:
      'Practical NFL arbitrage notes: market rules, timing, and execution constraints that matter when using a sure bet scanner.',
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

export default function NflArbitragePage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: 'Sports', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 4, name: 'NFL Arbitrage', item: `${baseUrl}/sports/nfl/arbitrage` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What makes NFL arbitrage different?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'NFL lines can move quickly around injuries, weather, and late-breaking news. Execution speed and consistent rule-checking help reduce mismatches.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are props good for NFL arbitrage?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Props can offer opportunities but often involve more rule nuance and faster movement. Many arbers start with core markets before expanding into props.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does a sure bet scanner remove risk?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'No. Scanners help you find discrepancies faster, but risks remain: limits, line movement, voids, and settlement differences.',
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
            Sport: NFL
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
          NFL arbitrage betting (sure bets): practical notes
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          For searches like <strong>NFL arbitrage betting</strong> or <strong>NFL sure bets</strong>. Expect line
          movement around injuries, weather, and late news — execution speed matters.
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
            NFL execution tips that matter
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            <li>• Monitor injury and weather news — lines can swing sharply.</li>
            <li>• Rule-check props carefully; settlement differences can be subtle.</li>
            <li>• Start with clearer, more liquid markets while you learn execution.</li>
            <li>• Track slippage so you learn which markets are consistently executable.</li>
          </ul>
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
              href="/sports/nba/arbitrage"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              NBA arbitrage
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
