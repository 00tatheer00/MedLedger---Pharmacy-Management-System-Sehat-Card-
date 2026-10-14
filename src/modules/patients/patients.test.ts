import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPatientSchema, updatePatientSchema } from './validation';
import { PatientPrototypeStore } from './prototype-store';
import { getPatients, getPatientById, checkMrNumberExists } from './server-queries';
import { createPatientAction, updatePatientAction } from './actions';
import * as sessionModule from '@/core/auth/session';

describe('Patients Domain Module', () => {
  beforeEach(() => {
    PatientPrototypeStore.reset();
    vi.restoreAllMocks();
  });

  describe('Patient Validation (createPatientSchema)', () => {
    it('accepts valid patient input with all optional fields', () => {
      const valid = {
        mr_number: 'MRN-2026-9999',
        full_name: 'Zahid Khan',
        father_name: 'Abdul Qadir',
        cnic: '14301-1234567-9',
        date_of_birth: '1985-05-20',
        gender: 'male',
        phone: '+92-333-1122334',
        address: 'Kohat Cantt',
      };

      const result = createPatientSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates partial updates using updatePatientSchema', () => {
      const partialUpdate = {
        phone: '+92-333-5556677',
        address: 'Bannu Road, Kohat',
      };
      const result = updatePatientSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('accepts valid patient without optional CNIC or father name', () => {
      const valid = {
        mr_number: 'MRN-2026-8888',
        full_name: 'Minor Child',
        gender: 'female',
      };

      const result = createPatientSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid CNIC format', () => {
      const invalid = {
        mr_number: 'MRN-2026-7777',
        full_name: 'Test Patient',
        gender: 'male',
        cnic: '1430112345671', // Missing hyphens
      };

      const result = createPatientSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('13-digit format: 00000-0000000-0');
      }
    });

    it('rejects invalid MR number characters or empty MR number', () => {
      const invalid = {
        mr_number: 'MR#2026@invalid',
        full_name: 'Test Patient',
        gender: 'male',
      };

      const result = createPatientSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects future date of birth', () => {
      const future = new Date(Date.now() + 86400000 * 365).toISOString().slice(0, 10);
      const invalid = {
        mr_number: 'MRN-2026-6666',
        full_name: 'Future Child',
        gender: 'female',
        date_of_birth: future,
      };

      const result = createPatientSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('future');
      }
    });
  });

  describe('Duplicate MR Number Prevention', () => {
    it('detects existing MR number in prototype store', async () => {
      const exists = await checkMrNumberExists('MRN-2026-00101');
      expect(exists).toBe(true);
    });

    it('returns false for unassigned MR number', async () => {
      const exists = await checkMrNumberExists('MRN-9999-99999');
      expect(exists).toBe(false);
    });

    it('prevents registration with duplicate MR number', async () => {
      const res = await createPatientAction({
        mr_number: 'MRN-2026-00101', // Already registered to Tariq Mehmood
        full_name: 'Duplicate Person',
        gender: 'male',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('CONFLICT');
        expect(res.error.message).toContain('already registered');
      }
    });
  });

  describe('Patient Search and Pagination', () => {
    it('retrieves paginated patients list', async () => {
      const res = await getPatients({ page: 1, pageSize: 3 });
      expect(res.patients.length).toBe(3);
      expect(res.page).toBe(1);
      expect(res.total).toBeGreaterThanOrEqual(5);
    });

    it('filters patients by name query', async () => {
      const res = await getPatients({ search: 'Fatima' });
      expect(res.patients.length).toBe(1);
      expect(res.patients[0].full_name).toBe('Fatima Bibi');
    });

    it('filters patients by MR number query', async () => {
      const res = await getPatients({ search: '00103' });
      expect(res.patients.length).toBe(1);
      expect(res.patients[0].full_name).toBe('Muhammad Usman');
    });

    it('filters patients by gender', async () => {
      const res = await getPatients({ gender: 'female' });
      expect(res.patients.every((p) => p.gender === 'female')).toBe(true);
    });
  });

  describe('Patient Registration & Update Actions', () => {
    it('registers a new patient successfully and assigns unique ID', async () => {
      const newMrn = 'MRN-2026-NEW01';
      const res = await createPatientAction({
        mr_number: newMrn,
        full_name: 'Shakir Afridi',
        gender: 'male',
        phone: '+92-333-8899001',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.mr_number).toBe(newMrn);
        expect(res.data.full_name).toBe('Shakir Afridi');

        // Confirm patient is retrievable
        const retrieved = await getPatientById(res.data.id);
        expect(retrieved).not.toBeNull();
        expect(retrieved?.mr_number).toBe(newMrn);
      }
    });

    it('updates patient details successfully', async () => {
      const existing = PatientPrototypeStore.getById('pat-001-kohat');
      expect(existing).not.toBeNull();

      const res = await updatePatientAction('pat-001-kohat', {
        phone: '+92-333-9999999',
        address: 'Updated KDA Sector 5, Kohat',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.phone).toBe('+92-333-9999999');
        expect(res.data.address).toBe('Updated KDA Sector 5, Kohat');
      }
    });

    it('enforces server-side permissions for patient registration', async () => {
      // Mock an active user lacking patients:manage permission (e.g. finance_staff)
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({
        id: 'usr-finance-001',
        email: 'finance@dhq.test',
        fullName: 'Finance Clerk',
        isActive: true,
        roles: ['finance_staff'],
      });

      const res = await createPatientAction({
        mr_number: 'MRN-2026-UNAUTH',
        full_name: 'Unauthorized Test',
        gender: 'male',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('FORBIDDEN');
      }
    });
  });
});
