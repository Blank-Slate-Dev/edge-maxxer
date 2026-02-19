// src/app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.edgemaxxer.com';
  const currentDate = new Date();

  // Only include pages we WANT indexed.
  // Do NOT include /dashboard, /login, /signup, or any thin/private pages.
  const indexablePages: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: '/', changeFrequency: 'daily', priority: 1.0 },

    // Hub
    { path: '/learn', changeFrequency: 'weekly', priority: 0.85 },

    // Guides
    { path: '/guides/arbitrage-betting', changeFrequency: 'weekly', priority: 0.8 },

    // Alternatives (high intent)
    { path: '/alternatives/oddsjam', changeFrequency: 'weekly', priority: 0.75 },
    { path: '/alternatives/rebelbetting', changeFrequency: 'weekly', priority: 0.75 },
    { path: '/alternatives/betburger', changeFrequency: 'weekly', priority: 0.75 },

    // Regions
    { path: '/australia/arbitrage-betting', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/uk/arbitrage-betting', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/us/arbitrage-betting', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/eu/arbitrage-betting', changeFrequency: 'weekly', priority: 0.7 },

    // Sports
    { path: '/sports/afl/arbitrage', changeFrequency: 'weekly', priority: 0.65 },
    { path: '/sports/nrl/arbitrage', changeFrequency: 'weekly', priority: 0.65 },
    { path: '/sports/nba/arbitrage', changeFrequency: 'weekly', priority: 0.65 },
    { path: '/sports/nfl/arbitrage', changeFrequency: 'weekly', priority: 0.65 },
    { path: '/sports/epl/arbitrage', changeFrequency: 'weekly', priority: 0.65 },

    // Legal
    { path: '/terms', changeFrequency: 'yearly', priority: 0.25 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.25 },
  ];

  return indexablePages.map((p) => ({
    url: `${baseUrl}${p.path === '/' ? '' : p.path}`,
    lastModified: currentDate,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
