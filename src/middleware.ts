// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isPrivateOrApiPath(pathname: string): boolean {
  // API routes should never be indexed
  if (pathname === '/api' || pathname.startsWith('/api/')) return true;

  // Private/auth routes should never be indexed
  const privatePrefixes = ['/dashboard', '/login', '/signup', '/settings', '/forgot-password'];
  return privatePrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const hasQueryParams = Array.from(req.nextUrl.searchParams.keys()).length > 0;

  // Noindex:
  // - Any query parameter variants (?utm=, ?checkout=success, etc.)
  // - Private/auth routes
  // - API routes
  if (hasQueryParams || isPrivateOrApiPath(pathname)) {
    const res = NextResponse.next();
    // Use "follow" so Google can still discover and pass equity through links.
    res.headers.set('X-Robots-Tag', 'noindex, follow');
    return res;
  }

  return NextResponse.next();
}

// Apply middleware to all routes except Next internals + common static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js|txt|xml|map)$).*)',
  ],
};
