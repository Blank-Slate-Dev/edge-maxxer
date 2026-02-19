// src/app/alternatives/rebelbetting/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'RebelBetting Alternative (Sure Bet Scanner) | Edge Maxxer',
  description:
    'Looking for a RebelBetting alternative? Compare arb scanners by workflow, speed, pricing, and the real-world constraints that affect sure bets.',
  alternates: {
    canonical: `${baseUrl}/alternatives/rebelbetting`,
  },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/alternatives/rebelbetting`,
    title: 'RebelBetting Alternative (Sure Bet Scanner) | Edge Maxxer',
    description:
      'Compare sure bet scanners by workflow, speed, pricing, and execution constraints like limits, voids, and settlement rules.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RebelBetting Alternative (Sure Bet Scanner) | Edge Maxxer',
    description:
      'Compare sure bet scanners by workflow, speed, pricing, and execution constraints like limits, voids, and settlement rules.',
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

export default function RebelBettingAlternativePage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: 'Alternatives', item: `${baseUrl}/learn` },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'RebelBetting Alternative',
        item: `${baseUrl}/alternatives/rebelbetting`,
      },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What matters most when choosing a sure bet scanner?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Speed, clarity, and coverage. In practice, the scanner should make it easy to act fast and avoid common mismatches (rules/markets) while supporting the sportsbooks you can use.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can a scanner help reduce bookmaker restrictions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'A scanner can improve workflow, but restrictions are driven by betting behavior and operator policies. Always follow terms and manage exposure responsibly.',
        },
      },
      {
        '@type': 'Question',
        name: 'Should I prioritize more opportunities or easier execution?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Easier execution usually wins. A smaller number of clearer, executable opportunities can outperform a larger list you can’t act on fast enough.',
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
            Alternatives
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
          RebelBetting alternative: how to evaluate scanners properly
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          If you’re searching “<strong>RebelBetting alternative</strong>”, you likely want a scanner that fits your
          workflow and budget — and that helps you act quickly when the odds change.
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
            remove risks like voids, limits, and line movement. Always follow local laws and bookmaker terms.
          </p>
        </div>
      </header>

      <article className="mt-10 space-y-6">
        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            What to compare (beyond “features”)
          </h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Opportunity quality',
                text: 'Are the opportunities actually executable with realistic stakes and timing?',
              },
              {
                title: 'UI clarity',
                text: 'Can you understand the bet quickly without hunting for key details?',
              },
              {
                title: 'Speed',
                text: 'How fast do opportunities surface relative to line movement?',
              },
              {
                title: 'Your region/books',
                text: 'Coverage matters only if it includes books you can use.',
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-xl border p-4"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-secondary)' }}
              >
                <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {c.title}
                </h3>
                <p className="mt-1 text-sm leading-6" style={{ color: 'var(--muted)' }}>
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Real-world constraints to plan around
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            These factors matter more than the scanner brand:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            <li>• Limits and stake caps (sometimes dynamic and inconsistent).</li>
            <li>• Market definition differences (especially props and niche markets).</li>
            <li>• Fast line movement in lower-liquidity events.</li>
            <li>• Voids/cancellations and resettlements.</li>
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
              href="/alternatives/oddsjam"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              OddsJam alternative
            </Link>
            <Link
              href="/sports/afl/arbitrage"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              AFL arbitrage
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
                Build your workflow around speed and clarity — then track execution results.
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
