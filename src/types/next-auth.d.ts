// src/types/next-auth.d.ts
import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      subscription: 'none' | 'trial' | 'active' | 'expired';
      trialEndsAt?: Date;
      region: 'US' | 'EU' | 'UK' | 'AU';
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
