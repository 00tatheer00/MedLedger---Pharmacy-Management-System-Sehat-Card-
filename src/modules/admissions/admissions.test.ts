import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAdmissionSchema, dischargeAdmissionSchema } from './validation';
import { AdmissionPrototypeStore } from './prototype-store';
import { getAdmissions, getAdmissionById, checkAdmissionNumberExists } from './server-queries';
import { createAdmissionAction, dischargeAdmissionAction } from './actions';
import * as sessionModule from '@/core/auth/session';

describe('Admissions Domain Module', () => {
  beforeEach(() => {
    AdmissionPrototypeStore.reset();
    vi.restoreAllMocks();
  });

  describe('Admission Validation (createAdmissionSchema)', () => {
    it('accepts valid hospital admission input', () => {
      const valid = {
        patient_id: 'pat-001-kohat',
        admission_number: 'ADM-2026-9001',
        admission_date: '2026-10-12T10:00:00.000Z',
        ward: 'Female Surgical Ward',
        bed_number: 'Bed 12',
        attending_doctor: 'Dr. Noreen Khattak',
        status: 'admitted',
      };

      const result = createAdmissionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects admission without a ward', () => {
      const invalid = {
        patient_id: 'pat-001-kohat',
        admission_number: 'ADM-2026-9002',
        admission_date: '2026-10-12T10:00:00.000Z',
        ward: '',
      };

      const result = createAdmissionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects discharge date earlier than admission date', () => {
      const invalid = {
        patient_id: 'pat-001-kohat',
        admission_number: 'ADM-2026-9003',
        admission_date: '2026-10-12T10:00:00.000Z',
        discharge_date: '2026-10-10T10:00:00.000Z', // Prior to admission date!
        ward: 'ICU',
      };

      const result = createAdmissionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Discharge date cannot be earlier');
      }
    });

    it('validates discharge admission payload using dischargeAdmissionSchema', () => {
      const validDischarge = {
        discharge_date: '2026-10-14T10:00:00.000Z',
        status: 'discharged' as const,
      };
      const result = dischargeAdmissionSchema.safeParse(validDischarge);
      expect(result.success).toBe(true);
    });
  });

  describe('Admissions Queries', () => {
    it('fetches paginated admissions and single admission by ID', async () => {
      const res = await getAdmissions();
      expect(res.admissions.length).toBeGreaterThan(0);

      const admission = await getAdmissionById('adm-001-kohat');
      expect(admission).toBeDefined();
      expect(admission?.admission_number).toBe('ADM-2026-0412');
      expect(admission?.ssp_visit_no).toBe('37634827');
    });

    it('filters and searches admissions by SSP Visit Number', async () => {
      const filtered = await getAdmissions({ sspVisitNo: '37634827' });
      expect(filtered.admissions).toHaveLength(1);
      expect(filtered.admissions[0].admission_number).toBe('ADM-2026-0412');

      const searched = await getAdmissions({ search: '37634827' });
      expect(searched.admissions.length).toBeGreaterThan(0);
      expect(searched.admissions.some((a) => a.ssp_visit_no === '37634827')).toBe(true);
    });
  });

  describe('Duplicate Admission Identifier Prevention', () => {
    it('detects existing admission numbers', async () => {
      const exists = await checkAdmissionNumberExists('ADM-2026-0412');
      expect(exists).toBe(true);
    });

    it('rejects recording admission with duplicate identifier', async () => {
      const res = await createAdmissionAction({
        patient_id: 'pat-002-kohat',
        admission_number: 'ADM-2026-0412', // Already assigned to Tariq Mehmood
        admission_date: '2026-10-13T08:00:00.000Z',
        ward: 'Male Medical Ward',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('CONFLICT');
        expect(res.error.message).toContain('already registered');
      }
    });
  });

  describe('Admission Creation & Discharge Actions', () => {
    it('creates new admission and associates with patient', async () => {
      const res = await createAdmissionAction({
        patient_id: 'pat-004-kohat',
        admission_number: 'ADM-2026-9555',
        ssp_visit_no: '37639999',
        admission_date: '2026-10-13T09:00:00.000Z',
        ward: 'Pediatrics Ward',
        bed_number: 'Bed 04',
        attending_doctor: 'Dr. Imran Khan',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.admission_number).toBe('ADM-2026-9555');
        expect(res.data.ssp_visit_no).toBe('37639999');
        expect(res.data.status).toBe('admitted');
        expect(res.data.patient?.id).toBe('pat-004-kohat');
      }
    });

    it('discharges an admitted patient with valid discharge timestamp', async () => {
      const res = await dischargeAdmissionAction(
        'adm-001-kohat',
        '2026-10-13T12:00:00.000Z',
        'discharged',
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.status).toBe('discharged');
        expect(res.data.discharge_date).toBe('2026-10-13T12:00:00.000Z');
      }
    });

    it('enforces server-side permissions for recording admissions', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({
        id: 'usr-purchasing-001',
        email: 'purchasing@dhq.test',
        fullName: 'Purchaser',
        isActive: true,
        roles: ['purchasing_staff'],
      });

      const res = await createAdmissionAction({
        patient_id: 'pat-001-kohat',
        admission_number: 'ADM-2026-UNAUTH',
        admission_date: '2026-10-13T09:00:00.000Z',
        ward: 'Male Medical Ward',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('FORBIDDEN');
      }
    });
  });
});
