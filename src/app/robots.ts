// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.edgemaxxer.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/dashboard/'],
        disallow: [
          // Protected API routes
          '/api/',
          // Authenticated-only pages
          '/settings/',
          // Private/admin routes
          '/admin/',
          '/private/',
        ],
      },
      {
        // Block bad bots specifically
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot'],
        disallow: ['/'],
      },
    ],
    
    // Point to your sitemap
    sitemap: `${baseUrl}/sitemap.xml`,
    
    // Specify the canonical host
    host: baseUrl,
  };
}
