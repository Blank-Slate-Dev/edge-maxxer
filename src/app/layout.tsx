// src/app/layout.tsx
import type { Metadata } from 'next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthProvider from '@/components/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Edge Maxxer - Sports Arbitrage Scanner',
  description: 'Find guaranteed profit opportunities across bookmakers. The most affordable arb scanner on the market.',
  keywords: ['arbitrage', 'sports betting', 'arb scanner', 'sure bets', 'matched betting'],
  openGraph: {
    title: 'Edge Maxxer - Sports Arbitrage Scanner',
    description: 'Find guaranteed profit opportunities across bookmakers.',
    url: 'https://edgemaxxer.com',
    siteName: 'Edge Maxxer',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
