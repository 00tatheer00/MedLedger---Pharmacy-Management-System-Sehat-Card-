import { z } from 'zod';

/**
 * MedLedger — Environment Variables Schema
 *
 * Validates system environment configuration at runtime.
 * Provides fallback handling for missing configuration during prototype evaluation.
 */
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal('')),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  AUTH_SECRET: z.string().optional().or(z.literal('')),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates and returns parsed environment configuration.
 */
export function getEnvConfig(): EnvConfig {
  const rawEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    AUTH_SECRET: process.env.AUTH_SECRET || '',
  };

  const parsed = envSchema.safeParse(rawEnv);
  if (!parsed.success) {
    console.warn('Environment validation warning:', parsed.error.format());
    return rawEnv as EnvConfig;
  }

  return parsed.data;
}

/**
 * Returns true if real Supabase environment variables are configured.
 */
export function isSupabaseConfigured(): boolean {
  const env = getEnvConfig();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return false;
  if (url.includes('placeholder') || anonKey.includes('placeholder')) return false;

  return true;
}
