// src/app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.edgemaxxer.com';
  const currentDate = new Date();

  // Static pages with their priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/forgot-password`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // Add these pages when you create them:
    // {
    //   url: `${baseUrl}/pricing`,
    //   lastModified: currentDate,
    //   changeFrequency: 'weekly',
    //   priority: 0.9,
    // },
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.6,
    // },
    // {
    //   url: `${baseUrl}/contact`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.5,
    // },
    // {
    //   url: `${baseUrl}/terms`,
    //   lastModified: currentDate,
    //   changeFrequency: 'yearly',
    //   priority: 0.3,
    // },
    // {
    //   url: `${baseUrl}/privacy`,
    //   lastModified: currentDate,
    //   changeFrequency: 'yearly',
    //   priority: 0.3,
    // },
  ];

  // Future: Add dynamic pages like guides, blog posts, sport-specific pages
  // Example for future sport-specific pages:
  // const sports = ['afl', 'nrl', 'cricket', 'tennis', 'soccer', 'nba', 'nfl'];
  // const sportPages: MetadataRoute.Sitemap = sports.map((sport) => ({
  //   url: `${baseUrl}/sports/${sport}`,
  //   lastModified: currentDate,
  //   changeFrequency: 'daily' as const,
  //   priority: 0.8,
  // }));

  // Example for future guide pages:
  // const guides = [
  //   'what-is-arbitrage-betting',
  //   'how-to-calculate-arbitrage',
  //   'best-bookmakers-for-arbitrage-australia',
  //   'avoiding-account-limits',
  //   'arbitrage-betting-calculator',
  // ];
  // const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
  //   url: `${baseUrl}/guides/${guide}`,
  //   lastModified: currentDate,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }));

  return [
    ...staticPages,
    // ...sportPages,
    // ...guidePages,
  ];
}
