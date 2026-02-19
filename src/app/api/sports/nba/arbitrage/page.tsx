// src/app/sports/nba/arbitrage/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'NBA Arbitrage Betting (Sure Bets) | Edge Maxxer',
  description:
    'NBA arbitrage betting: practical notes on market rules, timing, and execution. Learn how to use an arb scanner for NBA sure bet opportunities responsibly.',
  alternates: { canonical: `${baseUrl}/sports/nba/arbitrage` },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/sports/nba/arbitrage`,
    title: 'NBA Arbitrage Betting (Sure Bets) | Edge Maxxer',
    description:
      'Practical NBA arbitrage notes: market rules, timing, and execution constraints that matter when using a sure bet scanner.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NBA Arbitrage Betting (Sure Bets) | Edge Maxxer',
    description:
      'Practical NBA arbitrage notes: market rules, timing, and execution constraints that matter when using a sure bet scanner.',
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

export default function NbaArbitragePage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: 'Sports', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 4, name: 'NBA Arbitrage', item: `${baseUrl}/sports/nba/arbitrage` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What makes NBA arbitrage different?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'NBA markets can move rapidly around injury news and lineup announcements. Execution speed and rule clarity (especially for props) matter a lot.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are NBA player props good for arbitrage?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Props can offer opportunities but often have more rule/settlement nuance and faster movement. Many arbers start with clearer core markets before expanding to props.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do scanners guarantee sure profits?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'No. Scanners help you find pricing discrepancies faster, but results depend on limits, line movement, settlement rules, and avoiding mismatches.',
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
            Sport: NBA
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
          NBA arbitrage betting (sure bets): practical notes
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          For searches like <strong>NBA arbitrage betting</strong> or <strong>NBA sure bets</strong>. NBA lines can move
          quickly around injuries and starting lineups — execution speed matters.
        </p>

        <div
          className="rounded-2xl border p-4 sm:p-5"
          style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--surface))' }}
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
            NBA execution tips that matter
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            <li>• Pay attention to injury news and lineup announcements (lines can jump fast).</li>
            <li>• Rule-check props — settlement differences can be subtle.</li>
            <li>• Prefer core markets while you learn (then expand carefully).</li>
            <li>• Track slippage so you know when “opportunities” aren’t executable.</li>
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
              href="/alternatives/oddsjam"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              OddsJam alternative
            </Link>
            <Link
              href="/alternatives/rebelbetting"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              RebelBetting alternative
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
