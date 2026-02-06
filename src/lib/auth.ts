// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { FREE_TRIAL_DURATION_MS } from '@/lib/models/User';

// Session duration constants (in seconds)
const SESSION_MAX_AGE_REMEMBER = 63072000; // 24 months
const SESSION_MAX_AGE_DEFAULT = 5184000;   // 60 days (2 months)

// Target bcrypt cost factor. 10 is the standard recommendation.
const BCRYPT_TARGET_ROUNDS = 10;

// How often to refresh user data from DB (in seconds)
const USER_DATA_REFRESH_INTERVAL = 900; // 15 minutes

/**
 * Check if a free trial is still active given its start time.
 */
function isFreeTrialActive(freeTrialStartedAt: string | Date | null | undefined): boolean {
  if (!freeTrialStartedAt) return false;
  const elapsed = Date.now() - new Date(freeTrialStartedAt).getTime();
  return elapsed < FREE_TRIAL_DURATION_MS;
}

/**
 * Compute the ISO string for when the free trial ends, or undefined.
 */
function getFreeTrialEndsAt(freeTrialStartedAt: string | Date | null | undefined): string | undefined {
  if (!freeTrialStartedAt) return undefined;
  return new Date(new Date(freeTrialStartedAt).getTime() + FREE_TRIAL_DURATION_MS).toISOString();
}

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

        const t0 = Date.now();
        await dbConnect();
        const t1 = Date.now();

        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        const t2 = Date.now();

        if (!user) {
          throw new Error('No account found with this email');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        const t3 = Date.now();

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        // Transparent re-hash: if the stored hash uses a higher cost factor
        // than our target, re-hash with the lower cost for faster future logins.
        // MUST be awaited — Vercel kills fire-and-forget promises after function returns.
        const currentRounds = bcrypt.getRounds(user.password);
        let t4 = t3;
        if (currentRounds > BCRYPT_TARGET_ROUNDS) {
          console.log(`[Auth] Re-hashing password for ${user.email} from cost ${currentRounds} to ${BCRYPT_TARGET_ROUNDS}`);
          const newHash = await bcrypt.hash(credentials.password, BCRYPT_TARGET_ROUNDS);
          await User.findByIdAndUpdate(user._id, { password: newHash });
          t4 = Date.now();
          console.log(`[Auth] Re-hash completed in ${t4 - t3}ms`);
        }

        console.log(`[Auth] authorize() timing: dbConnect=${t1-t0}ms, findUser=${t2-t1}ms, bcryptCompare=${t3-t2}ms, rehash=${t4-t3}ms, total=${t4-t0}ms`);

        // Return ALL needed user data so the jwt callback doesn't need
        // a second DB call.
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          rememberMe: credentials.rememberMe === 'true',
          plan: user.plan,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() ?? null,
          region: user.region,
          freeTrialStartedAt: user.freeTrialStartedAt?.toISOString() ?? null,
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
          await User.create({
            name: user.name || 'User',
            email,
            image: user.image || undefined,
            password: await bcrypt.hash(Math.random().toString(36), BCRYPT_TARGET_ROUNDS),
            region: 'AU',
            plan: 'none',
            subscriptionStatus: 'inactive',
            freeTrialStartedAt: new Date(),
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

        const rememberMe = (user as { rememberMe?: boolean }).rememberMe ?? true;
        const maxAge = rememberMe ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;

        const extUser = user as {
          plan?: string;
          subscriptionStatus?: string;
          subscriptionEndsAt?: string | null;
          region?: string;
          freeTrialStartedAt?: string | null;
        };

        if (extUser.plan !== undefined) {
          token.plan = extUser.plan;
          token.subscriptionStatus = extUser.subscriptionStatus;
          token.subscriptionEndsAt = extUser.subscriptionEndsAt ?? undefined;
          token.region = extUser.region;
          token.freeTrialStartedAt = extUser.freeTrialStartedAt ?? undefined;
          token.userDataFetchedAt = Date.now();
        } else if (account?.provider === 'google') {
          try {
            await dbConnect();
            const dbUser = await User.findOne({ email: user.email?.toLowerCase() })
              .select('plan subscriptionStatus subscriptionEndsAt region freeTrialStartedAt')
              .lean();
            if (dbUser) {
              token.plan = dbUser.plan;
              token.subscriptionStatus = dbUser.subscriptionStatus;
              token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString();
              token.region = dbUser.region;
              token.freeTrialStartedAt = dbUser.freeTrialStartedAt?.toISOString();
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
            .select('plan subscriptionStatus subscriptionEndsAt region freeTrialStartedAt')
            .lean();
          if (dbUser) {
            token.plan = dbUser.plan;
            token.subscriptionStatus = dbUser.subscriptionStatus;
            token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString();
            token.region = dbUser.region;
            token.freeTrialStartedAt = dbUser.freeTrialStartedAt?.toISOString();
            token.userDataFetchedAt = Date.now();
          }
        } catch (error) {
          console.error('Failed to refresh user data on trigger:', error);
        }
        return token;
      }
      
      // ================================================================
      // PERIODIC REFRESH — only if interval has elapsed
      // ================================================================
      if (token.id && token.userDataFetchedAt) {
        const elapsed = Date.now() - (token.userDataFetchedAt as number);
        if (elapsed > USER_DATA_REFRESH_INTERVAL * 1000) {
          try {
            await dbConnect();
            const dbUser = await User.findById(token.id)
              .select('plan subscriptionStatus subscriptionEndsAt region freeTrialStartedAt')
              .lean();
            if (dbUser) {
              token.plan = dbUser.plan;
              token.subscriptionStatus = dbUser.subscriptionStatus;
              token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString();
              token.region = dbUser.region;
              token.freeTrialStartedAt = dbUser.freeTrialStartedAt?.toISOString();
              token.userDataFetchedAt = Date.now();
            }
          } catch (error) {
            console.error('Failed to refresh user data:', error);
          }
        }
      } else if (token.id && !token.userDataFetchedAt) {
        try {
          await dbConnect();
          const dbUser = await User.findById(token.id)
            .select('plan subscriptionStatus subscriptionEndsAt region freeTrialStartedAt')
            .lean();
          if (dbUser) {
            token.plan = dbUser.plan;
            token.subscriptionStatus = dbUser.subscriptionStatus;
            token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString();
            token.region = dbUser.region;
            token.freeTrialStartedAt = dbUser.freeTrialStartedAt?.toISOString();
          }
        } catch (error) {
          console.error('Failed to backfill user data:', error);
        }
        token.userDataFetchedAt = Date.now();
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { plan: string }).plan = (token.plan as string) || 'none';
        (session.user as { subscriptionStatus: string }).subscriptionStatus = 
          (token.subscriptionStatus as string) || 'inactive';
        (session.user as { subscriptionEndsAt?: string }).subscriptionEndsAt = 
          token.subscriptionEndsAt as string | undefined;
        (session.user as { region: string }).region = (token.region as string) || 'AU';
        
        // Free trial fields
        const freeTrialStartedAt = token.freeTrialStartedAt as string | undefined;
        (session.user as { freeTrialStartedAt?: string }).freeTrialStartedAt = freeTrialStartedAt;
        (session.user as { freeTrialEndsAt?: string }).freeTrialEndsAt = getFreeTrialEndsAt(freeTrialStartedAt);
        
        const freeTrialActive = isFreeTrialActive(freeTrialStartedAt);
        (session.user as { freeTrialActive: boolean }).freeTrialActive = freeTrialActive;
        
        // hasAccess = paid subscription OR active free trial
        const hasActiveSubscription: boolean = 
          token.subscriptionStatus === 'active' && 
          typeof token.subscriptionEndsAt === 'string' &&
          new Date(token.subscriptionEndsAt) > new Date();
        
        (session.user as { hasAccess: boolean }).hasAccess = hasActiveSubscription || freeTrialActive;
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
