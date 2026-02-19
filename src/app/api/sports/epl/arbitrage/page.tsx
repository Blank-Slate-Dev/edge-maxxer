// src/app/sports/epl/arbitrage/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'EPL Arbitrage Betting (Sure Bets) | Edge Maxxer',
  description:
    'EPL arbitrage betting: practical notes on market rules, timing, and execution. Learn how to use an arb scanner for EPL sure bet opportunities responsibly.',
  alternates: { canonical: `${baseUrl}/sports/epl/arbitrage` },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/sports/epl/arbitrage`,
    title: 'EPL Arbitrage Betting (Sure Bets) | Edge Maxxer',
    description:
      'Practical EPL arbitrage notes: market rules, timing, and execution constraints that matter when using a sure bet scanner.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EPL Arbitrage Betting (Sure Bets) | Edge Maxxer',
    description:
      'Practical EPL arbitrage notes: market rules, timing, and execution constraints that matter when using a sure bet scanner.',
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

export default function EplArbitragePage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: 'Sports', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 4, name: 'EPL Arbitrage', item: `${baseUrl}/sports/epl/arbitrage` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What makes EPL arbitrage tricky?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Soccer markets can vary in definitions (e.g., draw-no-bet vs double chance) and settlement rules. Always rule-check and prioritize clear markets.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are soccer props good for arbitrage?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Props can offer opportunities but often have more nuance and faster movement. Many arbers focus on clearer core markets first.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does a scanner guarantee “sure bets”?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'No. Scanners help you find discrepancies faster, but risks remain: limits, line movement, voids, and market definition differences.',
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
            Sport: EPL
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
          EPL arbitrage betting (sure bets): practical notes
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          For searches like <strong>EPL arbitrage betting</strong> or <strong>EPL sure bets</strong>. Soccer markets can
          differ by definition across books — rule clarity matters.
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
            EPL execution tips that matter
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            <li>• Confirm market definitions (e.g., DNB vs DC vs 3-way).</li>
            <li>• Be careful with props and niche markets (more settlement nuance).</li>
            <li>• Prefer clearer, more liquid markets when you’re starting.</li>
            <li>• Track slippage and mismatches so you learn what’s consistently executable.</li>
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
              href="/alternatives/betburger"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              BetBurger alternative
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
