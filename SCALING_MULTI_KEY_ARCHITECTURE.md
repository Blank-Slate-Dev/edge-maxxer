# Scaling Auto-Scan: Multi-Region Parallel Architecture

## Overview

This document outlines the architecture changes needed to scale the arbitrage scanning system from a single API key with 1-minute cron intervals to a multi-API-key system with 10-15 second scan intervals per region.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel Cron (1 minute interval)                            │
│  /api/cron/auto-scan                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Single Master Account API Key                              │
│  - Scans regions SEQUENTIALLY (AU → UK → US → EU)           │
│  - Uses rotation: AU every time, others rotate              │
│  - ~500ms delay between regions to avoid rate limits        │
│  - Total scan time: 30-50 seconds                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  GlobalScanCache (MongoDB)                                  │
│  - Stores results per region                                │
│  - Dashboard polls this cache                               │
└─────────────────────────────────────────────────────────────┘
```

### Current Limitations

| Issue | Impact |
|-------|--------|
| 1-minute minimum cron interval | Arbs can disappear in 10-30 seconds |
| Sequential region scanning | Total cycle time is sum of all regions |
| Single API key | Rate limiting affects all regions |
| Rotation system | Non-AU regions only scanned every 4 minutes |

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  External Worker (Railway/Fly.io)                           │
│  - Runs continuous loop                                     │
│  - Triggers all regions in PARALLEL every 10-15 seconds     │
│  - Handles scheduling, retries, health monitoring           │
│  - Cost: ~$5-7/month                                        │
└─────────────────────────────────────────────────────────────┘
         │
         │ Parallel HTTP POST requests (every 10-15 seconds)
         │
         ├────────────────┬────────────────┬────────────────┐
         ▼                ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ /api/cron/   │  │ /api/cron/   │  │ /api/cron/   │  │ /api/cron/   │
│ scan-au      │  │ scan-uk      │  │ scan-us      │  │ scan-eu      │
│              │  │              │  │              │  │              │
│ ODDS_API_KEY │  │ ODDS_API_KEY │  │ ODDS_API_KEY │  │ ODDS_API_KEY │
│ _AU          │  │ _UK          │  │ _US          │  │ _EU          │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
         │                │                │                │
         └────────────────┴────────────────┴────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │  GlobalScanCache (MongoDB)  │
                    │  - Each region updates its  │
                    │    own cache independently  │
                    └─────────────────────────────┘
```

### Benefits

| Improvement | Before | After |
|-------------|--------|-------|
| Scan interval | 1 minute | 10-15 seconds |
| Region coverage | Rotated (AU always, others every 4 min) | All regions every scan |
| Parallel scanning | No (sequential) | Yes (true parallel) |
| Rate limit isolation | Shared | Independent per region |
| Credit scaling | Single tier for all | Per-region tier selection |

---

## Implementation Checklist

### 1. Environment Variables (Vercel)

Add these new environment variables to your Vercel project:

```env
# Regional API Keys (one per region)
ODDS_API_KEY_AU=your_au_api_key_here
ODDS_API_KEY_UK=your_uk_api_key_here
ODDS_API_KEY_US=your_us_api_key_here
ODDS_API_KEY_EU=your_eu_api_key_here

# Worker authentication (generate a secure random string)
SCAN_WORKER_SECRET=generate_a_32_char_random_string_here

# Keep existing for backwards compatibility during migration
# MASTER_SCAN_USER_EMAIL can be removed after migration
```

### 2. New API Routes to Create

Create 4 new lightweight scan endpoints:

```
src/app/api/cron/scan-au/route.ts
src/app/api/cron/scan-uk/route.ts
src/app/api/cron/scan-us/route.ts
src/app/api/cron/scan-eu/route.ts
```

