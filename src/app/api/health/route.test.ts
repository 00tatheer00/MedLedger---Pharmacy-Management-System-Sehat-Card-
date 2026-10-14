import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return {
    ...actual,
    connection: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@/core/config/env', () => ({
  isSupabaseConfigured: vi.fn(),
  getEnvConfig: vi.fn().mockReturnValue({
    NEXT_PUBLIC_APP_ENV: 'test',
  }),
}));

vi.mock('@/core/database/client', () => ({
  createServerClient: vi.fn(),
}));

import { isSupabaseConfigured } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';

describe('Health Check Endpoint (GET /api/health)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns healthy status in prototype mode when Supabase is not configured', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.database.status).toBe('prototype_mode');
    expect(data.surveillance.decimal_precision).toBe('integer_paisa');
    expect(data.surveillance.rls_enforcement).toBe('prototype_emulation');
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('returns healthy status when Supabase connection check succeeds', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as unknown as Awaited<ReturnType<typeof createServerClient>>);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.database.status).toBe('connected');
    expect(data.surveillance.rls_enforcement).toBe('active');
  });

  it('returns degraded (503) status when Supabase returns an error', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ error: new Error('DB connection timed out') }),
      }),
    } as unknown as Awaited<ReturnType<typeof createServerClient>>);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.database.status).toBe('unreachable');
  });
});
