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
  description:
    'The most affordable sports betting arbitrage scanner. Find guaranteed profit sure bets across 80+ sportsbooks for just $9.99/mo — 33x cheaper than OddsJam or RebelBetting. Real-time arb scanning for AFL, NRL, NBA, NFL & more. Try free today.',

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

  // Open Graph metadata for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://www.edgemaxxer.com',
    siteName: 'Edge Maxxer',
    title: 'Edge Maxxer - Cheapest Sports Arbitrage Scanner | $9.99/mo',
    description:
      'Find guaranteed profit arbitrage opportunities across 80+ sportsbooks. 33x cheaper than OddsJam. Real-time scanning for AFL, NRL, NBA, NFL, EPL & more.',
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
  description:
    'Australian sports arbitrage betting platform providing real-time odds comparison across 80+ sportsbooks',
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
  description:
    'Real-time sports arbitrage betting opportunity finder scanning 80+ Australian and international sportsbooks. The most affordable OddsJam and RebelBetting alternative at just $9.99/month.',
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
      },
      {
        '@type': 'Offer',
        name: 'Monthly Subscription',
        price: '9.99',
        priceCurrency: 'AUD',
      },
      {
        '@type': 'Offer',
        name: 'Yearly Subscription',
        price: '99',
        priceCurrency: 'AUD',
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
