import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add custom logic here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect these routes - user must be logged in
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/arbs/:path*',
    '/api/lines/:path*',
  ],
};
