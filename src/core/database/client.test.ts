import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBrowserClient, createServiceClient } from './client';

describe('Supabase Client Initializers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('createBrowserClient returns null gracefully when URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const client = createBrowserClient();
    expect(client).toBeNull();
  });

  it('createServiceClient strictly forbids browser/client execution', () => {
    // In JSDOM test runner, window is defined, so default invocation must throw fatal security violation
    expect(() => createServiceClient()).toThrowError(/FATAL SECURITY VIOLATION/);
  });

  it('createServiceClient throws error when service role key is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => createServiceClient({ allowInTestContext: true })).toThrowError(
      /SUPABASE_SERVICE_ROLE_KEY are required/,
    );
  });

  it('createServiceClient successfully initializes with valid server credentials', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-for-admin';

    const client = createServiceClient({ allowInTestContext: true });
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });
});
