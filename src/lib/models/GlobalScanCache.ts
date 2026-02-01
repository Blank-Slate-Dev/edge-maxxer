// src/lib/models/GlobalScanCache.ts
import mongoose, { Schema, Model } from 'mongoose';
import type { UserRegion } from '@/lib/config';

export interface IGlobalScanStats {
  totalEvents: number;
  eventsWithMultipleBookmakers: number;
  totalBookmakers: number;
  arbsFound: number;
  nearArbsFound: number;
  valueBetsFound: number;
  sportsScanned: number;
}

// Per-region scan data
export interface IRegionScanData {
  opportunities: unknown[];
  valueBets: unknown[];
  stats: IGlobalScanStats;
  scannedAt: Date;
  scanDurationMs: number;
  remainingCredits?: number;
}

export interface IGlobalScanCache {
  _id: string; // 'global-scan'
  // Per-region data
  au?: IRegionScanData;
  uk?: IRegionScanData;
  us?: IRegionScanData;
  eu?: IRegionScanData;
  // Rotation tracking
  rotationIndex: number; // 0=UK, 1=US, 2=EU
  lastUpdated: Date;
  error?: string;
}

// For backwards compatibility and merged results
export interface IMergedScanResult {
  opportunities: unknown[];
  valueBets: unknown[];
  stats: IGlobalScanStats;
  regionAges: Record<UserRegion, number | null>; // seconds since last scan per region
  scannedAt: Date;
  remainingCredits?: number;
}

interface GlobalScanCacheModel extends Model<IGlobalScanCache> {
  getCurrentScan(): Promise<IGlobalScanCache | null>;
  getMergedScan(maxAgeSeconds?: number): Promise<IMergedScanResult | null>;
  updateRegionScan(region: UserRegion, data: IRegionScanData, rotationIndex?: number): Promise<IGlobalScanCache>;
  getNextRotationRegion(): Promise<UserRegion>;
}

const RegionScanDataSchema = new Schema<IRegionScanData>(
  {
    opportunities: { type: [Schema.Types.Mixed], default: [] },
    valueBets: { type: [Schema.Types.Mixed], default: [] },
    stats: {
      totalEvents: { type: Number, default: 0 },
      eventsWithMultipleBookmakers: { type: Number, default: 0 },
      totalBookmakers: { type: Number, default: 0 },
      arbsFound: { type: Number, default: 0 },
      nearArbsFound: { type: Number, default: 0 },
      valueBetsFound: { type: Number, default: 0 },
      sportsScanned: { type: Number, default: 0 },
    },
    scannedAt: { type: Date, required: true },
    scanDurationMs: { type: Number, default: 0 },
    remainingCredits: { type: Number },
  },
  { _id: false }
);

const GlobalScanCacheSchema = new Schema<IGlobalScanCache, GlobalScanCacheModel>(
  {
    _id: { type: String, required: true },
    au: { type: RegionScanDataSchema },
    uk: { type: RegionScanDataSchema },
    us: { type: RegionScanDataSchema },
    eu: { type: RegionScanDataSchema },
    rotationIndex: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    error: { type: String },
  },
  {
    timestamps: false,
    _id: false,
  }
);

// Get raw cached data
GlobalScanCacheSchema.statics.getCurrentScan = async function (): Promise<IGlobalScanCache | null> {
  return this.findById('global-scan').lean();
};

