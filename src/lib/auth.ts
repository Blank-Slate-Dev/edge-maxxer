// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

// Session duration constants (in seconds)
const SESSION_MAX_AGE_REMEMBER = 63072000; // 24 months
const SESSION_MAX_AGE_DEFAULT = 5184000;   // 60 days (2 months)

// How often to refresh user data from DB (in seconds)
// Increased from 5 minutes to 15 minutes to reduce DB load.
// The session callback uses cached token data, so this only affects
// how quickly subscription changes are reflected in the UI.
const USER_DATA_REFRESH_INTERVAL = 900; // 15 minutes

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }
        await dbConnect();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) {
          throw new Error('No account found with this email');
        }
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        // Return ALL needed user data so the jwt callback doesn't need
        // a second DB call. NextAuth only passes id/name/email/image by
        // default, so we smuggle the rest via extra fields.
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          rememberMe: credentials.rememberMe === 'true',
          // Extra fields — picked up in the jwt callback below
          plan: user.plan,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() ?? null,
          region: user.region,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await dbConnect();
        
        const email = user.email?.toLowerCase();
        if (!email) return false;
        
        const existingUser = await User.findOne({ email });
        
        if (!existingUser) {
          // Create new user with no subscription (they need to purchase a plan)
          await User.create({
            name: user.name || 'User',
            email,
            image: user.image || undefined,
            password: await bcrypt.hash(Math.random().toString(36), 10),
            region: 'AU', // Default region for Google OAuth users
            plan: 'none',
            subscriptionStatus: 'inactive',
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, account }) {
      // ================================================================
      // INITIAL SIGN IN — user object is available
      // ================================================================
      if (user) {
        token.id = user.id;

        // Set token expiration based on rememberMe preference
        const rememberMe = (user as { rememberMe?: boolean }).rememberMe ?? true;
        const maxAge = rememberMe ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;

        // For CREDENTIALS sign-in: authorize() already fetched everything,
        // so we can populate the token directly — NO extra DB call needed.
        const extUser = user as {
          plan?: string;
          subscriptionStatus?: string;
          subscriptionEndsAt?: string | null;
          region?: string;
        };

        if (extUser.plan !== undefined) {
          // Data came from authorize() — use it directly
          token.plan = extUser.plan;
          token.subscriptionStatus = extUser.subscriptionStatus;
          token.subscriptionEndsAt = extUser.subscriptionEndsAt ?? undefined;
          token.region = extUser.region;
          token.userDataFetchedAt = Date.now();
        } else if (account?.provider === 'google') {
          // Google OAuth — we don't have plan data on the user object,
          // so we need one DB call here. This is unavoidable for OAuth.
          try {
            await dbConnect();
            const dbUser = await User.findOne({ email: user.email?.toLowerCase() })
              .select('plan subscriptionStatus subscriptionEndsAt region')
              .lean();
            if (dbUser) {
              token.plan = dbUser.plan;
              token.subscriptionStatus = dbUser.subscriptionStatus;
              token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString();
              token.region = dbUser.region;
            }
          } catch (error) {
            console.error('Failed to fetch user data on Google sign in:', error);
            token.plan = 'none';
            token.subscriptionStatus = 'inactive';
          }
          token.userDataFetchedAt = Date.now();
        }

        return token;
      }
      
      // ================================================================
      // MANUAL TRIGGER (e.g. after checkout) — always refresh
      // ================================================================
      if (trigger === 'update') {
        try {
          await dbConnect();
          const dbUser = await User.findById(token.id)
            .select('plan subscriptionStatus subscriptionEndsAt region')
            .lean();
          if (dbUser) {
            token.plan = dbUser.plan;
            token.subscriptionStatus = dbUser.subscriptionStatus;
            token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString();
            token.region = dbUser.region;
            token.userDataFetchedAt = Date.now();
          }
        } catch (error) {
          console.error('Failed to refresh user data on trigger:', error);
        }
        return token;
      }
      
      // ================================================================
      // PERIODIC REFRESH — only if interval has elapsed
      // This is the hot path that fires on every session check.
      // ================================================================
      if (token.id && token.userDataFetchedAt) {
        const elapsed = Date.now() - (token.userDataFetchedAt as number);
        if (elapsed > USER_DATA_REFRESH_INTERVAL * 1000) {
          try {
            await dbConnect();
            const dbUser = await User.findById(token.id)
              .select('plan subscriptionStatus subscriptionEndsAt region')
              .lean();
            if (dbUser) {
              token.plan = dbUser.plan;
              token.subscriptionStatus = dbUser.subscriptionStatus;
              token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString();
              token.region = dbUser.region;
              token.userDataFetchedAt = Date.now();
            }
          } catch (error) {
            // If refresh fails, keep using cached data
            console.error('Failed to refresh user data:', error);
          }
        }
      } else if (token.id && !token.userDataFetchedAt) {
        // Edge case: old token format without cached data — refresh once
        try {
          await dbConnect();
          const dbUser = await User.findById(token.id)
            .select('plan subscriptionStatus subscriptionEndsAt region')
            .lean();
          if (dbUser) {
            token.plan = dbUser.plan;
            token.subscriptionStatus = dbUser.subscriptionStatus;
            token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString();
            token.region = dbUser.region;
          }
        } catch (error) {
          console.error('Failed to backfill user data:', error);
        }
        // Set timestamp so we don't retry every request
        token.userDataFetchedAt = Date.now();
      }
      
      return token;
    },
    async session({ session, token }) {
      // This callback just maps token data to session — NO database calls
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { plan: string }).plan = (token.plan as string) || 'none';
        (session.user as { subscriptionStatus: string }).subscriptionStatus = 
          (token.subscriptionStatus as string) || 'inactive';
        (session.user as { subscriptionEndsAt?: string }).subscriptionEndsAt = 
          token.subscriptionEndsAt as string | undefined;
        (session.user as { region: string }).region = (token.region as string) || 'AU';
        
        // Calculate hasAccess from cached token data
        const hasActiveSubscription: boolean = 
          token.subscriptionStatus === 'active' && 
          typeof token.subscriptionEndsAt === 'string' &&
          new Date(token.subscriptionEndsAt) > new Date();
        (session.user as { hasAccess: boolean }).hasAccess = hasActiveSubscription;
      }
      return session;
    },
  },
  pages: {
    signIn: '/?auth=login',
    error: '/?auth=login',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_REMEMBER,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
