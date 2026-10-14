/**
 * MedLedger — Suppliers Module Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSupplierSchema, updateSupplierSchema } from './validation';
import { supplierStore } from './prototype-store';

describe('Suppliers Module', () => {
  beforeEach(() => {
    supplierStore.resetForTesting();
  });

  describe('Validation Schemas', () => {
    it('validates a valid supplier input with optional fields', () => {
      const valid = {
        name: 'Frontier Medical Supplies',
        contact_person: 'Asim Khan Bangash',
        phone: '0922-861144',
        email: 'frontiermed@gmail.com',
        address: 'Main Bazaar, Kohat Cantt',
        ntn_number: '1234567-8',
      };
      const res = createSupplierSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('validates supplier with only mandatory name', () => {
      const minimal = {
        name: 'Direct Pharma Depot',
      };
      const res = createSupplierSchema.safeParse(minimal);
      expect(res.success).toBe(true);
    });

    it('rejects empty or whitespace-only supplier name', () => {
      const invalid = {
        name: '   ',
      };
      const res = createSupplierSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('rejects invalid email address when provided', () => {
      const invalid = {
        name: 'Khyber Meds',
        email: 'not-an-email-address',
      };
      const res = createSupplierSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('valid email');
      }
    });

    it('allows empty string email as optional field', () => {
      const valid = {
        name: 'Khyber Meds',
        email: '',
      };
      const res = createSupplierSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('update schema allows partial updates', () => {
      const partial = {
        phone: '0922-999999',
        is_active: false,
      };
      const res = updateSupplierSchema.safeParse(partial);
      expect(res.success).toBe(true);
    });
  });

  describe('Prototype Store Operations', () => {
    const testActor = { id: 'usr-test', name: 'Test User' };

    it('retrieves default demo suppliers with correct stats', () => {
      const res = supplierStore.getSuppliers();
      expect(res.totalRecords).toBeGreaterThanOrEqual(4);
      expect(res.suppliers.some((s) => s.name === 'Kohat Pharma Distributors')).toBe(true);
    });

    it('filters suppliers by active and inactive status', () => {
      const activeRes = supplierStore.getSuppliers({ status: 'active' });
      expect(activeRes.suppliers.every((s) => s.is_active)).toBe(true);

      const inactiveRes = supplierStore.getSuppliers({ status: 'inactive' });
      expect(inactiveRes.suppliers.every((s) => !s.is_active)).toBe(true);
      expect(inactiveRes.suppliers.some((s) => s.name === 'Universal Healthcare Services')).toBe(
        true,
      );
    });

    it('searches suppliers by contact person or phone', () => {
      const res = supplierStore.getSuppliers({ search: 'Zubair' });
      expect(res.suppliers.length).toBe(1);
      expect(res.suppliers[0].name).toBe('Khyber Drug Agency');

      const phoneRes = supplierStore.getSuppliers({ search: '512345' });
      expect(phoneRes.suppliers.length).toBe(1);
      expect(phoneRes.suppliers[0].name).toBe('Kohat Pharma Distributors');
    });

    it('creates a new supplier successfully', () => {
      const created = supplierStore.createSupplier(
        {
          name: 'Indus Valley Pharma',
          contact_person: 'Kamran Shah',
          phone: '0922-123456',
        },
        testActor,
      );
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Indus Valley Pharma');
      expect(created.is_active).toBe(true);

      const fetched = supplierStore.getSupplierById(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.name).toBe('Indus Valley Pharma');
    });

    it('prevents creating duplicate supplier name (case-insensitive)', () => {
      expect(() => {
        supplierStore.createSupplier(
          {
            name: 'kohat pharma distributors',
          },
          testActor,
        );
      }).toThrow(/already exists/i);
    });

    it('prevents creating duplicate NTN number', () => {
      expect(() => {
        supplierStore.createSupplier(
          {
            name: 'New Distributor',
            ntn_number: '2837491-4', // Exists on sup-001
          },
          testActor,
        );
      }).toThrow(/NTN.*already exists/i);
    });

    it('updates supplier and checks name collision', () => {
      const updated = supplierStore.updateSupplier(
        'sup-003',
        {
          phone: '0922-777888',
        },
        testActor,
      );
      expect(updated.phone).toBe('0922-777888');

      // Attempting to rename to an existing supplier's name throws
      expect(() => {
        supplierStore.updateSupplier('sup-003', { name: 'Khyber Drug Agency' }, testActor);
      }).toThrow(/already exists/i);
    });

    it('toggles supplier active status', () => {
      const before = supplierStore.getSupplierById('sup-001');
      expect(before?.is_active).toBe(true);

      const toggled = supplierStore.toggleStatus('sup-001');
      expect(toggled.is_active).toBe(false);

      const toggledBack = supplierStore.toggleStatus('sup-001');
      expect(toggledBack.is_active).toBe(true);
    });
  });
});
