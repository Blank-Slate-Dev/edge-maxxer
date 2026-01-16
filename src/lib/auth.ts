// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

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

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        
        await dbConnect();
        const user = await User.findById(token.id);
        
        if (user) {
          // Add subscription info to session
          (session.user as { plan: string }).plan = user.plan;
          (session.user as { subscriptionStatus: string }).subscriptionStatus = user.subscriptionStatus;
          (session.user as { subscriptionEndsAt?: Date }).subscriptionEndsAt = user.subscriptionEndsAt;
          (session.user as { region: string }).region = user.region;
          
          // Helper flag for easy access check - explicit boolean
          const hasActiveSubscription = 
            user.subscriptionStatus === 'active' && 
            user.subscriptionEndsAt !== undefined &&
            user.subscriptionEndsAt !== null &&
            new Date(user.subscriptionEndsAt) > new Date();
          (session.user as { hasAccess: boolean }).hasAccess = hasActiveSubscription;
        } else {
          // User not found in DB - set defaults
          (session.user as { plan: string }).plan = 'none';
          (session.user as { subscriptionStatus: string }).subscriptionStatus = 'inactive';
          (session.user as { region: string }).region = 'AU';
          (session.user as { hasAccess: boolean }).hasAccess = false;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};