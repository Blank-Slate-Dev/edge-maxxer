// src/components/AuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider 
      // Only refetch session every 5 minutes instead of on every focus
      refetchInterval={5 * 60}
      // Don't refetch when window regains focus
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
