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

export interface ILineStats {
  totalEvents: number;
  spreadArbsFound: number;
  totalsArbsFound: number;
  middlesFound: number;
  nearArbsFound: number;
}

export interface IGlobalScanCache {
  _id: string; // Region-specific: 'scan-AU', 'scan-UK', 'scan-US', 'scan-EU'
  region: UserRegion;
  opportunities: unknown[]; // BookVsBookArb[] stored as JSON
  valueBets: unknown[]; // ValueBet[] stored as JSON
  spreadArbs: unknown[]; // SpreadArb[] stored as JSON
  totalsArbs: unknown[]; // TotalsArb[] stored as JSON
  middles: unknown[]; // MiddleOpportunity[] stored as JSON
  stats: IGlobalScanStats;
  lineStats?: ILineStats;
  scannedAt: Date;
  scanDurationMs: number;
  remainingCredits?: number;
  error?: string;
}

interface GlobalScanCacheModel extends Model<IGlobalScanCache> {
  getScanForRegion(region: UserRegion): Promise<IGlobalScanCache | null>;
  updateScanForRegion(region: UserRegion, data: Omit<IGlobalScanCache, '_id' | 'region'>): Promise<IGlobalScanCache>;
  getAllRegionScans(): Promise<IGlobalScanCache[]>;
  // Backwards compatibility
  getCurrentScan(): Promise<IGlobalScanCache | null>;
}

const GlobalScanCacheSchema = new Schema<IGlobalScanCache, GlobalScanCacheModel>(
  {
    _id: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
      enum: ['AU', 'UK', 'US', 'EU'],
    },
    opportunities: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    valueBets: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    spreadArbs: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    totalsArbs: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    middles: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    stats: {
      totalEvents: { type: Number, default: 0 },
      eventsWithMultipleBookmakers: { type: Number, default: 0 },
      totalBookmakers: { type: Number, default: 0 },
      arbsFound: { type: Number, default: 0 },
      nearArbsFound: { type: Number, default: 0 },
      valueBetsFound: { type: Number, default: 0 },
      sportsScanned: { type: Number, default: 0 },
    },
    lineStats: {
      totalEvents: { type: Number, default: 0 },
      spreadArbsFound: { type: Number, default: 0 },
      totalsArbsFound: { type: Number, default: 0 },
      middlesFound: { type: Number, default: 0 },
      nearArbsFound: { type: Number, default: 0 },
    },
    scannedAt: {
      type: Date,
      required: true,
    },
    scanDurationMs: {
      type: Number,
      default: 0,
    },
    remainingCredits: {
      type: Number,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: false,
    _id: false, // We manage _id ourselves
  }
);

// Get cache for a specific region
GlobalScanCacheSchema.statics.getScanForRegion = async function (
  region: UserRegion
): Promise<IGlobalScanCache | null> {
  return this.findById(`scan-${region}`).lean();
};

// Update cache for a specific region
GlobalScanCacheSchema.statics.updateScanForRegion = async function (
  region: UserRegion,
  data: Omit<IGlobalScanCache, '_id' | 'region'>
): Promise<IGlobalScanCache> {
  const docId = `scan-${region}`;
  return this.findByIdAndUpdate(
    docId,
    { _id: docId, region, ...data },
    { upsert: true, new: true }
  ).lean();
};

// Get all region scans
GlobalScanCacheSchema.statics.getAllRegionScans = async function (): Promise<IGlobalScanCache[]> {
  return this.find({ _id: { $in: ['scan-AU', 'scan-UK', 'scan-US', 'scan-EU'] } }).lean();
};

// Backwards compatibility - returns AU scan by default
GlobalScanCacheSchema.statics.getCurrentScan = async function (): Promise<IGlobalScanCache | null> {
  return this.findById('scan-AU').lean();
};

const GlobalScanCache: GlobalScanCacheModel = 
  (mongoose.models.GlobalScanCache as unknown as GlobalScanCacheModel) || 
  mongoose.model<IGlobalScanCache, GlobalScanCacheModel>('GlobalScanCache', GlobalScanCacheSchema);

export default GlobalScanCache;