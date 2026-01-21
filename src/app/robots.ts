// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.edgemaxxer.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Protected/authenticated routes
          '/api/',
          '/dashboard/',
          '/settings/',
          
          // Auth-related pages (optional - you may want these indexed)
          // '/login/',
          // '/signup/',
          // '/forgot-password/',
          
          // Private/admin routes
          '/admin/',
          '/private/',
          
          // Prevent crawling of query parameters that create duplicate content
          '/*?*', // Block all URLs with query parameters (optional, aggressive)
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
