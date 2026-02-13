// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthProvider from '@/components/AuthProvider';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

// Optimized font loading with display swap to prevent layout shift
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
});

// Comprehensive metadata for SEO
export const metadata: Metadata = {
  metadataBase: new URL('https://www.edgemaxxer.com'),

  // Title configuration with template
  title: {
    template: '%s | Edge Maxxer - Sports Arbitrage Scanner',
    default: 'Edge Maxxer - #1 Affordable Sports Arbitrage Scanner | OddsJam & RebelBetting Alternative',
  },

  // Primary description targeting key search terms + competitor keywords
  description: 'The most affordable sports betting arbitrage scanner. Find guaranteed profit sure bets across 80+ sportsbooks for just $9.99/mo — 33x cheaper than OddsJam or RebelBetting. Real-time arb scanning for AFL, NRL, NBA, NFL & more. Try free today.',

  // Keywords targeting competitors and high-intent search terms
  keywords: [
    // Core product terms
    'arbitrage betting',
    'sports arbitrage',
    'sure bet finder',
    'arb scanner',
    'surebet calculator',
    'sports betting arbitrage',
    'betting arbitrage software',
    // Competitor alternatives
    'oddsjam alternative',
    'rebelbetting alternative',
    'betburger alternative',
    'oddsjam cheaper',
    'cheap arb scanner',
    'affordable arbitrage software',
    'best arbitrage betting software',
    // Regional terms
    'arbitrage betting Australia',
    'matched betting Australia',
    'odds comparison Australia',
    'Sportsbet arbitrage',
    'TAB arbitrage',
    'Bet365 arbitrage',
    'AFL arbitrage betting',
    'NRL arbitrage betting',
    // Action terms
    'guaranteed betting profits',
    'risk free betting',
    'how to arb bet',
    'sports betting tools',
    'positive EV betting',
    'middle betting',
    'spread arbitrage',
  ],

  // Author and creator information
  authors: [{ name: 'Edge Maxxer' }],
  creator: 'Edge Maxxer',
  publisher: 'Edge Maxxer',

  // Canonical URL handling
  alternates: {
    canonical: '/',
  },

  // Open Graph metadata for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://www.edgemaxxer.com',
    siteName: 'Edge Maxxer',
    title: 'Edge Maxxer - Cheapest Sports Arbitrage Scanner | $9.99/mo',
    description: 'Find guaranteed profit arbitrage opportunities across 80+ sportsbooks. 33x cheaper than OddsJam. Real-time scanning for AFL, NRL, NBA, NFL, EPL & more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Edge Maxxer - Sports Arbitrage Betting Platform showing live arb opportunities',
        type: 'image/png',
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: 'Edge Maxxer - Sports Arbitrage Scanner | $9.99/mo',
    description: 'Find sure bets across 80+ sportsbooks. 33x cheaper than competitors. Try free today.',
    images: ['/twitter-image.png'],
    creator: '@edgemaxxer',
  },

  // Robot directives
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification codes (add your actual codes)
  verification: {
    google: 'your-google-site-verification-code', // Replace with actual code from Google Search Console
  },

  // App-specific metadata
  applicationName: 'Edge Maxxer',
  category: 'Sports Betting Tools',

  // Additional metadata
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
  },
};

// Viewport configuration with viewport-fit=cover for iOS safe areas
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0efeb' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1a' },
  ],
};

// Inline script to prevent flash of wrong theme
// This runs before React hydrates, applying the correct theme immediately
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('edge-maxxer-theme');
      if (theme === 'light') {
        document.documentElement.classList.add('light');
      }
    } catch (e) {}
  })();
