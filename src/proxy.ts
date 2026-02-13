// src/proxy.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow unauthenticated access to /dashboard for freemium preview
        if (pathname === '/dashboard' || pathname.startsWith('/dashboard')) {
          return true;
        }

        // All other matched routes require authentication
        return !!token;
      },
    },
  }
);

// Protected routes — /dashboard is listed here so the proxy still runs on it
// (e.g. for future logic), but the authorized callback above allows it through
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/arbs/:path*',
    '/api/lines/:path*',
  ],
};
