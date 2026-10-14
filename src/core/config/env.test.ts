import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEnvConfig, isSupabaseConfigured, envSchema } from './env';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('provides default fallback configuration when empty', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const config = getEnvConfig();

    expect(config.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
    expect(config.NEXT_PUBLIC_APP_ENV).toBe('development');
  });

  it('detects placeholder configuration as not configured for live connection', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder-anon-key-for-local-dev';

    expect(isSupabaseConfigured()).toBe(false);
  });

  it('detects missing configuration as not configured', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(isSupabaseConfigured()).toBe(false);
  });

  it('detects real URL and key as configured', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://actualproject.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.actualkey';

    expect(isSupabaseConfigured()).toBe(true);
  });

  it('validates environment schema structure with zod', () => {
    const valid = envSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_ENV: 'staging',
    });

    expect(valid.success).toBe(true);
  });
});
