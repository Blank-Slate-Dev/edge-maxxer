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
  _id: string; // We'll use a fixed ID like 'global-scan'
  opportunities: unknown[]; // BookVsBookArb[] stored as JSON
  valueBets: unknown[]; // ValueBet[] stored as JSON
  spreadArbs: unknown[]; // SpreadArb[] stored as JSON
  totalsArbs: unknown[]; // TotalsArb[] stored as JSON
  middles: unknown[]; // MiddleOpportunity[] stored as JSON
  stats: IGlobalScanStats;
  lineStats?: ILineStats;
  regions: UserRegion[];
  scannedAt: Date;
  scanDurationMs: number;
  remainingCredits?: number;
  error?: string;
}

interface GlobalScanCacheModel extends Model<IGlobalScanCache> {
  getCurrentScan(): Promise<IGlobalScanCache | null>;
  updateScan(data: Omit<IGlobalScanCache, '_id'>): Promise<IGlobalScanCache>;
}

const GlobalScanCacheSchema = new Schema<IGlobalScanCache, GlobalScanCacheModel>(
  {
    _id: {
      type: String,
      required: true,
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
    regions: {
      type: [String],
      default: ['AU'],
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

// Static method to get the current cached scan
GlobalScanCacheSchema.statics.getCurrentScan = async function (): Promise<IGlobalScanCache | null> {
  return this.findById('global-scan').lean();
};

// Static method to update the cached scan
GlobalScanCacheSchema.statics.updateScan = async function (
  data: Omit<IGlobalScanCache, '_id'>
): Promise<IGlobalScanCache> {
  return this.findByIdAndUpdate(
    'global-scan',
    { _id: 'global-scan', ...data },
    { upsert: true, new: true }
  ).lean();
};

// Use unknown as intermediate cast to satisfy TypeScript
const GlobalScanCache: GlobalScanCacheModel = 
  (mongoose.models.GlobalScanCache as unknown as GlobalScanCacheModel) || 
  mongoose.model<IGlobalScanCache, GlobalScanCacheModel>('GlobalScanCache', GlobalScanCacheSchema);

export default GlobalScanCache;