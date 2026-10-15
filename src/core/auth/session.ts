import { createServerClient } from '../database/client';
import { isSupabaseConfigured, getEnvConfig } from '../config/env';
import { errorResult, ActionResult } from '../errors/types';

interface UserRoleQueryResult {
  roles?: { name?: string } | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
}

export const DEV_FALLBACK_USER: AuthenticatedUser = {
  id: 'usr-admin-prototype',
  email: 'dr.ayesha@dhqkohat.gov.pk',
  fullName: 'Dr. Ayesha Bangash',
  isActive: true,
  roles: ['system_admin', 'pharmacy_manager', 'pharmacist'],
};

/**
 * Retrieves the current authenticated user and their assigned roles.
 * Returns prototype staff session in development tier when Supabase is unconfigured
 * or when active auth cookie is not present in local dev mode,
 * or null if not authenticated in staging/production.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const env = getEnvConfig();
  const isDev = env.NEXT_PUBLIC_APP_ENV === 'development' || process.env.NODE_ENV !== 'production';

  if (!isSupabaseConfigured() && isDev) {
    return DEV_FALLBACK_USER;
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return isDev ? DEV_FALLBACK_USER : null;
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return isDev ? DEV_FALLBACK_USER : null;
    }

    // Fetch user profile and roles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_active')
      .eq('id', user.id)
      .single();

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);

    const roles = ((userRoles as UserRoleQueryResult[] | null) || [])
      .map((ur) => ur.roles?.name)
      .filter((name): name is string => Boolean(name));

    return {
      id: user.id,
      email: user.email || profile?.email || '',
      fullName: profile?.full_name || user.user_metadata?.full_name || 'Staff Member',
      isActive: profile?.is_active ?? true,
      roles,
    };
  } catch (error) {
    console.error('Failed to retrieve authenticated user:', error);
    return null;
  }
}

/**
 * Enforces that a caller must be authenticated.
 * Returns the AuthenticatedUser or an ActionResult error.
 */
export async function requireAuth(): Promise<ActionResult<AuthenticatedUser>> {
  const user = await getCurrentUser();

  if (!user || !user.isActive) {
    return errorResult(
      'UNAUTHORIZED',
      'Authentication required to access this resource or perform this action.',
    );
  }

  return { success: true, data: user };
}
