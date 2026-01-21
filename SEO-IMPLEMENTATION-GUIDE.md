# Edge Maxxer SEO Implementation Guide

## Files Included

### Modified Files
1. **`src/app/layout.tsx`** - Complete metadata, JSON-LD schemas, font optimization
2. **`src/app/page.tsx`** - Added ResponsibleGambling footer, improved accessibility attributes
3. **`next.config.ts`** - Image optimization, security headers, caching

### New Files
4. **`src/app/sitemap.ts`** - Dynamic sitemap generation for Google
5. **`src/app/robots.ts`** - Search engine crawl directives
6. **`src/components/ResponsibleGambling.tsx`** - Australian gambling compliance footer

---

## Post-Installation Steps

### 1. Update Your Components Index
Add this export to `src/components/index.ts`:

```typescript
export { ResponsibleGambling } from './ResponsibleGambling';
```

### 2. Create Open Graph Images
Create these images in your `public/` folder:
- **`og-image.png`** (1200x630px) - For Facebook, LinkedIn sharing
- **`twitter-image.png`** (1200x630px) - For Twitter cards

Recommended content for OG image:
- Edge Maxxer logo
- Tagline: "Find Arbitrage Betting Opportunities"
- Visual of dashboard or profit percentages
- Brand colors (teal #14b8a6, dark #1c1c1a)

### 3. Set Up Google Search Console
1. Go to https://search.google.com/search-console
2. Add property: www.edgemaxxer.com
3. Verify via HTML tag method
4. Replace `'your-google-site-verification-code'` in `layout.tsx` with your actual code
5. Submit sitemap: https://www.edgemaxxer.com/sitemap.xml

### 4. Test Your Implementation

**Validate structured data:**
- https://validator.schema.org/
- https://search.google.com/test/rich-results

**Test social sharing:**
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

**Check Core Web Vitals:**
- https://pagespeed.web.dev/
- Target scores: LCP < 2.5s, CLS < 0.1, INP < 200ms

---

## SEO Checklist

### Technical SEO ✅
- [x] Comprehensive metadata in layout.tsx
- [x] Open Graph tags for social sharing
- [x] Twitter Card meta tags
- [x] JSON-LD structured data (Organization, WebSite, SoftwareApplication, FAQ)
- [x] Dynamic sitemap generation
- [x] Robots.txt configuration
- [x] Canonical URL setup
- [x] Security headers
- [x] Image optimization configuration

### Performance ✅
- [x] Font optimization with `next/font`
- [x] Image formats (AVIF, WebP)
- [x] Aggressive caching for static assets
- [x] Response compression

### Compliance ✅
- [x] Australian gambling regulations (ACMA)
- [x] Responsible gambling footer with helpline
- [x] BetStop self-exclusion link
- [x] 18+ age restriction notice

---

## Future SEO Recommendations

### Content to Create (High Impact)
1. **`/guides/what-is-arbitrage-betting`** - Target "arbitrage betting Australia"
2. **`/guides/arbitrage-calculator`** - Interactive tool page for backlinks
3. **`/sports/afl`** - Sport-specific arbitrage opportunities
4. **`/sports/nrl`** - Sport-specific page
5. **`/bookmakers`** - Comparison of supported bookmakers

### Keywords to Target
- "arbitrage betting calculator Australia" (low competition)
- "sure bet finder Australia" (medium competition)
- "AFL arbitrage betting" (low competition)
- "Sportsbet arbitrage opportunities" (low competition)
- "how to find arbitrage bets" (informational)

### Link Building Opportunities
- Australian business directories (True Local, Yellow Pages)
- Guest posts on sports analysis blogs
- Create shareable tools (odds converter, ROI calculator)
- Publish original research on arbitrage margins

---

## Important Notes

1. **Google Search Console verification code**: Replace the placeholder in `layout.tsx` line 75

2. **The `output: 'standalone'` in next.config.ts**: This is optimized for deployment. If you're using Vercel, you can remove this line.

3. **Robots.txt blocking query parameters**: The `'/*?*'` rule is aggressive. Remove it if you need query parameters indexed.

4. **FAQ Schema**: The FAQ content in layout.tsx matches your landing page FAQs. Keep these in sync.

5. **ResponsibleGambling component**: This is required for Australian gambling compliance (ACMA). Don't remove it.

---

## Questions?

If you need help with:
- Creating content pages for SEO
- Setting up Google Search Console
- Implementing additional structured data
- Performance optimization

Just ask!
