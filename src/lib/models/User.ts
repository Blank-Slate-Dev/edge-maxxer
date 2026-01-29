// src/lib/models/User.ts
import mongoose, { Schema, Model } from 'mongoose';

export type UserRegion = 'US' | 'EU' | 'UK' | 'AU';
export type UserPlan = 'none' | 'trial' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled' | 'expired';

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
  
  createdAt: Date;
  updatedAt: Date;
}

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

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;