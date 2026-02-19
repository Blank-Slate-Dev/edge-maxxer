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

const SITE_URL = 'https://www.edgemaxxer.com';

// Comprehensive metadata for SEO
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    template: '%s | Edge Maxxer',
    default: 'Edge Maxxer — Sports Arbitrage Scanner & Sure Bet Finder',
  },

  description:
    'Edge Maxxer is a sports arbitrage scanner and sure bet finder that monitors 80+ sportsbooks across AU, UK, US and EU. Find opportunities faster, track bets, and manage execution risks like limits and voids.',

  // Meta keywords are largely ignored by Google; keep minimal to avoid looking spammy.
  keywords: [
    'sports arbitrage scanner',
    'arbitrage betting',
    'sure bet finder',
    'arb scanner',
    'OddsJam alternative',
    'RebelBetting alternative',
  ],

  authors: [{ name: 'Edge Maxxer' }],
  creator: 'Edge Maxxer',
  publisher: 'Edge Maxxer',

  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: SITE_URL,
    siteName: 'Edge Maxxer',
    title: 'Edge Maxxer — Sports Arbitrage Scanner & Sure Bet Finder',
    description:
      'Find sports arbitrage opportunities across 80+ sportsbooks. Real-time scanning for AU, UK, US & EU markets with execution-focused tools.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Edge Maxxer — Sports Arbitrage Scanner',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Edge Maxxer — Sports Arbitrage Scanner',
    description: 'Find sure bets across 80+ sportsbooks. Real-time scanning across AU, UK, US & EU.',
    images: ['/twitter-image.png'],
    creator: '@edgemaxxer',
  },

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

  // IMPORTANT: Replace with your real code when you add Search Console
  verification: {
    google: 'your-google-site-verification-code',
  },

  applicationName: 'Edge Maxxer',
  category: 'Sports Betting Tools',

  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
  },
};

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

// Organization Schema
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Edge Maxxer',
  url: SITE_URL,
  logo: `${SITE_URL}/logo_dark_version.png`,
  description: 'Sports arbitrage betting platform providing real-time odds comparison across 80+ sportsbooks.',
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

// WebSite Schema (no SearchAction — you don’t have a public search page)
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Edge Maxxer',
  url: SITE_URL,
  description: 'Sports arbitrage scanner and sure bet finder for AU, UK, US and EU markets.',
};

// SoftwareApplication Schema
const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Edge Maxxer Arbitrage Scanner',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  description:
    'Real-time sports arbitrage betting opportunity finder scanning 80+ sportsbooks across AU, UK, US and EU. Affordable alternative to many enterprise scanners.',
  url: SITE_URL,
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '2.99',
    highPrice: '99',
    priceCurrency: 'AUD',
    offerCount: 3,
    offers: [
      { '@type': 'Offer', name: '3-Day Trial', price: '2.99', priceCurrency: 'AUD' },
      { '@type': 'Offer', name: 'Monthly Subscription', price: '9.99', priceCurrency: 'AUD' },
      { '@type': 'Offer', name: 'Yearly Subscription', price: '99', priceCurrency: 'AUD' },
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
