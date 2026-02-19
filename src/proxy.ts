// src/proxy.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isAuthOrPrivatePath(pathname: string): boolean {
  const privatePrefixes = ['/dashboard', '/settings', '/login', '/signup', '/forgot-password'];
  return privatePrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/');
}

function shouldNoIndex(req: NextRequest): boolean {
  const pathname = req.nextUrl.pathname;
  const hasQueryParams = Array.from(req.nextUrl.searchParams.keys()).length > 0;

  // Noindex:
  // - Any parameter variants (?utm=..., ?checkout=success, etc.)
  // - Private/auth pages
  // - API routes
  return hasQueryParams || isAuthOrPrivatePath(pathname) || isApiPath(pathname);
}

export default withAuth(
  function proxy(req: NextRequest) {
    const res = NextResponse.next();

    // SEO protection: prevent indexing of thin/private pages + parameter variants
    if (shouldNoIndex(req)) {
      // Use "follow" so Google can still flow equity through links.
      res.headers.set('X-Robots-Tag', 'noindex, follow');
    }

    return res;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // ✅ Public access: /dashboard is freemium preview
        if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
          return true;
        }

        // ✅ Public marketing + SEO pages (allow without auth)
        // Everything NOT explicitly protected below is treated as public.
        // (We still run the proxy so the noindex header can apply to parameter URLs.)
        const protectedPrefixes = ['/settings', '/api/arbs', '/api/lines'];

        const isProtected = protectedPrefixes.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`)
        );

        // 🔒 Protected routes require authentication
        if (isProtected) {
          return !!token;
        }

        // ✅ All other matched routes are public
        return true;
      },
    },
  }
);

// Run proxy broadly so we can apply parameter noindex site-wide,
// while keeping auth rules in the authorized() callback above.
//
// Excludes Next internals + common static assets for performance.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js|txt|xml|map)$).*)',
  ],
};
