// src/lib/models/User.ts
import mongoose, { Schema, Model } from 'mongoose';

export type UserRegion = 'US' | 'EU' | 'UK' | 'AU';
export type UserPlan = 'none' | 'trial' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled' | 'expired';

// Credit tiers based on The Odds API pricing
export type CreditTier = '20k' | '100k' | '5m' | '15m';

// Scan intervals in seconds for each tier (based on ~85 credits/scan)
export const CREDIT_TIER_CONFIG: Record<CreditTier, { credits: number; scanIntervalSeconds: number; label: string }> = {
  '20k': { credits: 20000, scanIntervalSeconds: 10800, label: '20K ($30/mo)' },      // Every 3 hours
  '100k': { credits: 100000, scanIntervalSeconds: 2220, label: '100K ($59/mo)' },    // Every 37 min
  '5m': { credits: 5000000, scanIntervalSeconds: 44, label: '5M ($119/mo)' },        // Every 44 sec
  '15m': { credits: 15000000, scanIntervalSeconds: 15, label: '15M ($249/mo)' },     // Every 15 sec
};

export interface IAutoScanSettings {
  enabled: boolean;
  minProfitPercent: number;        // Minimum profit % to trigger alert (e.g., 4.0)
  highValueThreshold: number;      // Profit % for repeat reminders (e.g., 10.0)
  enableHighValueReminders: boolean; // Send repeat alerts for high-value arbs
  regions: UserRegion[];           // Which regions to scan
  creditTier: CreditTier;          // User's API credit tier
  lastScanAt?: Date;               // Last time auto-scan ran for this user
  lastAlertAt?: Date;              // Last time an SMS alert was sent
  alertCooldownMinutes: number;    // Minimum minutes between alerts (default 5)
  creditsUsedThisMonth: number;    // Track credits used
  creditsResetAt?: Date;           // When credits reset (1st of month)
  // Track alerted arbs to avoid spam (arbId -> { alertedAt, profitPercent })
  alertedArbs: Map<string, { alertedAt: Date; profitPercent: number }> | Record<string, { alertedAt: Date; profitPercent: number }>;
  // Real-time scanning status
  scanStartedAt?: Date;            // When current scan started (null if not scanning)
  lastScanCreditsRemaining?: number; // API credits remaining after last scan
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  image?: string;
  region: UserRegion;
  
  // Subscription fields
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt?: Date;
  
  // Stripe fields
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  
  // Profit tracking
  totalProfit: number;
  
  // Other fields
  oddsApiKey?: string;
  referralCode?: string;
  referredBy?: string;
  
  // Auto-scan alert fields
  phoneNumber?: string;            // Phone number for SMS alerts (E.164 format)
  phoneVerified: boolean;          // Whether phone has been verified
  autoScan: IAutoScanSettings;
  
