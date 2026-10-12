/**
 * MedLedger — Core Database Utilities
 *
 * This module provides:
 * - createServerClient(): Creates a Supabase client for server-side use (with RLS).
 * - createServiceClient(): Creates a Supabase client with service role (bypasses RLS).
 *
 * The service role client must NEVER be exposed to the browser.
 * It is used only for admin operations that have already passed
 * server-side authorization checks.
 *
 * Implementation will be added in Phase 4 (Database, Auth & RLS).
 */

export {};
