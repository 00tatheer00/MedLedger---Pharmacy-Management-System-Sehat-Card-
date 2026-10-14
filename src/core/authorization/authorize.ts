import { AuthenticatedUser } from '../auth/session';
import { SystemRole, PermissionCode, ROLE_PERMISSIONS_MATRIX } from './roles';
import { ActionResult, errorResult } from '../errors/types';

/**
 * Checks if a user has a specific role or any role from a list.
 * Note: system_admin always passes role checks.
 */
export function hasRole(user: AuthenticatedUser | null, role: SystemRole | SystemRole[]): boolean {
  if (!user || !user.isActive) return false;

  const allowedRoles = Array.isArray(role) ? role : [role];

  // System Administrator has universal role equivalence
  if (user.roles.includes('system_admin')) {
    return true;
  }

  return allowedRoles.some((r) => user.roles.includes(r));
}

/**
 * Checks if a user possesses a specific permission based on their assigned roles.
 */
export function hasPermission(user: AuthenticatedUser | null, permission: PermissionCode): boolean {
  if (!user || !user.isActive) return false;

  if (user.roles.includes('system_admin')) {
    return true;
  }

  for (const roleName of user.roles) {
    const rolePermissions = ROLE_PERMISSIONS_MATRIX[roleName as SystemRole];
    if (rolePermissions && rolePermissions.includes(permission)) {
      return true;
    }
  }

  return false;
}

/**
 * Enforces that a user has one of the required roles.
 * Returns the user on success or a FORBIDDEN ActionResult.
 */
export function requireRole(
  user: AuthenticatedUser | null,
  role: SystemRole | SystemRole[],
): ActionResult<AuthenticatedUser> {
  if (!user) {
    return errorResult('UNAUTHORIZED', 'Authentication required.');
  }

  if (!hasRole(user, role)) {
    const requiredRoleNames = Array.isArray(role) ? role.join(', ') : role;
    return errorResult(
      'FORBIDDEN',
      `Insufficient privileges. Requires role: ${requiredRoleNames}.`,
    );
  }

  return { success: true, data: user };
}

/**
 * Enforces that a user possesses the required permission code.
 * Returns the user on success or a FORBIDDEN ActionResult.
 */
export function requirePermission(
  user: AuthenticatedUser | null,
  permission: PermissionCode,
): ActionResult<AuthenticatedUser> {
  if (!user) {
    return errorResult('UNAUTHORIZED', 'Authentication required.');
  }

  if (!hasPermission(user, permission)) {
    return errorResult('FORBIDDEN', `Access denied. Missing permission: ${permission}.`);
  }

  return { success: true, data: user };
}