  // Cached scan results (from auto-scan)
  cachedScanResults?: ICachedScanResults;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ICachedScanResults {
  opportunities: unknown[];        // BookVsBookArb[] stored as JSON
  valueBets: unknown[];            // ValueBet[] stored as JSON
  stats: {
    totalEvents: number;
    eventsWithMultipleBookmakers: number;
    totalBookmakers: number;
    arbsFound: number;
    nearArbsFound: number;
    valueBetsFound: number;
    sportsScanned: number;
  };
  regions: string[];
  scannedAt: Date;
}

const AutoScanSettingsSchema = new Schema<IAutoScanSettings>(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    minProfitPercent: {
      type: Number,
      default: 4.0,
      min: 4,
      max: 500,
    },
    highValueThreshold: {
      type: Number,
      default: 10.0,
      min: 5,
      max: 500,
    },
    enableHighValueReminders: {
      type: Boolean,
      default: true,
    },
    regions: {
      type: [String],
      enum: ['US', 'EU', 'UK', 'AU'],
      default: ['AU'],
    },
    creditTier: {
      type: String,
      enum: ['20k', '100k', '5m', '15m'],
      default: '20k',
    },
    lastScanAt: {
      type: Date,
    },
    lastAlertAt: {
      type: Date,
    },
    alertCooldownMinutes: {
      type: Number,
      default: 5,
      min: 1,
      max: 60,
    },
    creditsUsedThisMonth: {
      type: Number,
      default: 0,
    },
    creditsResetAt: {
      type: Date,
    },
    // Track which arbs have been alerted to avoid spam
    alertedArbs: {
      type: Map,
      of: {
        alertedAt: Date,
        profitPercent: Number,
      },
      default: new Map(),
    },
    // Real-time scanning status
    scanStartedAt: {
      type: Date,
    },
    lastScanCreditsRemaining: {
      type: Number,
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    image: {
      type: String,
    },
    region: {
      type: String,
      enum: ['US', 'EU', 'UK', 'AU'],
      default: 'AU',
    },
    
    // Subscription fields
    plan: {
      type: String,
      enum: ['none', 'trial', 'monthly', 'yearly'],
      default: 'none',
    },
    subscriptionStatus: {
      type: String,
      enum: ['inactive', 'active', 'past_due', 'canceled', 'expired'],
      default: 'inactive',
    },
    subscriptionEndsAt: {
      type: Date,
    },
    
    // Stripe fields
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    
    // Profit tracking
    totalProfit: {
      type: Number,
      default: 0,
    },
    
    // Other fields
    oddsApiKey: {
      type: String,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: String,
    },
    
    // Auto-scan alert fields
    phoneNumber: {
      type: String,
      trim: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    autoScan: {
      type: AutoScanSettingsSchema,
      default: () => ({
        enabled: false,
        minProfitPercent: 4.0,
        highValueThreshold: 10.0,
        enableHighValueReminders: true,
        regions: ['AU'],
        creditTier: '20k',
        alertCooldownMinutes: 5,
        creditsUsedThisMonth: 0,
        alertedArbs: new Map(),
      }),
    },
    
    // Cached scan results from auto-scan
    cachedScanResults: {
      type: {
        opportunities: { type: [Schema.Types.Mixed], default: [] },
        valueBets: { type: [Schema.Types.Mixed], default: [] },
        stats: {
          totalEvents: Number,
          eventsWithMultipleBookmakers: Number,
          totalBookmakers: Number,
          arbsFound: Number,
          nearArbsFound: Number,
          valueBetsFound: Number,
          sportsScanned: Number,
        },
        regions: [String],
        scannedAt: Date,
      },
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique referral code before saving
UserSchema.pre('save', function () {
  if (!this.referralCode) {
    this.referralCode = generateReferralCode();
  }
});

// Virtual to check if subscription is currently active
UserSchema.virtual('isSubscriptionActive').get(function () {
  if (this.subscriptionStatus !== 'active') return false;
  if (!this.subscriptionEndsAt) return false;
  return new Date(this.subscriptionEndsAt) > new Date();
});

// Method to check subscription access
UserSchema.methods.hasAccess = function (): boolean {
  // Active subscription that hasn't expired
  if (this.subscriptionStatus === 'active' && this.subscriptionEndsAt) {
    return new Date(this.subscriptionEndsAt) > new Date();
  }
  return false;
};

// Method to check if user should be scanned now
UserSchema.methods.shouldAutoScan = function (): boolean {
  if (!this.autoScan?.enabled) return false;
  if (!this.oddsApiKey) return false;
  if (!this.phoneNumber) return false;
  
  // Check subscription
  if (!this.hasAccess()) return false;
  
  // Check credits reset (monthly)
  const now = new Date();
  if (this.autoScan.creditsResetAt && this.autoScan.creditsResetAt <= now) {
    // Reset credits at start of month
    this.autoScan.creditsUsedThisMonth = 0;
    this.autoScan.creditsResetAt = getNextMonthStart();
  }
  
  // Check if enough time has passed since last scan
  const tierConfig = CREDIT_TIER_CONFIG[this.autoScan.creditTier as CreditTier];
  if (this.autoScan.lastScanAt) {
    const secondsSinceLastScan = (now.getTime() - this.autoScan.lastScanAt.getTime()) / 1000;
    if (secondsSinceLastScan < tierConfig.scanIntervalSeconds) {
      return false;
    }
  }
  
  // Check if user has credits remaining
  const creditsPerScan = 85; // Approximate
  if (this.autoScan.creditsUsedThisMonth + creditsPerScan > tierConfig.credits) {
    return false;
  }
  
  return true;
};

// Method to check if alert cooldown has passed
UserSchema.methods.canSendAlert = function (): boolean {
  if (!this.autoScan?.lastAlertAt) return true;
  
  const now = new Date();
  const cooldownMs = (this.autoScan.alertCooldownMinutes || 5) * 60 * 1000;
  const timeSinceLastAlert = now.getTime() - this.autoScan.lastAlertAt.getTime();
  
  return timeSinceLastAlert >= cooldownMs;
};

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getNextMonthStart(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;