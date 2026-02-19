// src/app/alternatives/oddsjam/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'OddsJam Alternative (AU/UK/US) | Edge Maxxer',
  description:
    'Looking for an OddsJam alternative? Compare arb scanners by workflow, speed, pricing, and practical constraints like limits, settlement rules, and execution.',
  alternates: {
    canonical: `${baseUrl}/alternatives/oddsjam`,
  },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/alternatives/oddsjam`,
    title: 'OddsJam Alternative (AU/UK/US) | Edge Maxxer',
    description:
      'Compare arb scanners by workflow, speed, pricing, and real-world execution constraints (limits, rules, voids).',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OddsJam Alternative (AU/UK/US) | Edge Maxxer',
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

export default function OddsJamAlternativePage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: 'Alternatives', item: `${baseUrl}/learn` },
      { '@type': 'ListItem', position: 4, name: 'OddsJam Alternative', item: `${baseUrl}/alternatives/oddsjam` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What should I look for in an OddsJam alternative?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Focus on workflow (speed + usability), bookmaker coverage for your region, market rules clarity, and whether the tool helps you execute quickly under real constraints like limits and line movement.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do scanners work the same in Australia vs the US?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Execution differs by region due to bookmaker limits, market availability, and settlement rules. A good scanner is useful anywhere, but your results depend on the books you can access and how fast you can place both sides.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is “sure bet” scanning risk-free?',
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
          OddsJam alternative: what to compare (and what actually matters)
        </h1>

        <p className="text-base sm:text-lg leading-7" style={{ color: 'var(--foreground-secondary)' }}>
          People searching “<strong>OddsJam alternative</strong>” are usually trying to find an arb scanner that’s faster,
          more affordable, or better suited to their region (Australia/UK/US/EU). This page focuses on real execution,
          not marketing hype.
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
        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            A smart comparison framework
          </h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Speed & workflow',
                text: 'How quickly you can spot and place both sides matters more than fancy features.',
              },
              {
                title: 'Region coverage',
                text: 'Are the sportsbooks you can actually use included (AU/UK/US/EU)?',
              },
              {
                title: 'Market clarity',
                text: 'Does the tool help you avoid mismatched settlement rules or market definitions?',
              },
              {
                title: 'Execution constraints',
                text: 'How does it handle limits, partial acceptance, and fast-moving lines?',
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
            The common “gotchas” scanners can’t solve for you
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            <li>• Limits and partial acceptance can leave you exposed if you can’t match stakes.</li>
            <li>• Different settlement rules (overtime, pushes, each-way terms) can break the “math”.</li>
            <li>• Voids/cancellations can create unexpected exposure if one side is voided.</li>
            <li>• Restrictions can happen if your betting behavior looks highly systematic.</li>
          </ul>
          <p className="mt-3 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            Scanners are still valuable — they just don’t replace good execution.
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
              href="/alternatives/rebelbetting"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              RebelBetting alternative
            </Link>
            <Link
              href="/australia/arbitrage-betting"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              Australia arbitrage betting
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