Each endpoint should:
- Accept POST requests only (more secure than GET for external triggers)
- Validate the `SCAN_WORKER_SECRET` via Authorization header
- Use its region-specific API key (`ODDS_API_KEY_AU`, etc.)
- Scan ONLY its assigned region (no rotation logic needed)
- Update GlobalScanCache for its region only
- Return scan stats and timing info

**Key difference from current route:** These are single-purpose, single-region endpoints. No user iteration, no rotation logic, no multi-region handling.

### 3. Modify GlobalScanCache Model

The current `GlobalScanCache.updateScanForRegion()` method should work as-is, but verify it handles concurrent updates safely (MongoDB's atomic operations should handle this).

Consider adding:
- `lastScanBy: string` field to track which worker/endpoint updated
- `scanLatencyMs: number` to monitor performance per region

### 4. External Worker Script

Create a simple Node.js worker to deploy on Railway or Fly.io:

```
/worker
  ├── index.ts          # Main loop
  ├── package.json
  ├── Dockerfile        # For deployment
  └── .env.example
```

The worker should:
- Run an infinite loop with configurable interval (default 15 seconds)
- Make parallel HTTP POST requests to all 4 scan endpoints
- Include proper authentication headers
- Log results and errors
- Have health check endpoint for monitoring
- Handle graceful shutdown

### 5. Update vercel.json

Remove or reduce the existing auto-scan cron (keep as fallback or remove entirely):

```json
{
  "crons": [
    {
      "path": "/api/cron/crawl-urls",
      "schedule": "0 * * * *"
    }
    // Remove auto-scan cron - now handled by external worker
  ]
}
```

### 6. SMS Alerts Integration

Decide how alerts should work:
- **Option A:** Each regional endpoint handles its own alerts (current user filtering logic)
- **Option B:** Separate alerts endpoint that runs after all scans complete
- **Option C:** Keep alerts on a less frequent Vercel cron (e.g., every minute) that reads from GlobalScanCache

**Recommendation:** Option C is simplest - decouple scanning from alerting. Fast scans populate the cache, a separate slower process handles user alerts.

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/cron/scan-au/route.ts` | CREATE | New endpoint for AU scanning |
| `src/app/api/cron/scan-uk/route.ts` | CREATE | New endpoint for UK scanning |
| `src/app/api/cron/scan-us/route.ts` | CREATE | New endpoint for US scanning |
| `src/app/api/cron/scan-eu/route.ts` | CREATE | New endpoint for EU scanning |
| `src/app/api/cron/auto-scan/route.ts` | MODIFY or DEPRECATE | Either repurpose for alerts-only or remove |
| `src/lib/models/GlobalScanCache.ts` | MODIFY (optional) | Add monitoring fields |
| `vercel.json` | MODIFY | Remove/update cron config |
| `/worker/*` | CREATE | New external worker project |

---

## Regional Endpoint Structure

Each regional endpoint (`scan-au`, `scan-uk`, etc.) should follow this pattern:

```typescript
// Pseudocode structure for src/app/api/cron/scan-au/route.ts

export async function POST(request: NextRequest) {
  // 1. Authenticate request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SCAN_WORKER_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Use region-specific API key
  const apiKey = process.env.ODDS_API_KEY_AU;
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured for AU' }, { status: 500 });
  }

  // 3. Create provider and scan (reuse existing runScanForRegion logic)
  const provider = createOddsApiProvider(apiKey);
  const result = await runScanForRegion(provider, 'AU');

  // 4. Update GlobalScanCache for AU only
  await GlobalScanCache.updateScanForRegion('AU', result);

  // 5. Return stats
  return NextResponse.json({
    success: true,
    region: 'AU',
    stats: result.stats,
    scanDurationMs: result.durationMs,
    remainingCredits: result.remainingCredits,
  });
}
```

---

## Worker Script Structure

```typescript
// Pseudocode for worker/index.ts

const SCAN_INTERVAL_MS = 15000; // 15 seconds
const ENDPOINTS = [
  'https://your-app.vercel.app/api/cron/scan-au',
  'https://your-app.vercel.app/api/cron/scan-uk',
  'https://your-app.vercel.app/api/cron/scan-us',
  'https://your-app.vercel.app/api/cron/scan-eu',
];

async function runScanCycle() {
  const startTime = Date.now();
  
  // Trigger all regions in parallel
  const results = await Promise.allSettled(
    ENDPOINTS.map(url => 
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SCAN_WORKER_SECRET}`,
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())
    )
  );

  // Log results
  console.log(`Scan cycle completed in ${Date.now() - startTime}ms`, results);
}

// Main loop
async function main() {
  console.log('Worker started, scanning every', SCAN_INTERVAL_MS, 'ms');
  
  while (true) {
    await runScanCycle();
    await sleep(SCAN_INTERVAL_MS);
  }
}

main().catch(console.error);
```

---

## Cost Breakdown

### The Odds API Credits (Monthly)

| Region | Tier Recommendation | Cost | Scans/Month |
|--------|---------------------|------|-------------|
| AU | 5M credits | $119 | ~29,400 (every 15s for H2H + lines) |
| UK | 5M credits | $119 | ~29,400 |
| US | 5M credits | $119 | ~29,400 |
| EU | 5M credits | $119 | ~29,400 |
| **Total** | | **$476/month** | |

*Note: Adjust tiers based on actual usage. Start with 100K ($59) per region and monitor.*

### Infrastructure

| Service | Cost |
|---------|------|
| Vercel Pro (existing) | $20/month |
| Railway Worker | ~$5-7/month |
| MongoDB Atlas (existing) | Varies |
| **Additional cost** | **~$7/month** |

---

## Migration Plan

### Phase 1: Preparation
1. Purchase additional Odds API keys (one per region)
2. Add new environment variables to Vercel
3. Create the 4 regional endpoints (can coexist with current system)

### Phase 2: Testing
1. Manually test each regional endpoint with curl/Postman
2. Verify GlobalScanCache updates correctly per region
3. Check dashboard displays region-specific data correctly

### Phase 3: Worker Deployment
1. Deploy worker to Railway/Fly.io
2. Start with longer interval (60 seconds) to verify stability
3. Gradually reduce interval to target (15 seconds)

### Phase 4: Cutover
1. Disable Vercel cron for auto-scan
2. Monitor worker logs and scan results
3. (Optional) Repurpose old auto-scan route for alerts-only

### Phase 5: Optimization
1. Tune scan intervals based on credit usage
2. Add monitoring/alerting for worker health
3. Consider adding more regions if needed

---

## Monitoring Recommendations

1. **Worker Health:** Set up uptime monitoring (e.g., BetterStack, UptimeRobot) for the worker
2. **Scan Success Rate:** Log and track failed scans per region
3. **Credit Usage:** Monitor `remainingCredits` returned by each scan
4. **Latency:** Track `scanDurationMs` to detect API slowdowns
5. **Cache Freshness:** Dashboard should show "last updated X seconds ago" per region

---

## Questions to Resolve Before Implementation

1. **Alerts:** Keep alerts in regional endpoints or separate them?
2. **Fallback:** Should Vercel cron remain as a fallback if worker fails?
3. **Regional Priority:** Should any region scan more frequently than others?
4. **Credit Tiers:** Start with which tier per region? (Recommend 100K to start, upgrade as needed)
5. **Worker Platform:** Railway vs Fly.io vs other preference?

---

## Summary

This architecture change transforms the scanning system from:
- **Before:** 1 API key, sequential scanning, 1-minute intervals, rotation system
- **After:** 4 API keys, true parallel scanning, 10-15 second intervals, all regions every cycle

The main work involves creating 4 new API endpoints (variations of existing logic) and deploying a simple worker script. The existing GlobalScanCache and dashboard should require minimal changes.

Total additional cost: ~$7/month for infrastructure + cost of additional API keys.
