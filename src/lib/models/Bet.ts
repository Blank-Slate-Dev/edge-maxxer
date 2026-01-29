// src/lib/models/Bet.ts
import mongoose, { Schema, Model } from 'mongoose';

export type BetMode = 'book-vs-book' | 'book-vs-betfair' | 'value-bet' | 'spread' | 'totals' | 'middle';
export type BetStatus = 'pending' | 'won' | 'lost' | 'partial' | 'middle-hit' | 'middle-miss';

export interface IBet {
  _id: mongoose.Types.ObjectId;
  oddsUserId: mongoose.Types.ObjectId; // Reference to User who placed the bet
  
  createdAt: string; // ISO string for consistency with frontend
  event: {
    homeTeam: string;
    awayTeam: string;
    sportKey: string;
    commenceTime: string;
  };
  mode: BetMode;
  
  // Book vs Book (2-way or 3-way)
  bet1?: {
    bookmaker: string;
    outcome: string;
    odds: number;
    stake: number;
    point?: number;
  };
  bet2?: {
    bookmaker: string;
    outcome: string;
    odds: number;
    stake: number;
    point?: number;
  };
  bet3?: {
    bookmaker: string;
    outcome: string;
    odds: number;
    stake: number;
  };
  
  // Book vs Betfair
  backBet?: {
    bookmaker: string;
    outcome: string;
    odds: number;
    stake: number;
  };
  layBet?: {
    odds: number;
    stake: number;
    liability: number;
  };
  
  // For middles
  middleRange?: {
    low: number;
    high: number;
    description: string;
  };
  
  expectedProfit: number;
  potentialProfit?: number;
  status: BetStatus;
  actualProfit?: number;
  extraProfitCounted?: boolean; // Track if extra profit was already added to global counter
  notes?: string;
  
  updatedAt: Date;
}

const BetSchema = new Schema<IBet>(
  {
    oddsUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdAt: {
      type: String,
      required: true,
    },
    event: {
      homeTeam: { type: String, required: true },
      awayTeam: { type: String, required: true },
      sportKey: { type: String, required: true },
      commenceTime: { type: String, required: true },
    },
    mode: {
      type: String,
      enum: ['book-vs-book', 'book-vs-betfair', 'value-bet', 'spread', 'totals', 'middle'],
      required: true,
    },
    
    // Book vs Book
    bet1: {
      bookmaker: String,
      outcome: String,
      odds: Number,
      stake: Number,
      point: Number,
    },
    bet2: {
      bookmaker: String,
      outcome: String,
      odds: Number,
      stake: Number,
      point: Number,
    },
    bet3: {
      bookmaker: String,
      outcome: String,
      odds: Number,
      stake: Number,
    },
    
    // Book vs Betfair
    backBet: {
      bookmaker: String,
      outcome: String,
      odds: Number,
      stake: Number,
    },
    layBet: {
      odds: Number,
      stake: Number,
      liability: Number,
    },
    
    // Middles
    middleRange: {
      low: Number,
      high: Number,
      description: String,
    },
    
    expectedProfit: {
      type: Number,
      required: true,
    },
    potentialProfit: Number,
    status: {
      type: String,
      enum: ['pending', 'won', 'lost', 'partial', 'middle-hit', 'middle-miss'],
      default: 'pending',
    },
    actualProfit: Number,
    extraProfitCounted: {
      type: Boolean,
      default: false,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user queries sorted by creation time
BetSchema.index({ oddsUserId: 1, createdAt: -1 });

const Bet: Model<IBet> = mongoose.models.Bet || mongoose.model<IBet>('Bet', BetSchema);

export default Bet;