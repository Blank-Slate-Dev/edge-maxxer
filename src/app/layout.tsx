// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthProvider from '@/components/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Edge Maxxer - Scanner 💵',
  description: 'Find guaranteed profit opportunities across bookmakers. The most affordable arb scanner on the market.',
  keywords: ['arbitrage', 'sports betting', 'arb scanner', 'sure bets', 'matched betting'],
  openGraph: {
    title: 'Edge Maxxer - Scanner 💵',
    description: 'Find guaranteed profit opportunities across bookmakers.',
    url: 'https://edgemaxxer.com',
    siteName: 'Edge Maxxer',
    type: 'website',
  },
};

// Viewport configuration with viewport-fit=cover for iOS safe areas
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="antialiased overflow-x-hidden">
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
