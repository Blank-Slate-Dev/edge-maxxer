// src/components/AuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
  session: Session | null;
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider 
      session={session}
      // Only refetch session every 5 minutes instead of on every focus
      refetchInterval={5 * 60}
      // Don't refetch when window regains focus
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
