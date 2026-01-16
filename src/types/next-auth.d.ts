// src/types/next-auth.d.ts
import 'next-auth';
import { UserPlan, SubscriptionStatus, UserRegion } from '@/lib/models/User';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: UserPlan;
      subscriptionStatus: SubscriptionStatus;
      subscriptionEndsAt?: Date;
      region: UserRegion;
      hasAccess: boolean;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
