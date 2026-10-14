import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPrescriptionSchema, createPrescriptionItemSchema } from './validation';
import { PrescriptionPrototypeStore } from './prototype-store';
import {
  getPrescriptions,
  getPrescriptionById,
  checkPrescriptionNumberExists,
  getPrescriptionMedicinesList,
} from './server-queries';
import { createPrescriptionAction, cancelPrescriptionAction } from './actions';
import * as sessionModule from '@/core/auth/session';

describe('Prescriptions Domain Module', () => {
  beforeEach(() => {
    PrescriptionPrototypeStore.reset();
    vi.restoreAllMocks();
  });

  describe('Prescription & Line Item Validation', () => {
    it('accepts valid prescription with multiple items', () => {
      const valid = {
        prescription_number: 'RX-2026-9001',
        patient_id: 'pat-001-kohat',
        admission_id: 'adm-001-kohat',
        prescriber_name: 'Dr. Asad Qureshi',
        prescription_date: '2026-10-13',
        notes: 'Ward slip copy',
        items: [
          {
            medicine_id: 'med-001',
            prescribed_quantity: 10,
            dosage_instructions: '1 cap TDS × 3 days',
          },
          {
            medicine_id: 'med-004',
            prescribed_quantity: 20,
            dosage_instructions: '1 tab TDS SOS',
          },
        ],
      };

      const result = createPrescriptionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects prescription with empty items list', () => {
      const invalid = {
        prescription_number: 'RX-2026-9002',
        patient_id: 'pat-001-kohat',
        prescriber_name: 'Dr. Doctor',
        prescription_date: '2026-10-13',
        items: [], // Empty!
      };

      const result = createPrescriptionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one medicine item');
      }
    });

    it('rejects line item with zero or negative prescribed quantity', () => {
      const invalid = {
        medicine_id: 'med-001',
        prescribed_quantity: 0,
      };

      const result = createPrescriptionItemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('greater than zero');
      }
    });

    it('accepts outpatient prescription with null admission', () => {
      const validOutpatient = {
        prescription_number: 'RX-2026-9003',
        patient_id: 'pat-003-kohat',
        admission_id: null,
        prescriber_name: 'Dr. Tariq Bangash',
        prescription_date: '2026-10-13',
        items: [
          {
            medicine_id: 'med-003',
            prescribed_quantity: 30,
            dosage_instructions: '1 tab BD',
          },
        ],
      };

      const result = createPrescriptionSchema.safeParse(validOutpatient);
      expect(result.success).toBe(true);
    });
  });

  describe('Duplicate Prescription Identifier Prevention', () => {
    it('detects existing prescription numbers', async () => {
      const exists = await checkPrescriptionNumberExists('RX-2026-0041');
      expect(exists).toBe(true);
    });

    it('rejects duplicate prescription creation', async () => {
      const res = await createPrescriptionAction({
        prescription_number: 'RX-2026-0041', // Already registered
        patient_id: 'pat-001-kohat',
        prescriber_name: 'Dr. Duplicate',
        prescription_date: '2026-10-13',
        items: [{ medicine_id: 'med-001', prescribed_quantity: 5 }],
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('CONFLICT');
      }
    });
  });

  describe('Prescription Creation & Stock Invariant Enforcement', () => {
    it('creates prescription atomically with items and strictly zero stock deduction', async () => {
      const rxNumber = 'RX-2026-NEW-99';
      const res = await createPrescriptionAction({
        prescription_number: rxNumber,
        patient_id: 'pat-001-kohat',
        prescriber_name: 'Dr. Test Prescriber',
        prescription_date: '2026-10-13',
        items: [
          {
            medicine_id: 'med-002',
            prescribed_quantity: 12,
            dosage_instructions: '1g IV BD',
          },
        ],
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.prescription_number).toBe(rxNumber);
        expect(res.data.status).toBe('pending');
        expect(res.data.items.length).toBe(1);

        // Crucial healthcare invariant: zero stock issued at prescription capture stage
        expect(res.data.items[0].dispensed_quantity).toBe(0);
        expect(res.data.items[0].status).toBe('pending');
      }
    });

    it('cancels a pending prescription and updates all its items', async () => {
      const res = await cancelPrescriptionAction(
        'rx-001-kohat',
        'Doctor revised antibiotic therapy',
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.status).toBe('cancelled');
        expect(res.data.items.every((it) => it.status === 'cancelled')).toBe(true);
        expect(res.data.notes).toContain('Doctor revised antibiotic therapy');
      }
    });

    it('retrieves catalogue medicines for prescription dropdown selector', async () => {
      const meds = await getPrescriptionMedicinesList();
      expect(meds.length).toBeGreaterThan(0);
      expect(meds[0]).toHaveProperty('name');
      expect(meds[0]).toHaveProperty('dosage_form');
      expect(meds[0]).toHaveProperty('strength');
    });

    it('fetches paginated prescriptions and prescription by ID', async () => {
      const result = await getPrescriptions();
      expect(result.prescriptions.length).toBeGreaterThan(0);

      const rx = await getPrescriptionById('rx-001-kohat');
      expect(rx).toBeDefined();
      expect(rx?.prescription_number).toBe('RX-2026-0041');
    });

    it('enforces server-side permissions for prescription transcription', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({
        id: 'usr-purchaser-001',
        email: 'purchaser@dhq.test',
        fullName: 'Purchaser',
        isActive: true,
        roles: ['purchasing_staff'],
      });

      const res = await createPrescriptionAction({
        prescription_number: 'RX-2026-UNAUTH',
        patient_id: 'pat-001-kohat',
        prescriber_name: 'Dr. Unauthorized',
        prescription_date: '2026-10-13',
        items: [{ medicine_id: 'med-001', prescribed_quantity: 5 }],
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('FORBIDDEN');
      }
    });
  });
});
