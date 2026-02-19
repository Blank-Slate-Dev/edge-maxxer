// src/app/alternatives/betburger/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'BetBurger Alternative (Arb Scanner) | Edge Maxxer',
  description:
    'Looking for a BetBurger alternative? Compare arb scanners by workflow, speed, pricing, and real-world execution constraints like limits, voids, and settlement rules.',
  alternates: { canonical: `${baseUrl}/alternatives/betburger` },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/alternatives/betburger`,
    title: 'BetBurger Alternative (Arb Scanner) | Edge Maxxer',
    description:
      'Compare arb scanners by workflow, speed, pricing, and real-world execution constraints (limits, rules, voids).',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BetBurger Alternative (Arb Scanner) | Edge Maxxer',
    description:
      'Compare arb scanners by workflow, speed, pricing, and real-world execution constraints (limits, rules, voids).',
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

export default function BetBurgerAlternativePage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: 'Alternatives', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 4, name: 'BetBurger Alternative', item: `${baseUrl}/alternatives/betburger` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What should I look for in a BetBurger alternative?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Prioritize workflow speed, bookmaker coverage in your region, clarity of market definitions, and whether the tool helps you execute quickly under real constraints like limits and line movement.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do scanners guarantee profit?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'No. Scanners help you find pricing discrepancies faster, but real-world results depend on execution speed, limits, settlement rules, voids, and account restrictions.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are “sure bets” risk-free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'No. Arbitrage can reduce variance, but risks include voids, limits, line movement, and settlement differences. Always bet responsibly and verify rules before placing.',
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
          BetBurger alternative: what to compare (and what actually matters)
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          People searching “<strong>BetBurger alternative</strong>” usually want a scanner that’s faster, more
          affordable, or better suited to their region. Focus on execution and workflow — that’s where results come from.
        </p>

        <div
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--surface))',
          }}
        >
          <p className="text-sm leading-6" style={{ color: 'var(--foreground)' }}>
            <strong>Responsible gambling:</strong> Betting involves risk. Arbitrage can reduce variance, but it does not
            remove risks like limits, voids, and line movement. Always follow your local laws and bookmaker terms.
          </p>
        </div>
      </header>

      <article className="mt-10 space-y-6">
        <section className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            A smart comparison framework
          </h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Speed & workflow', text: 'How quickly you can spot and place both sides matters most.' },
              { title: 'Region coverage', text: 'Are the bookmakers you can actually use included?' },
              { title: 'Market clarity', text: 'Does the tool help you avoid rule and definition mismatches?' },
              { title: 'Execution constraints', text: 'How does it handle limits, partial acceptance, and line moves?' },
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
                If your goal is a clean workflow for finding sure bets, create an account.
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
