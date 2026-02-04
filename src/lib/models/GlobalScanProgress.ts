// src/lib/models/GlobalScanProgress.ts
// Append-only collection for streaming scan results to the dashboard in real-time.
// The cron writes batches here as arbs are detected sport-by-sport.
// The dashboard polls /api/scan-progress?since=<timestamp>&region=<region> every 2s
// to get incremental results as they're found.
// Documents auto-expire after 5 minutes via TTL index (only needed during active scans).

import mongoose, { Schema, Model } from 'mongoose';
import type { UserRegion } from '@/lib/config';

export interface IScanProgressBatch {
  _id: mongoose.Types.ObjectId;
  region: UserRegion;
  scanId: string;              // Unique ID per full scan run (e.g., "scan-AU-1706000000000")
  batchIndex: number;          // Order within the scan (0, 1, 2, ...)
  sportKeys: string[];         // Which sports were in this batch
  
  // Incremental results found in this batch
  opportunities: unknown[];    // BookVsBookArb[] (H2H arbs/near-arbs)
  valueBets: unknown[];        // ValueBet[]
  spreadArbs: unknown[];       // SpreadArb[]
  totalsArbs: unknown[];       // TotalsArb[]
  middles: unknown[];          // MiddleOpportunity[]
  
  // Running totals at this point in the scan
  stats: {
    totalEvents: number;
    eventsWithMultipleBookmakers: number;
    totalBookmakers: number;
    arbsFound: number;
    nearArbsFound: number;
    valueBetsFound: number;
    sportsScanned: number;
    sportsTotal: number;       // Total sports to scan (for progress %)
  };
  
  // Scan status
  phase: 'h2h' | 'lines' | 'complete';  // What part of the scan this batch is from
  isLastBatch: boolean;                   // True on the final batch of the scan
  
  createdAt: Date;             // Used by TTL index + "since" queries
}

interface ScanProgressModel extends Model<IScanProgressBatch> {
  getProgressSince(region: UserRegion, since: Date): Promise<IScanProgressBatch[]>;
  getLatestBatch(region: UserRegion): Promise<IScanProgressBatch | null>;
  writeBatch(data: Omit<IScanProgressBatch, '_id' | 'createdAt'>): Promise<IScanProgressBatch>;
  clearRegion(region: UserRegion, scanId: string): Promise<void>;
}

const ScanProgressBatchSchema = new Schema<IScanProgressBatch, ScanProgressModel>(
  {
    region: {
      type: String,
      required: true,
      enum: ['AU', 'UK', 'US', 'EU'],
      index: true,
    },
    scanId: {
      type: String,
      required: true,
      index: true,
    },
    batchIndex: {
      type: Number,
      required: true,
    },
    sportKeys: {
      type: [String],
      default: [],
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
      sportsTotal: { type: Number, default: 0 },
    },
    phase: {
      type: String,
      enum: ['h2h', 'lines', 'complete'],
      required: true,
    },
    isLastBatch: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // TTL: auto-delete after 5 minutes
    },
  },
  {
    timestamps: false, // We manage createdAt ourselves for TTL
  }
);

// Compound index for the primary query pattern: "get batches for region since time X"
ScanProgressBatchSchema.index({ region: 1, createdAt: 1 });

// Get all batches for a region since a given timestamp
ScanProgressBatchSchema.statics.getProgressSince = async function (
  region: UserRegion,
  since: Date
): Promise<IScanProgressBatch[]> {
  return this.find({
    region,
    createdAt: { $gt: since },
  })
    .sort({ createdAt: 1 })
    .lean();
};

// Get the most recent batch for a region
ScanProgressBatchSchema.statics.getLatestBatch = async function (
  region: UserRegion
): Promise<IScanProgressBatch | null> {
  return this.findOne({ region })
    .sort({ createdAt: -1 })
    .lean();
};

// Write a new batch
ScanProgressBatchSchema.statics.writeBatch = async function (
  data: Omit<IScanProgressBatch, '_id' | 'createdAt'>
): Promise<IScanProgressBatch> {
  return this.create({
    ...data,
    createdAt: new Date(),
  });
};

// Clear old batches for a region when starting a new scan
ScanProgressBatchSchema.statics.clearRegion = async function (
  region: UserRegion,
  scanId: string
): Promise<void> {
  // Delete batches from previous scans (not current one)
  await this.deleteMany({
    region,
    scanId: { $ne: scanId },
  });
};

const GlobalScanProgress: ScanProgressModel =
  (mongoose.models.GlobalScanProgress as unknown as ScanProgressModel) ||
  mongoose.model<IScanProgressBatch, ScanProgressModel>('GlobalScanProgress', ScanProgressBatchSchema);

export default GlobalScanProgress;
