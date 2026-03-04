// src/app/tools/odds-converter/page.tsx
//
// PUBLIC page — no auth required.
// Targets: "odds converter", "decimal to American odds", "fractional to decimal odds",
//          "betting odds converter", "moneyline to decimal", "implied probability calculator"

import type { Metadata } from 'next';
import { OddsConverterClient } from './OddsConverterClient';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'Betting Odds Converter — Decimal, Fractional & American',
  description:
    'Free betting odds converter. Instantly convert between decimal, fractional (UK), American (moneyline), Hong Kong, and implied probability. Works for AU, UK, US and EU sportsbooks.',
  alternates: {
    canonical: `${baseUrl}/tools/odds-converter`,
  },
  keywords: [
    'odds converter',
    'betting odds converter',
    'decimal to American odds',
    'fractional to decimal odds',
    'moneyline to decimal',
    'implied probability calculator',
    'odds format converter',
    'decimal odds converter',
    'American odds to decimal',
  ],
  openGraph: {
    type: 'website',
    url: `${baseUrl}/tools/odds-converter`,
    title: 'Betting Odds Converter — Decimal, Fractional & American',
    description:
      'Convert betting odds between decimal, fractional, American moneyline, Hong Kong, and implied probability — instantly and free.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Edge Maxxer Betting Odds Converter',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Betting Odds Converter | Edge Maxxer',
    description:
      'Convert decimal, fractional, American, and Hong Kong odds to any format — including implied probability.',
    images: ['/og-image.png'],
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

export default function OddsConverterPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${baseUrl}/tools` },
      { '@type': 'ListItem', position: 3, name: 'Odds Converter', item: `${baseUrl}/tools/odds-converter` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I convert decimal odds to American (moneyline) odds?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For decimal odds of 2.0 or higher: American odds = (decimal − 1) × 100. For example, 2.50 decimal = +150 American. For decimal odds below 2.0: American odds = −100 ÷ (decimal − 1). For example, 1.50 decimal = −200 American.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I convert fractional odds to decimal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Decimal odds = (numerator ÷ denominator) + 1. For example, 5/2 fractional = (5 ÷ 2) + 1 = 3.50 decimal. Or 11/10 fractional = (11 ÷ 10) + 1 = 2.10 decimal.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is implied probability in betting?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Implied probability is the bookmaker\'s estimated chance of an outcome occurring, expressed as a percentage. It\'s calculated from odds: implied probability = 1 ÷ decimal odds × 100. For example, decimal odds of 2.50 imply a 40% probability. Bookmakers add a margin (overround) so probabilities across all outcomes sum to more than 100%.',
        },
      },
      {
        '@type': 'Question',
        name: 'What are Hong Kong odds?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hong Kong odds show the profit per unit staked, excluding the stake itself. They\'re essentially decimal odds minus 1. So decimal odds of 2.50 = HK odds of 1.50. They\'re common in Asian sportsbooks and are equivalent to the "net return" format.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which odds format do Australian bookmakers use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Australian bookmakers (Sportsbet, Ladbrokes, Neds, TAB, Bet365 AU, Unibet AU, PointsBet) all display decimal odds. Decimal odds are also standard across Europe. American odds (moneyline) are primarily used by US sportsbooks. Fractional odds are most common in the UK and Ireland.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is the bookmaker margin (overround) calculated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bookmaker margin = (sum of all implied probabilities − 1) × 100%. For a two-outcome market with odds of 1.90 / 1.90, the implied probabilities are 52.6% + 52.6% = 105.3%, giving a margin of 5.3%. This is the bookmaker\'s built-in edge.',
        },
      },
    ],
  };

  const softwareToolLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Betting Odds Converter',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'AUD',
    },
    description:
      'Free betting odds converter. Convert between decimal, fractional, American (moneyline), Hong Kong odds and implied probability.',
    url: `${baseUrl}/tools/odds-converter`,
    provider: {
      '@type': 'Organization',
      name: 'Edge Maxxer',
      url: baseUrl,
    },
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={faqLd} />
      <JsonLd data={softwareToolLd} />
      <OddsConverterClient />
    </>
  );
}