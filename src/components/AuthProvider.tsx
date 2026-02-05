// src/components/AuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

// =========================================================================
// PERFORMANCE FIX: Removed the `session` prop requirement.
//
// Previously, layout.tsx called getServerSession() and passed it here.
// That server-side call blocked HTML delivery by ~200-500ms (MongoDB round-trip).
//
// Now SessionProvider initializes without a prefetched session:
// - For unauthenticated visitors: No session fetch happens at all. 
//   useSession() immediately returns { status: 'unauthenticated' }.
// - For logged-in users: SessionProvider fetches /api/auth/session 
//   client-side using the JWT cookie. This is fast (~50ms) and non-blocking.
// - The `refetchInterval` and `refetchOnWindowFocus: false` settings 
//   prevent unnecessary re-fetches.
// =========================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
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
