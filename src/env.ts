// src/env.ts
import { z } from 'zod';

const envSchema = z.object({
  ODDS_API_KEY: z.string().optional(),
  ODDS_API_BASE_URL: z.string().default('https://api.the-odds-api.com/v4'),
  BETFAIR_APP_KEY: z.string().optional(),
  BETFAIR_USERNAME: z.string().optional(),
  BETFAIR_PASSWORD: z.string().optional(),
  DEFAULT_COMMISSION: z.coerce.number().default(0.05),
  ALLOWED_BOOKMAKERS: z.string().default('sportsbet,tab,pointsbet,unibet,neds,ladbrokes,betfair_ex_au,bet365_au,bluebet'),
  MIN_PROFIT_DEFAULT: z.coerce.number().default(0.5),
  POLL_INTERVAL_SECONDS: z.coerce.number().default(30),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  const parsed = envSchema.safeParse({
    ODDS_API_KEY: process.env.ODDS_API_KEY,
    ODDS_API_BASE_URL: process.env.ODDS_API_BASE_URL,
    BETFAIR_APP_KEY: process.env.BETFAIR_APP_KEY,
    BETFAIR_USERNAME: process.env.BETFAIR_USERNAME,
    BETFAIR_PASSWORD: process.env.BETFAIR_PASSWORD,
    DEFAULT_COMMISSION: process.env.DEFAULT_COMMISSION,
    ALLOWED_BOOKMAKERS: process.env.ALLOWED_BOOKMAKERS,
    MIN_PROFIT_DEFAULT: process.env.MIN_PROFIT_DEFAULT,
    POLL_INTERVAL_SECONDS: process.env.POLL_INTERVAL_SECONDS,
  });

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = getEnv();

export function hasOddsApiKey(): boolean {
  return Boolean(env.ODDS_API_KEY);
}

export function getAllowedBookmakers(): string[] {
  return env.ALLOWED_BOOKMAKERS.split(',').map(b => b.trim().toLowerCase());
}
