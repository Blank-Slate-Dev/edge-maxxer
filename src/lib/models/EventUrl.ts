// src/lib/models/EventUrl.ts
// Stores scraped event URLs from bookmaker websites

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEventUrl extends Document {
  bookmaker: string;           // e.g., 'pointsbet', 'sportsbet', 'tab'
  sport: string;               // e.g., 'basketball_nba', 'aussierules_afl'
  homeTeam: string;            // Normalized team name
  awayTeam: string;            // Normalized team name
  eventUrl: string;            // The actual deep link
  eventName: string;           // Display name from bookmaker
  commenceTime?: Date;         // When the event starts
  scrapedAt: Date;             // When this URL was scraped
  expiresAt: Date;             // Auto-delete after this time
}

const EventUrlSchema = new Schema<IEventUrl>(
  {
    bookmaker: {
      type: String,
      required: true,
      index: true,
    },
    sport: {
      type: String,
      required: true,
      index: true,
    },
    homeTeam: {
      type: String,
      required: true,
    },
    awayTeam: {
      type: String,
      required: true,
    },
    eventUrl: {
      type: String,
      required: true,
    },
    eventName: {
      type: String,
      required: true,
    },
    commenceTime: {
      type: Date,
    },
    scrapedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index defined below with expireAfterSeconds
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient lookups
EventUrlSchema.index({ bookmaker: 1, homeTeam: 1, awayTeam: 1 });
EventUrlSchema.index({ bookmaker: 1, awayTeam: 1, homeTeam: 1 });
EventUrlSchema.index({ bookmaker: 1, sport: 1 });

// TTL index to auto-delete expired URLs
EventUrlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============ HELPER FUNCTIONS ============

export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeBookmaker(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, '') // Remove (AU), (UK), etc.
    .replace(/[^a-z0-9]/g, '')
    .replace(/au$/, '');
}

function getTeamKeywords(name: string): string[] {
  const normalized = normalizeTeamName(name);
  const words = normalized.split(' ');
  const skipWords = ['the', 'los', 'las', 'new', 'san', 'golden', 'state', 'city', 'fc', 'afc', 'united'];
  
  return words.filter(w => !skipWords.includes(w) && w.length > 2);
}

// ============ STATIC METHODS ============

interface EventUrlModel extends Model<IEventUrl> {
  findEventUrl(
    bookmaker: string,
    homeTeam: string,
    awayTeam: string,
    sport?: string
  ): Promise<IEventUrl | null>;
  
  upsertEventUrl(
    bookmaker: string,
    sport: string,
    homeTeam: string,
    awayTeam: string,
    eventUrl: string,
    eventName: string,
    commenceTime?: Date
  ): Promise<void>;
  
  findUrlsForArb(
    bookmakers: string[],
    homeTeam: string,
    awayTeam: string,
    sport?: string
  ): Promise<Record<string, string>>;
  
  getStats(): Promise<{ total: number; byBookmaker: Record<string, number> }>;
}

// Find URL for a specific event
EventUrlSchema.statics.findEventUrl = async function(
  bookmaker: string,
  homeTeam: string,
  awayTeam: string,
  sport?: string
): Promise<IEventUrl | null> {
  const normalizedBookmaker = normalizeBookmaker(bookmaker);
  const normalizedHome = normalizeTeamName(homeTeam);
  const normalizedAway = normalizeTeamName(awayTeam);
  
  const baseQuery: Record<string, unknown> = {
    bookmaker: normalizedBookmaker,
    expiresAt: { $gt: new Date() },
  };
  
  if (sport) {
    baseQuery.sport = sport.toLowerCase();
  }
  
  // Strategy 1: Exact match
  let result = await this.findOne({
    ...baseQuery,
    homeTeam: normalizedHome,
    awayTeam: normalizedAway,
  }).sort({ scrapedAt: -1 });
  
  if (result) return result;
  
  // Strategy 2: Swapped teams
  result = await this.findOne({
    ...baseQuery,
    homeTeam: normalizedAway,
    awayTeam: normalizedHome,
  }).sort({ scrapedAt: -1 });
  
  if (result) return result;
  
  // Strategy 3: Keyword matching
  const homeKeywords = getTeamKeywords(normalizedHome);
  const awayKeywords = getTeamKeywords(normalizedAway);
  
  if (homeKeywords.length > 0 && awayKeywords.length > 0) {
    const homeRegex = homeKeywords.map(k => `(?=.*${k})`).join('');
    const awayRegex = awayKeywords.map(k => `(?=.*${k})`).join('');
    
    result = await this.findOne({
      ...baseQuery,
      $or: [
        { 
          homeTeam: { $regex: homeRegex, $options: 'i' },
          awayTeam: { $regex: awayRegex, $options: 'i' }
        },
        { 
          homeTeam: { $regex: awayRegex, $options: 'i' },
          awayTeam: { $regex: homeRegex, $options: 'i' }
        },
      ],
    }).sort({ scrapedAt: -1 });
  }
  
  return result;
};

// Upsert an event URL
EventUrlSchema.statics.upsertEventUrl = async function(
  bookmaker: string,
  sport: string,
  homeTeam: string,
  awayTeam: string,
  eventUrl: string,
  eventName: string,
  commenceTime?: Date
): Promise<void> {
  const normalizedBookmaker = normalizeBookmaker(bookmaker);
  const normalizedHome = normalizeTeamName(homeTeam);
  const normalizedAway = normalizeTeamName(awayTeam);
  
  // Set expiry to 24 hours after commence time, or 48 hours from now
  const expiresAt = commenceTime 
    ? new Date(commenceTime.getTime() + 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 48 * 60 * 60 * 1000);
  
  await this.findOneAndUpdate(
    {
      bookmaker: normalizedBookmaker,
      homeTeam: normalizedHome,
      awayTeam: normalizedAway,
    },
    {
      sport: sport.toLowerCase(),
      eventUrl,
      eventName,
      commenceTime,
      scrapedAt: new Date(),
      expiresAt,
    },
    { upsert: true }
  );
};

// Find URLs for multiple bookmakers at once
EventUrlSchema.statics.findUrlsForArb = async function(
  bookmakers: string[],
  homeTeam: string,
  awayTeam: string,
  sport?: string
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const model = this;
  
  const promises = bookmakers.map(async (bookmaker) => {
    const result = await (model as EventUrlModel).findEventUrl(bookmaker, homeTeam, awayTeam, sport);
    if (result) {
      urls[normalizeBookmaker(bookmaker)] = result.eventUrl;
    }
  });
  
  await Promise.all(promises);
  
  return urls;
};

// Get stats about cached URLs
EventUrlSchema.statics.getStats = async function(): Promise<{ total: number; byBookmaker: Record<string, number> }> {
  const total = await this.countDocuments({ expiresAt: { $gt: new Date() } });
  
  const byBookmaker = await this.aggregate([
    { $match: { expiresAt: { $gt: new Date() } } },
    { $group: { _id: '$bookmaker', count: { $sum: 1 } } },
  ]);
  
  const byBookmakerMap: Record<string, number> = {};
  byBookmaker.forEach((b: { _id: string; count: number }) => {
    byBookmakerMap[b._id] = b.count;
  });
  
  return { total, byBookmaker: byBookmakerMap };
};

const EventUrl = (mongoose.models.EventUrl as EventUrlModel) || 
  mongoose.model<IEventUrl, EventUrlModel>('EventUrl', EventUrlSchema);

export default EventUrl;