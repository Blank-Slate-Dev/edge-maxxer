// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.edgemaxxer.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/learn', '/learn/', '/guides/', '/alternatives/', '/australia/', '/sports/'],
        disallow: [
          // API
          '/api/',

          // Auth / private utility pages (should not be indexed)
          '/dashboard',
          '/dashboard/',
          '/settings',
          '/settings/',
          '/login',
          '/login/',
          '/signup',
          '/signup/',
          '/forgot-password',
          '/forgot-password/',

          // Admin/private placeholders
          '/admin/',
          '/private/',

          // Next internals
          '/_next/',

          // Best-effort parameter blocking (prevents crawling URL variants)
          '/*?*',
          '/*&*',
        ],
      },
      {
        // Block aggressive SEO crawlers (keeps your infra calm)
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot'],
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