// Get merged scan with all regions combined
GlobalScanCacheSchema.statics.getMergedScan = async function (
  maxAgeSeconds: number = 600 // Default 10 minutes max age
): Promise<IMergedScanResult | null> {
  const cache = await this.findById('global-scan').lean();
  if (!cache) return null;

  const now = new Date();
  const allOpportunities: unknown[] = [];
  const allValueBets: unknown[] = [];
  const regionAges: Record<UserRegion, number | null> = {
    AU: null,
    UK: null,
    US: null,
    EU: null,
  };
  
  // Aggregate stats
  const mergedStats: IGlobalScanStats = {
    totalEvents: 0,
    eventsWithMultipleBookmakers: 0,
    totalBookmakers: 0,
    arbsFound: 0,
    nearArbsFound: 0,
    valueBetsFound: 0,
    sportsScanned: 0,
  };

  let latestScan: Date = new Date(0);
  let latestCredits: number | undefined;

  const regions: Array<{ key: UserRegion; data: IRegionScanData | undefined }> = [
    { key: 'AU', data: cache.au },
    { key: 'UK', data: cache.uk },
    { key: 'US', data: cache.us },
    { key: 'EU', data: cache.eu },
  ];

  for (const { key, data } of regions) {
    if (!data?.scannedAt) continue;

    const ageSeconds = (now.getTime() - new Date(data.scannedAt).getTime()) / 1000;
    regionAges[key] = Math.round(ageSeconds);

    // Skip stale data
    if (ageSeconds > maxAgeSeconds) {
      console.log(`[GlobalScanCache] Skipping stale ${key} data (${Math.round(ageSeconds)}s old)`);
      continue;
    }

    // Add opportunities and value bets
    allOpportunities.push(...(data.opportunities || []));
    allValueBets.push(...(data.valueBets || []));

    // Aggregate stats (take max for some, sum for others)
    if (data.stats) {
      mergedStats.totalEvents += data.stats.totalEvents || 0;
      mergedStats.eventsWithMultipleBookmakers += data.stats.eventsWithMultipleBookmakers || 0;
      mergedStats.totalBookmakers = Math.max(mergedStats.totalBookmakers, data.stats.totalBookmakers || 0);
      mergedStats.arbsFound += data.stats.arbsFound || 0;
      mergedStats.nearArbsFound += data.stats.nearArbsFound || 0;
      mergedStats.valueBetsFound += data.stats.valueBetsFound || 0;
      mergedStats.sportsScanned = Math.max(mergedStats.sportsScanned, data.stats.sportsScanned || 0);
    }

    // Track latest scan time and credits
    if (new Date(data.scannedAt) > latestScan) {
      latestScan = new Date(data.scannedAt);
      if (data.remainingCredits !== undefined) {
        latestCredits = data.remainingCredits;
      }
    }
  }

  // Deduplicate opportunities by event ID + bookmakers
  const uniqueOpps = deduplicateOpportunities(allOpportunities);
  const uniqueValueBets = deduplicateValueBets(allValueBets);

  return {
    opportunities: uniqueOpps,
    valueBets: uniqueValueBets,
    stats: mergedStats,
    regionAges,
    scannedAt: latestScan,
    remainingCredits: latestCredits,
  };
};

// Update a specific region's scan data
GlobalScanCacheSchema.statics.updateRegionScan = async function (
  region: UserRegion,
  data: IRegionScanData,
  rotationIndex?: number
): Promise<IGlobalScanCache> {
  const regionKey = region.toLowerCase() as 'au' | 'uk' | 'us' | 'eu';
  
  const update: Record<string, unknown> = {
    [regionKey]: data,
    lastUpdated: new Date(),
  };
  
  if (rotationIndex !== undefined) {
    update.rotationIndex = rotationIndex;
  }

  return this.findByIdAndUpdate(
    'global-scan',
    { _id: 'global-scan', ...update },
    { upsert: true, new: true }
  ).lean();
};

// Get the next region to scan in rotation (UK -> US -> EU -> UK ...)
GlobalScanCacheSchema.statics.getNextRotationRegion = async function (): Promise<UserRegion> {
  const cache = await this.findById('global-scan').lean();
  const currentIndex = cache?.rotationIndex ?? 0;
  
  const rotationOrder: UserRegion[] = ['UK', 'US', 'EU'];
  return rotationOrder[currentIndex % rotationOrder.length];
};

// Helper to deduplicate opportunities by event + bookmakers
function deduplicateOpportunities(opps: unknown[]): unknown[] {
  const seen = new Set<string>();
  return opps.filter((opp: unknown) => {
    const o = opp as { 
      event?: { id?: string }; 
      outcome1?: { bookmaker?: string }; 
      outcome2?: { bookmaker?: string };
    };
    if (!o.event?.id) return true;
    
    const key = `${o.event.id}-${o.outcome1?.bookmaker}-${o.outcome2?.bookmaker}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Helper to deduplicate value bets
function deduplicateValueBets(vbs: unknown[]): unknown[] {
  const seen = new Set<string>();
  return vbs.filter((vb: unknown) => {
    const v = vb as { 
      event?: { id?: string }; 
      outcome?: { bookmaker?: string; name?: string };
    };
    if (!v.event?.id) return true;
    
    const key = `${v.event.id}-${v.outcome?.bookmaker}-${v.outcome?.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const GlobalScanCache: GlobalScanCacheModel =
  (mongoose.models.GlobalScanCache as unknown as GlobalScanCacheModel) ||
  mongoose.model<IGlobalScanCache, GlobalScanCacheModel>('GlobalScanCache', GlobalScanCacheSchema);

export default GlobalScanCache;