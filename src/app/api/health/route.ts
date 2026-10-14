import { NextResponse, connection } from 'next/server';
import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';

export async function GET() {
  await connection();
  const env = getEnvConfig();
  const startTime = Date.now();

  let databaseStatus: 'connected' | 'prototype_mode' | 'unreachable' = 'prototype_mode';
  let latencyMs = 0;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerClient();
      if (supabase) {
        const { error } = await supabase
          .from('medicines')
          .select('id', { count: 'exact', head: true });
        latencyMs = Date.now() - startTime;
        if (!error) {
          databaseStatus = 'connected';
        } else {
          databaseStatus = 'unreachable';
        }
      }
    } catch {
      databaseStatus = 'unreachable';
      latencyMs = Date.now() - startTime;
    }
  } else {
    latencyMs = Date.now() - startTime;
  }

  const isHealthy = databaseStatus !== 'unreachable';

  const healthPayload = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    application: {
      name: 'MedLedger',
      facility: 'DHQ Hospital Kohat',
      status: 'online',
      environment: env.NEXT_PUBLIC_APP_ENV || 'development',
      version: '0.1.0',
    },
    database: {
      status: databaseStatus,
      latency_ms: latencyMs,
    },
    surveillance: {
      decimal_precision: 'integer_paisa',
      rls_enforcement: isSupabaseConfigured() ? 'active' : 'prototype_emulation',
      audit_logging: 'active',
    },
  };

  return NextResponse.json(healthPayload, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
