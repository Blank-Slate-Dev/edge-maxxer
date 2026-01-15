// src/lib/models/User.ts
import mongoose, { Schema, Model } from 'mongoose';

export type UserRegion = 'US' | 'EU' | 'UK' | 'AU';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  image?: string;
  region: UserRegion;
  subscription: 'none' | 'trial' | 'active' | 'expired';
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  stripeCustomerId?: string;
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
    subscription: {
      type: String,
      enum: ['none', 'trial', 'active', 'expired'],
      default: 'trial',
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    subscriptionEndsAt: {
      type: Date,
    },
    stripeCustomerId: {
      type: String,
    },
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