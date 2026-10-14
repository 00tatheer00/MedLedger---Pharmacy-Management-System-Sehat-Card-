import { NextResponse, connection } from 'next/server';

/**
 * Returns current build / deployment version identifier.
 * In Vercel environments, this reflects VERCEL_GIT_COMMIT_SHA or VERCEL_DEPLOYMENT_ID.
 * In local environments, falls back to package version or build stamp.
 */
export async function GET() {
  try {
    await connection();
  } catch {
    // Gracefully handle invocation in unit test runners (e.g. vitest) where Next.js RequestStore is not initialized
  }
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.NEXT_PUBLIC_APP_VERSION ||
    '0.1.0';

  return NextResponse.json(
    {
      version,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'production',
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
