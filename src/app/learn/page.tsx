// src/app/learn/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'Learn Sports Arbitrage & Sure Bets',
  description:
    'Guides and comparisons to help you understand sports arbitrage (sure bets), arb scanners, and how to use them responsibly.',
  alternates: {
    canonical: `${baseUrl}/learn`,
  },
  openGraph: {
    type: 'website',
    url: `${baseUrl}/learn`,
    title: 'Learn Sports Arbitrage & Sure Bets',
    description:
      'Guides and comparisons to help you understand sports arbitrage (sure bets), arb scanners, and how to use them responsibly.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learn Sports Arbitrage & Sure Bets',
    description:
      'Guides and comparisons to help you understand sports arbitrage (sure bets), arb scanners, and how to use them responsibly.',
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

export default function LearnPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <JsonLd data={breadcrumbLd} />

      <header className="space-y-4">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)', backgroundColor: 'var(--surface)' }}
        >
          Edge Maxxer Learn Hub
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Learn sports arbitrage (sure bets)
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          Content for people searching for <strong>arbitrage betting</strong>, a <strong>sure bet finder</strong>, or an{' '}
          <strong>arb scanner</strong>. Practical, no fluff.
        </p>

        <div
          className="rounded-2xl border p-4 sm:p-5"
          style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--surface))' }}
        >
          <p className="text-sm leading-6" style={{ color: 'var(--foreground)' }}>
            <strong>Responsible gambling:</strong> Sports betting involves risk. Arbitrage can reduce variance, but it
            does not remove risk. Only bet what you can afford to lose and follow your local laws and bookmaker terms.
          </p>
        </div>
      </header>

      <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Start here
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            Understand what arbitrage betting is, why it works, and where people get caught out.
          </p>
          <Link
            href="/guides/arbitrage-betting"
            className="mt-4 inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Read the guide
          </Link>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Comparisons
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            High-intent pages for people comparing scanners.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/alternatives/oddsjam"
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              OddsJam alternative
            </Link>
            <Link
              href="/alternatives/rebelbetting"
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              RebelBetting alternative
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Region intent
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            Location-specific guidance and context.
          </p>
          <div className="mt-4">
            <Link
              href="/australia/arbitrage-betting"
              className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              Australia arbitrage betting
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Sport intent
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            Sport-specific notes (markets, rules, timing).
          </p>
          <div className="mt-4">
            <Link
              href="/sports/afl/arbitrage"
              className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              AFL arbitrage
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Ready to use the scanner?
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              Create an account and explore the dashboard.
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
    </main>
  );
}
