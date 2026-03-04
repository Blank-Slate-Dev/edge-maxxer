// src/app/tools/arbitrage-calculator/page.tsx
//
// PUBLIC page — no auth required.
// Targets: "arbitrage betting calculator", "arb calculator", "sure bet calculator"
// This is a linkable tool asset for backlink building.

import type { Metadata } from 'next';
import { ArbCalculatorClient } from './ArbCalculatorClient';

const baseUrl = 'https://www.edgemaxxer.com';

export const metadata: Metadata = {
  title: 'Arbitrage Betting Calculator — Free Sure Bet Calculator',
  description:
    'Free arbitrage betting calculator. Enter odds from two or three bookmakers and instantly get optimal stake sizes, guaranteed profit, and ROI. Works for 2-way and 3-way markets.',
  alternates: {
    canonical: `${baseUrl}/tools/arbitrage-calculator`,
  },
  keywords: [
    'arbitrage betting calculator',
    'arb calculator',
    'sure bet calculator',
    'sports arbitrage calculator',
    'betting arbitrage calculator',
    'arb staking calculator',
    'free arb calculator',
  ],
  openGraph: {
    type: 'website',
    url: `${baseUrl}/tools/arbitrage-calculator`,
    title: 'Arbitrage Betting Calculator — Free Sure Bet Calculator',
    description:
      'Free arbitrage calculator: enter odds from two or three bookmakers and get optimal stakes, guaranteed profit, and ROI instantly.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Edge Maxxer Arbitrage Betting Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Arbitrage Betting Calculator | Edge Maxxer',
    description:
      'Enter odds from any two or three bookmakers — instantly get optimal stakes and guaranteed profit.',
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

export default function ArbCalculatorPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${baseUrl}/tools` },
      { '@type': 'ListItem', position: 3, name: 'Arbitrage Calculator', item: `${baseUrl}/tools/arbitrage-calculator` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is an arbitrage betting calculator?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'An arbitrage betting calculator helps you find the optimal stake for each side of an arbitrage (sure bet) opportunity. You enter the decimal odds from each bookmaker, your total stake, and the calculator tells you exactly how much to bet on each outcome to lock in a guaranteed profit regardless of the result.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I use this arb calculator?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Enter the decimal odds for each outcome from their respective bookmakers, then enter your total stake. The calculator will instantly show you the optimal stake for each bet, your guaranteed profit in dollars, and the return on investment (ROI) as a percentage.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is a "sure bet"?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A sure bet (or arb) occurs when different bookmakers offer high enough odds on all outcomes of an event that you can bet on all of them and guarantee a profit regardless of which outcome wins. The implied probabilities across all bets sum to less than 100%.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does this calculator work for 3-way markets like football?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Toggle to "3-Way Market" mode for sports like soccer (football), boxing with draws, or any event with three possible outcomes (Win / Draw / Loss). The calculator distributes your stake optimally across all three bets.',
        },
      },
      {
        '@type': 'Question',
        name: 'What decimal odds format does the calculator use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'This calculator uses decimal odds (e.g. 2.10, 1.95), which is the standard format in Australia, Europe and most international sportsbooks. If your bookmaker shows fractional (e.g. 11/10) or American odds (e.g. +110), you can convert them: decimal = (fractional numerator / denominator) + 1, or for American positive odds: decimal = (American odds / 100) + 1.',
        },
      },
    ],
  };

  const softwareToolLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Arbitrage Betting Calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'AUD',
    },
    description:
      'Free sports arbitrage calculator. Calculate optimal stakes for 2-way and 3-way sure bet opportunities across any bookmakers.',
    url: `${baseUrl}/tools/arbitrage-calculator`,
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
      <ArbCalculatorClient />
    </>
  );
}