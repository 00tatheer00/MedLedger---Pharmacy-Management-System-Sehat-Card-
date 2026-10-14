import { describe, it, expect } from 'vitest';
import { hasRole, hasPermission, requireRole, requirePermission } from './authorize';
import { AuthenticatedUser } from '../auth/session';

describe('Role and Permission Authorization Engine', () => {
  const pharmacistUser: AuthenticatedUser = {
    id: 'user-001',
    email: 'pharmacist@dhqkohat.test',
    fullName: 'Pharmacist Bilal',
    isActive: true,
    roles: ['pharmacist'],
  };

  const financeUser: AuthenticatedUser = {
    id: 'user-002',
    email: 'finance@dhqkohat.test',
    fullName: 'Finance Officer Tariq',
    isActive: true,
    roles: ['finance_staff'],
  };

  const adminUser: AuthenticatedUser = {
    id: 'user-003',
    email: 'admin@dhqkohat.test',
    fullName: 'Admin Ayesha',
    isActive: true,
    roles: ['system_admin'],
  };

  const inactiveUser: AuthenticatedUser = {
    id: 'user-004',
    email: 'deactivated@dhqkohat.test',
    fullName: 'Former Staff',
    isActive: false,
    roles: ['pharmacist'],
  };

  describe('hasRole', () => {
    it('returns true when user has exact role', () => {
      expect(hasRole(pharmacistUser, 'pharmacist')).toBe(true);
      expect(hasRole(financeUser, 'finance_staff')).toBe(true);
    });

    it('returns false when user lacks role', () => {
      expect(hasRole(pharmacistUser, 'finance_staff')).toBe(false);
      expect(hasRole(financeUser, 'pharmacist')).toBe(false);
    });

    it('system_admin passes any role requirement', () => {
      expect(hasRole(adminUser, 'pharmacist')).toBe(true);
      expect(hasRole(adminUser, 'purchasing_staff')).toBe(true);
      expect(hasRole(adminUser, 'finance_staff')).toBe(true);
    });

    it('returns false for inactive user even if role matches', () => {
      expect(hasRole(inactiveUser, 'pharmacist')).toBe(false);
    });

    it('returns false for null user', () => {
      expect(hasRole(null, 'pharmacist')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('allows pharmacist to dispense and read medicines', () => {
      expect(hasPermission(pharmacistUser, 'dispensing:create')).toBe(true);
      expect(hasPermission(pharmacistUser, 'medicines:read')).toBe(true);
      expect(hasPermission(pharmacistUser, 'claims:manage')).toBe(false);
    });

    it('allows finance staff to manage claims but not dispense', () => {
      expect(hasPermission(financeUser, 'claims:manage')).toBe(true);
      expect(hasPermission(financeUser, 'dispensing:create')).toBe(false);
    });

    it('system_admin has universal permission coverage', () => {
      expect(hasPermission(adminUser, 'dispensing:create')).toBe(true);
      expect(hasPermission(adminUser, 'claims:manage')).toBe(true);
      expect(hasPermission(adminUser, 'system:manage')).toBe(true);
      expect(hasPermission(adminUser, 'audit:read')).toBe(true);
    });
  });

  describe('requireRole and requirePermission guards', () => {
    it('requireRole returns success for authorized user', () => {
      const res = requireRole(pharmacistUser, 'pharmacist');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.id).toBe('user-001');
      }
    });

    it('requireRole returns FORBIDDEN for unauthorized user', () => {
      const res = requireRole(pharmacistUser, 'finance_staff');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('FORBIDDEN');
      }
    });

    it('requirePermission returns UNAUTHORIZED for null user', () => {
      const res = requirePermission(null, 'dispensing:create');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('UNAUTHORIZED');
      }
    });
  });
});