`;

// Organization Schema for brand recognition
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Edge Maxxer',
  url: 'https://www.edgemaxxer.com',
  logo: 'https://www.edgemaxxer.com/logo_dark_version.png',
  description: 'Australian sports arbitrage betting platform providing real-time odds comparison across 80+ sportsbooks',
  foundingDate: '2024',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'AU',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@edgemaxxer.com',
    contactType: 'customer support',
  },
  sameAs: [],
};

// WebSite Schema for sitelinks search box potential
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Edge Maxxer',
  url: 'https://www.edgemaxxer.com',
  description: 'Sports arbitrage betting scanner for Australian and international markets',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.edgemaxxer.com/dashboard?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

// SoftwareApplication Schema for rich results
const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Edge Maxxer Arbitrage Scanner',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  description: 'Real-time sports arbitrage betting opportunity finder scanning 80+ Australian and international sportsbooks. The most affordable OddsJam and RebelBetting alternative at just $9.99/month.',
  url: 'https://www.edgemaxxer.com',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '2.99',
    highPrice: '99',
    priceCurrency: 'AUD',
    offerCount: 3,
    offers: [
      {
        '@type': 'Offer',
        name: '3-Day Trial',
        price: '2.99',
        priceCurrency: 'AUD',
        description: 'Try all features risk-free for 3 days',
      },
      {
        '@type': 'Offer',
        name: 'Monthly Subscription',
        price: '9.99',
        priceCurrency: 'AUD',
        description: 'Full access with monthly billing — 33x cheaper than OddsJam',
      },
      {
        '@type': 'Offer',
        name: 'Yearly Subscription',
        price: '99',
        priceCurrency: 'AUD',
        description: 'Best value - save 17% with annual billing',
      },
    ],
  },
  featureList: [
    'Real-time odds scanning across 80+ sportsbooks',
    'Australian, UK, US, and EU market coverage',
    'Arbitrage opportunity alerts',
    'Spread and totals arbitrage detection',
    'Middle opportunity finder',
    'Built-in stake calculator',
    'Stealth mode for account longevity',
    'Bet tracking and history',
    'Account health monitoring',
    'Positive EV betting alerts',
    'Free dashboard preview — no sign-up required',
  ],
};

// FAQ Schema for rich results
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is sports arbitrage betting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Arbitrage betting exploits odds differences between bookmakers to guarantee profit regardless of outcome. When bookmakers disagree on odds, you can bet both sides and lock in a profit. Edge Maxxer scans 80+ sportsbooks to find these opportunities automatically.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much can I realistically make from arbitrage betting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Returns depend on your bankroll and activity. With a $1,000 bankroll, users typically see 3-5% monthly returns from arbitrage opportunities. Edge Maxxer finds opportunities with 5-7% profit margins on average.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Edge Maxxer cheaper than OddsJam or RebelBetting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Edge Maxxer costs just $9.99/month compared to $150-350/month for OddsJam, RebelBetting, or BetBurger. That is up to 33x cheaper with the same core features: real-time arb scanning, stake calculators, and multi-region support across 80+ sportsbooks.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is arbitrage betting legal in Australia?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, arbitrage betting is completely legal in Australia. It involves placing bets on all possible outcomes across different licensed bookmakers to guarantee a profit regardless of the result. While legal, some bookmakers may limit accounts that consistently profit from arbitrage.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which bookmakers does Edge Maxxer support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Edge Maxxer scans 80+ bookmakers across Australia, UK, US, and EU including Sportsbet, TAB, Bet365, Ladbrokes, Neds, PointsBet, DraftKings, FanDuel, and many more.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I try Edge Maxxer for free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! You can preview live arbitrage data on our dashboard without signing up — team names and bookmakers are blurred but profit percentages are visible. You can also sign up for a free 10-minute trial with full access, or purchase a 3-day trial for $2.99.',
      },
    },
    {
      '@type': 'Question',
      name: 'Will I get limited by bookmakers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All profitable bettors face limiting eventually. Edge Maxxer includes a stealth mode feature that helps you stay under the radar longer by randomizing stakes and suggesting distribution strategies to extend your account longevity.',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />

        {/* Theme script to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              organizationSchema,
              websiteSchema,
              softwareSchema,
              faqSchema,
            ]).replace(/</g, '\\u003c'),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased overflow-x-hidden`}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>

        {/* Vercel Web Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
