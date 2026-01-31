// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization configuration
  images: {
    // Modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    
    // Image sizes for the Image component
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Cache optimized images for 1 year
    minimumCacheTTL: 31536000,
    
    // Allow images from these domains if you add external images later
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.edgemaxxer.com',
      },
    ],
  },

  // Security and performance headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy (formerly Feature Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|webp|svg|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for SEO (non-www to www, trailing slashes, etc.)
  async redirects() {
    return [];
  },

  // Rewrites if needed
  async rewrites() {
    return [];
  },

  // Enable React strict mode for better development
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // Trailing slash configuration (false = no trailing slashes)
  trailingSlash: false,

  // Output configuration
  output: 'standalone', // Optimized for deployment

  // Experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', 'date-fns'],
    
    // Required for Puppeteer/Chromium to work on Vercel serverless
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  },
};

export default nextConfig;
