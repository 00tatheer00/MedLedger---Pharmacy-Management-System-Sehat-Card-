import {
  createBrowserClient as createSSRBrowserClient,
  createServerClient as createSSRServerClient,
} from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getEnvConfig, isSupabaseConfigured } from '../config/env';

/**
 * Creates a browser-side Supabase client for client components.
 * Enforces Row Level Security (RLS) via the anon key and user JWT.
 */
export function createBrowserClient(): SupabaseClient | null {
  const env = getEnvConfig();

  if (
    !isSupabaseConfigured() ||
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase browser client: missing configuration or running in prototype mode.');
    }
    return null;
  }

  return createSSRBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Creates a server-side Supabase client for Server Components, Server Actions, and Route Handlers.
 * Properly manages session cookies and enforces Row Level Security (RLS).
 */
export async function createServerClient(): Promise<SupabaseClient | null> {
  const env = getEnvConfig();

  if (
    !isSupabaseConfigured() ||
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase server client: missing configuration or running in prototype mode.');
    }
    return null;
  }

  const cookieStore = await cookies();

  return createSSRServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Creates a privileged service-role Supabase client.
 *
 * CRITICAL SECURITY INVARIANT:
 * - Bypasses Row Level Security (RLS).
 * - MUST NEVER be called or imported into browser-accessible code.
 * - Used exclusively for trusted administrative operations, migrations, and system triggers.
 */
export function createServiceClient(options?: { allowInTestContext?: boolean }): SupabaseClient {
  if (typeof window !== 'undefined' && !options?.allowInTestContext) {
    throw new Error(
      'FATAL SECURITY VIOLATION: createServiceClient() cannot be executed in the browser context.',
    );
  }

  const env = getEnvConfig();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Supabase service client initialization failed: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.',
    );
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export { isSupabaseConfigured };
