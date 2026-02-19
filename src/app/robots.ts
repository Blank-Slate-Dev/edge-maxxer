// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.edgemaxxer.com';

  return {
    rules: [
      {
        userAgent: '*',
        // IMPORTANT:
        // We do NOT disallow /dashboard, /login, etc.
        // Because disallow can prevent Google from seeing noindex directives.
        // We rely on page-level noindex (metadata) + middleware X-Robots-Tag instead.
        disallow: [
          // API should not be crawled
          '/api/',

          // Admin/private placeholders (if these are real and should remain hidden)
          '/admin/',
          '/private/',
        ],
      },
      {
        // Block aggressive SEO crawlers (keeps infra calm)
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot'],
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: 'www.edgemaxxer.com',
  };
}
