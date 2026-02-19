// src/app/eu/arbitrage-betting/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'Arbitrage Betting EU (Sure Bets) | Edge Maxxer',
  description:
    'Arbitrage betting in the EU: what to know about sure bets, execution constraints, and how an arb scanner supports a practical workflow across bookmakers.',
  alternates: { canonical: `${baseUrl}/eu/arbitrage-betting` },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/eu/arbitrage-betting`,
    title: 'Arbitrage Betting EU (Sure Bets) | Edge Maxxer',
    description:
      'EU-focused guide to arbitrage betting (sure bets): execution realities, settlement rules, and how scanners fit into a practical workflow.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arbitrage Betting EU (Sure Bets) | Edge Maxxer',
    description:
      'EU-focused guide to arbitrage betting (sure bets): execution realities, settlement rules, and how scanners fit into a practical workflow.',
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

export default function EuArbitrageBettingPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: 'EU', item: `${baseUrl}/eu/arbitrage-betting` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is arbitrage betting legal across the EU?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Regulations vary by country. Always follow your local laws and each bookmaker’s terms. Operators may restrict accounts based on betting behavior.',
        },
      },
      {
        '@type': 'Question',
        name: 'What’s the biggest execution issue in the EU?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Limits, settlement rule differences, and market definition mismatches are common. A practical approach focuses on clear markets and disciplined execution.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need a scanner to arb bet in the EU?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'No, but scanners can save time by monitoring odds and surfacing discrepancies quickly. They help workflow but don’t remove risks like voids, limits, or settlement differences.',
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
            Region: EU
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Arbitrage betting in the EU (sure bets): what matters
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          EU-focused context for <strong>arbitrage betting</strong> and <strong>sure bet scanning</strong>. Regulations,
          availability, and settlement rules vary by country — execution is everything.
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
            EU execution notes
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            <li>• Regulations vary by country — verify your local rules.</li>
            <li>• Bookmaker settlement and market definitions can differ.</li>
            <li>• Focus on consistent, executable opportunities rather than tiny margins.</li>
            <li>• Track outcomes so you learn which market types are stable for you.</li>
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
              href="/sports/epl/arbitrage"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              EPL arbitrage
            </Link>
            <Link
              href="/alternatives/betburger"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              BetBurger alternative
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
