import { describe, it, expect, beforeEach } from 'vitest';
import { medicineStore } from './prototype-store';
import { createMedicineSchema, updateMedicineSchema, medicineFilterSchema } from './validation';
import {
  createMedicineAction,
  updateMedicineAction,
  toggleMedicineStatusAction,
  getMedicinesAction,
  getMedicineByIdAction,
} from './actions';

describe('Medicine Catalogue Module', () => {
  beforeEach(() => {
    medicineStore.resetForTesting();
  });

  describe('Validation Schemas', () => {
    it('validates a correct medicine input', () => {
      const valid = {
        item_code: 'MED-AUG-625',
        name: 'Augmentin 625mg',
        generic_name: 'Amoxicillin + Clavulanic Acid',
        dosage_form: 'Tablet',
        strength: '625mg',
        unit_of_measure: 'Tablet',
        category: 'Antibiotics & Antimicrobials',
        min_threshold: 40,
        is_active: true,
      };

      const result = createMedicineSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects missing required fields', () => {
      const invalid = {
        name: '',
        generic_name: '',
        strength: '',
      };

      const result = createMedicineSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('name');
        expect(paths).toContain('generic_name');
        expect(paths).toContain('dosage_form');
        expect(paths).toContain('strength');
        expect(paths).toContain('unit_of_measure');
        expect(paths).toContain('category');
      }
    });

    it('rejects negative minimum threshold', () => {
      const invalid = {
        name: 'Azithromycin 500mg',
        generic_name: 'Azithromycin',
        dosage_form: 'Tablet',
        strength: '500mg',
        unit_of_measure: 'Tablet',
        category: 'Antibiotics & Antimicrobials',
        min_threshold: -5,
      };

      const result = createMedicineSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates partial update schema', () => {
      const validUpdate = {
        min_threshold: 60,
        is_active: false,
      };

      const result = updateMedicineSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('Store Operations & Duplicate Prevention', () => {
    it('retrieves initial seeded medicines with stock metrics', () => {
      const res = medicineStore.getMedicines();
      expect(res.totalRecords).toBeGreaterThanOrEqual(7);
      expect(res.medicines[0]).toHaveProperty('total_stock');
      expect(res.medicines[0]).toHaveProperty('available_stock');
      expect(res.medicines[0]).toHaveProperty('batch_count');
    });

    it('prevents duplicate (name, strength) combination', () => {
      // Amoxicillin 500mg already exists in store
      expect(() => {
        medicineStore.createMedicine({
          name: 'Amoxicillin 500mg',
          generic_name: 'Amoxicillin',
          dosage_form: 'Capsule',
          strength: '500mg',
          unit_of_measure: 'Capsule',
          category: 'Antibiotics & Antimicrobials',
        });
      }).toThrow(/already exists/i);
    });

    it('allows different strengths for the same medicine brand', () => {
      const created = medicineStore.createMedicine({
        name: 'Amoxicillin 250mg',
        generic_name: 'Amoxicillin Trihydrate',
        dosage_form: 'Suspension',
        strength: '250mg/5ml',
        unit_of_measure: 'Bottle',
        category: 'Antibiotics & Antimicrobials',
        min_threshold: 25,
      });

      expect(created).toBeDefined();
      expect(created.id).toContain('med-');
      expect(created.strength).toBe('250mg/5ml');
    });

    it('filters medicines by search query across name and generic name', () => {
      const res = medicineStore.getMedicines({ search: 'Sodium' });
      expect(res.medicines.some((m) => m.name === 'Ceftriaxone 1g')).toBe(true);
    });

    it('filters medicines by category', () => {
      const res = medicineStore.getMedicines({ category: 'Gastrointestinal' });
      expect(res.medicines.every((m) => m.category === 'Gastrointestinal')).toBe(true);
      expect(res.medicines.some((m) => m.name === 'Omeprazole 20mg')).toBe(true);
    });

    it('filters medicines by stock status', () => {
      // Insulin Glargine is out of stock in seed
      const res = medicineStore.getMedicines({ stock_status: 'out_of_stock' });
      expect(res.medicines.some((m) => m.name.includes('Insulin Glargine'))).toBe(true);
    });

    it('updates medicine details and prevents conflicting update', () => {
      const updated = medicineStore.updateMedicine('med-001', {
        min_threshold: 75,
      });
      expect(updated.min_threshold).toBe(75);

      // Attempt conflict update
      expect(() => {
        medicineStore.updateMedicine('med-001', {
          name: 'Ceftriaxone 1g',
          strength: '1g',
        });
      }).toThrow(/already exists/i);
    });

    it('toggles medicine active status', () => {
      const toggled = medicineStore.toggleStatus('med-001', false);
      expect(toggled.is_active).toBe(false);

      const activeList = medicineStore.getMedicines({ status: 'active' });
      expect(activeList.medicines.some((m) => m.id === 'med-001')).toBe(false);
    });
  });

  describe('Server Actions', () => {
    it('creates medicine via server action', async () => {
      const res = await createMedicineAction({
        name: 'Clarithromycin 500mg',
        generic_name: 'Clarithromycin',
        dosage_form: 'Tablet',
        strength: '500mg',
        unit_of_measure: 'Tablet',
        category: 'Antibiotics & Antimicrobials',
        min_threshold: 30,
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.name).toBe('Clarithromycin 500mg');
      }
    });

    it('returns conflict error for duplicate via action', async () => {
      const res = await createMedicineAction({
        name: 'Paracetamol 500mg',
        generic_name: 'Acetaminophen',
        dosage_form: 'Tablet',
        strength: '500mg',
        unit_of_measure: 'Tablet',
        category: 'Analgesics & Anti-inflammatory',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.message).toMatch(/already exists/i);
      }
    });

    it('validates filter schema', () => {
      const parsed = medicineFilterSchema.safeParse({ search: 'Amox', page: 2 });
      expect(parsed.success).toBe(true);
    });

    it('retrieves single medicine by ID', async () => {
      const res = await getMedicineByIdAction('med-001');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.id).toBe('med-001');
        expect(res.data.name).toBe('Amoxicillin 500mg');
        expect(res.data.total_stock).toBe(200);
      }
    });

    it('updates medicine via server action', async () => {
      const res = await updateMedicineAction('med-001', { min_threshold: 80 });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.min_threshold).toBe(80);
      }
    });

    it('toggles medicine status via server action', async () => {
      const res = await toggleMedicineStatusAction('med-001', false);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.is_active).toBe(false);
      }
    });

    it('retrieves paginated medicines via server action', async () => {
      const res = await getMedicinesAction({ search: 'Amox' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.medicines.length).toBeGreaterThan(0);
      }
    });
  });
});
