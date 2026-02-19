// src/app/guides/arbitrage-betting/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'Arbitrage Betting Guide (Sure Bets) + Scanner Tips',
  description:
    'A practical guide to arbitrage betting (sure bets): how it works, common pitfalls, bankroll basics, and how an arb scanner helps you act faster—without hype.',
  alternates: {
    canonical: `${baseUrl}/guides/arbitrage-betting`,
  },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/guides/arbitrage-betting`,
    title: 'Arbitrage Betting Guide (Sure Bets) + Scanner Tips',
    description:
      'Learn how sports arbitrage (sure bets) works, where it breaks in real life, and how scanners help you find opportunities faster.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arbitrage Betting Guide (Sure Bets) + Scanner Tips',
    description:
      'Learn how sports arbitrage (sure bets) works, where it breaks in real life, and how scanners help you find opportunities faster.',
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

export default function ArbitrageBettingGuidePage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: 'Arbitrage Betting', item: `${baseUrl}/guides/arbitrage-betting` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is arbitrage betting (a “sure bet”)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Arbitrage betting is placing bets on all outcomes at different bookmakers using prices that create a theoretical margin. In practice, execution speed, limits, voids, and rule differences can affect outcomes.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is arbitrage betting legal in Australia / the UK / the US?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Rules vary by jurisdiction and operator. Always follow local laws and each bookmaker’s terms. Tools may be legal to use while specific betting behavior can be restricted by operators.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do arb scanners guarantee profit?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'No. Scanners help you find pricing discrepancies faster, but real-world results depend on speed, limits, settlement rules, voids, and account restrictions.',
        },
      },
      {
        '@type': 'Question',
        name: 'What’s the biggest risk with sure bets?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'The biggest risks are line movement before both sides are placed, mismatched settlement rules, partial limits, voids/cancellations, and operator restrictions.',
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
            Guide
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Arbitrage betting (sure bets): a practical guide
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          If you’re searching for <strong>arbitrage betting</strong>, a <strong>sure bet finder</strong>, or an{' '}
          <strong>arb scanner</strong>, the key is understanding what works in theory vs what fails in practice.
        </p>

        <div
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--surface))',
          }}
        >
          <p className="text-sm leading-6" style={{ color: 'var(--foreground)' }}>
            <strong>Responsible gambling:</strong> Sports betting involves risk. Arbitrage can reduce variance, but it
            does not remove risk. Bookmaker limits, voids, and settlement rules can impact outcomes. Only bet what you
            can afford to lose.
          </p>
        </div>
      </header>

      <article className="mt-10 space-y-8">
        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            What arbitrage betting is (in plain English)
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            Arbitrage betting is placing bets across different bookmakers so that all outcomes are covered at prices
            that create a theoretical edge. It’s not “free money” — it’s a workflow where timing and rules matter.
          </p>
        </section>

        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Why “sure bets” aren’t always sure
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6">
            {[
              {
                title: 'Line movement',
                text: 'Odds can move between placing side A and side B.',
              },
              {
                title: 'Limits / partial acceptance',
                text: 'Your intended stake may be reduced, leaving you exposed.',
              },
              {
                title: 'Settlement rule differences',
                text: 'Overtime, push rules, each-way terms, and market definitions can differ.',
              },
              {
                title: 'Voids & cancellations',
                text: 'One side voids while the other stands (or is resettled).',
              },
              {
                title: 'Restrictions',
                text: 'Some operators limit or close accounts that show arbing patterns.',
              },
            ].map((i) => (
              <li key={i.title} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--muted)' }} />
                <span style={{ color: 'var(--muted)' }}>
                  <strong style={{ color: 'var(--foreground)' }}>{i.title}:</strong> {i.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            What an arb scanner helps with
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            Scanners are mainly <strong>speed + workflow</strong>. They monitor odds, surface mismatches, and reduce
            manual tab-hopping. Your edge still depends on execution and risk control.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
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

        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            A simple execution checklist
          </h2>
          <ol className="mt-3 space-y-2 text-sm leading-6 list-decimal pl-5" style={{ color: 'var(--muted)' }}>
            <li>Prefer higher-liquidity markets when you’re starting (less slippage).</li>
            <li>Confirm settlement rules for the sport/market on both books.</li>
            <li>Place the more “fragile” side first (the side more likely to move/limit).</li>
            <li>Track every bet (time, market, odds, stake, book) so you can see where problems happen.</li>
            <li>Don’t chase tiny margins if your placement speed is slow.</li>
          </ol>
        </section>

        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                Want the scanner?
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                If your goal is faster discovery + smoother workflow, create an account and explore the dashboard.
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
