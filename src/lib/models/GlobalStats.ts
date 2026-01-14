// src/lib/models/GlobalStats.ts
import mongoose, { Schema, Model } from 'mongoose';

export interface IGlobalStats {
  _id: string;
  totalProfit: number;
  totalBets: number;
  lastUpdated: Date;
}

const GlobalStatsSchema = new Schema<IGlobalStats>(
  {
    _id: {
      type: String,
      default: 'global',
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    totalBets: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const GlobalStats: Model<IGlobalStats> = 
  mongoose.models.GlobalStats || mongoose.model<IGlobalStats>('GlobalStats', GlobalStatsSchema);

export default GlobalStats;