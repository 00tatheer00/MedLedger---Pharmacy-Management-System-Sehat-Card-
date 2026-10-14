/**
 * MedLedger — Role and Permission Constants
 *
 * Defines the provisional 5 system roles and granular permissions
 * as approved in docs/SECURITY_PLAN.md and docs/DATABASE_DESIGN.md.
 */

export type SystemRole =
  'system_admin' | 'pharmacy_manager' | 'pharmacist' | 'purchasing_staff' | 'finance_staff';

export const SYSTEM_ROLES: Record<SystemRole, { name: string; description: string }> = {
  system_admin: {
    name: 'System Administrator',
    description: 'Manages user accounts, roles, audit trails, and global configuration.',
  },
  pharmacy_manager: {
    name: 'Pharmacy Manager',
    description:
      'Oversees central dispensary clinical workflows, stock adjustments, and staff operations.',
  },
  pharmacist: {
    name: 'Staff Pharmacist',
    description: 'Verifies prescriptions, dispenses medicines to patients, and checks inventory.',
  },
  purchasing_staff: {
    name: 'Purchasing Staff',
    description:
      'Maintains supplier registry, creates purchase orders, and records goods receipt notes.',
  },
  finance_staff: {
    name: 'Finance & Billing Staff',
    description:
      'Compiles hospital reimbursement claims, reviews invoices, and manages billing reconciliations.',
  },
};

export type PermissionCode =
  | 'medicines:read'
  | 'medicines:manage'
  | 'inventory:read'
  | 'inventory:adjust'
  | 'patients:read'
  | 'patients:manage'
  | 'prescriptions:read'
  | 'prescriptions:manage'
  | 'dispensing:read'
  | 'dispensing:create'
  | 'suppliers:manage'
  | 'purchasing:manage'
  | 'claims:read'
  | 'claims:manage'
  | 'audit:read'
  | 'system:manage';

/**
 * Provisional Role-to-Permission Matrix.
 * System Administrator inherits all permissions.
 */
export const ROLE_PERMISSIONS_MATRIX: Record<SystemRole, PermissionCode[]> = {
  system_admin: [
    'medicines:read',
    'medicines:manage',
    'inventory:read',
    'inventory:adjust',
    'patients:read',
    'patients:manage',
    'prescriptions:read',
    'prescriptions:manage',
    'dispensing:read',
    'dispensing:create',
    'suppliers:manage',
    'purchasing:manage',
    'claims:read',
    'claims:manage',
    'audit:read',
    'system:manage',
  ],
  pharmacy_manager: [
    'medicines:read',
    'medicines:manage',
    'inventory:read',
    'inventory:adjust',
    'patients:read',
    'patients:manage',
    'prescriptions:read',
    'prescriptions:manage',
    'dispensing:read',
    'dispensing:create',
    'suppliers:manage',
    'purchasing:manage',
    'claims:read',
    'audit:read',
  ],
  pharmacist: [
    'medicines:read',
    'inventory:read',
    'patients:read',
    'patients:manage',
    'prescriptions:read',
    'prescriptions:manage',
    'dispensing:read',
    'dispensing:create',
  ],
  purchasing_staff: ['medicines:read', 'inventory:read', 'suppliers:manage', 'purchasing:manage'],
  finance_staff: ['claims:read', 'claims:manage', 'dispensing:read', 'inventory:read'],
};
