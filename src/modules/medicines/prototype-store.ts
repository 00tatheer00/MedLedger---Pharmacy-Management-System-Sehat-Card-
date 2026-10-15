import {
  Medicine,
  MedicineWithStockSummary,
  MedicineFilters,
  MedicinePaginationParams,
  PaginatedMedicinesResult,
  CreateMedicineInput,
  UpdateMedicineInput,
  StockHealthStatus,
} from './types';
import { inventoryStore } from '@/modules/inventory/prototype-store';

export const initialMedicinesList: Medicine[] = [
  {
    id: 'med-001',
    item_code: 'MED-AMX-500',
    name: 'Amoxicillin 500mg',
    generic_name: 'Amoxicillin Trihydrate',
    dosage_form: 'Capsule',
    strength: '500mg',
    unit_of_measure: 'Capsule',
    category: 'Antibiotics & Antimicrobials',
    min_threshold: 50,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-002',
    item_code: 'MED-CTX-1G',
    name: 'Ceftriaxone 1g',
    generic_name: 'Ceftriaxone Sodium',
    dosage_form: 'Vial',
    strength: '1g',
    unit_of_measure: 'Vial',
    category: 'Antibiotics & Antimicrobials',
    min_threshold: 30,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-003',
    item_code: 'MED-MET-500',
    name: 'Metformin 500mg',
    generic_name: 'Metformin HCl',
    dosage_form: 'Tablet',
    strength: '500mg',
    unit_of_measure: 'Tablet',
    category: 'Diabetes & Endocrine',
    min_threshold: 100,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-004',
    item_code: 'MED-PCM-500',
    name: 'Paracetamol 500mg',
    generic_name: 'Acetaminophen',
    dosage_form: 'Tablet',
    strength: '500mg',
    unit_of_measure: 'Tablet',
    category: 'Analgesics & Anti-inflammatory',
    min_threshold: 200,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-005',
    item_code: 'MED-OMP-20',
    name: 'Omeprazole 20mg',
    generic_name: 'Omeprazole Magnesium',
    dosage_form: 'Capsule',
    strength: '20mg',
    unit_of_measure: 'Capsule',
    category: 'Gastrointestinal',
    min_threshold: 50,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-006',
    item_code: 'MED-AML-5',
    name: 'Amlodipine 5mg',
    generic_name: 'Amlodipine Besylate',
    dosage_form: 'Tablet',
    strength: '5mg',
    unit_of_measure: 'Tablet',
    category: 'Cardiovascular & Antihypertensives',
    min_threshold: 40,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-007',
    item_code: 'MED-INS-100',
    name: 'Insulin Glargine 100 IU/ml',
    generic_name: 'Insulin Glargine',
    dosage_form: 'Vial',
    strength: '100 IU/ml',
    unit_of_measure: 'Vial',
    category: 'Diabetes & Endocrine',
    min_threshold: 20,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-008',
    item_code: 'MED-CIP-250',
    name: 'Ciprofloxacin 250mg',
    generic_name: 'Ciprofloxacin HCl',
    dosage_form: 'Tablet',
    strength: '250mg',
    unit_of_measure: 'Tablet',
    category: 'Antibiotics & Antimicrobials',
    min_threshold: 30,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-009',
    item_code: 'MED-IBU-400',
    name: 'Ibuprofen 400mg',
    generic_name: 'Ibuprofen',
    dosage_form: 'Tablet',
    strength: '400mg',
    unit_of_measure: 'Tablet',
    category: 'Analgesics & Anti-inflammatory',
    min_threshold: 50,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-183',
    item_code: '183',
    name: 'GEN-M 120mg Injection',
    generic_name: 'Gentamicin Sulphate',
    dosage_form: 'Ampoule',
    strength: '120mg/2ml',
    unit_of_measure: 'Ampoule',
    category: 'Antibiotics & Antimicrobials',
    min_threshold: 40,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-134',
    item_code: '134',
    name: 'PROVAS 100ml Infusion',
    generic_name: 'Paracetamol IV',
    dosage_form: 'Bottle',
    strength: '1000mg/100ml',
    unit_of_measure: 'Bottle',
    category: 'Analgesics & Anti-inflammatory',
    min_threshold: 50,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-135',
    item_code: '135',
    name: 'R/L 1L Infusion (Ringer Lactate)',
    generic_name: 'Compound Sodium Lactate',
    dosage_form: 'Bottle',
    strength: '1000ml',
    unit_of_measure: 'Bottle',
    category: 'Intravenous Fluids & Electrolytes',
    min_threshold: 60,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-1300',
    item_code: '1300',
    name: 'RAPID / RISEK 40mg Injection',
    generic_name: 'Omeprazole IV',
    dosage_form: 'Vial',
    strength: '40mg',
    unit_of_measure: 'Vial',
    category: 'Gastrointestinal',
    min_threshold: 40,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-914',
    item_code: '914',
    name: 'ZINACEF 750mg Injection',
    generic_name: 'Cefuroxime Sodium',
    dosage_form: 'Vial',
    strength: '750mg',
    unit_of_measure: 'Vial',
    category: 'Antibiotics & Antimicrobials',
    min_threshold: 30,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-3021',
    item_code: '3021',
    name: 'DUOBACTUM 2gm Injection',
    generic_name: 'Sulbactam + Cefoperazone',
    dosage_form: 'Vial',
    strength: '2g',
    unit_of_measure: 'Vial',
    category: 'Antibiotics & Antimicrobials',
    min_threshold: 30,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-150',
    item_code: '150',
    name: 'N/SALINE 100ml Infusion',
    generic_name: 'Sodium Chloride 0.9%',
    dosage_form: 'Bottle',
    strength: '100ml',
    unit_of_measure: 'Bottle',
    category: 'Intravenous Fluids & Electrolytes',
    min_threshold: 80,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-454',
    item_code: '454',
    name: 'DRIP SET (I.V Infusion Set)',
    generic_name: 'Intravenous Infusion Set',
    dosage_form: 'Piece',
    strength: 'Standard Sterile',
    unit_of_measure: 'Piece',
    category: 'Surgical & Medical Disposables',
    min_threshold: 100,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-031',
    item_code: '31',
    name: 'Disposable Syringe 10cc (D/S 10CC)',
    generic_name: 'Sterile Syringe with Needle',
    dosage_form: 'Piece',
    strength: '10ml',
    unit_of_measure: 'Piece',
    category: 'Surgical & Medical Disposables',
    min_threshold: 150,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-019',
    item_code: '19',
    name: 'Disposable Syringe 5cc (D/S 5CC)',
    generic_name: 'Sterile Syringe with Needle',
    dosage_form: 'Piece',
    strength: '5ml',
    unit_of_measure: 'Piece',
    category: 'Surgical & Medical Disposables',
    min_threshold: 150,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-033',
    item_code: '33',
    name: 'I/V CANNULA (20G / 22G)',
    generic_name: 'Intravenous Cannula with Port',
    dosage_form: 'Piece',
    strength: '20G/22G',
    unit_of_measure: 'Piece',
    category: 'Surgical & Medical Disposables',
    min_threshold: 80,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'med-002-stick',
    item_code: '2',
    name: 'STICKING PLASTER',
    generic_name: 'Adhesive Surgical Tape',
    dosage_form: 'Spool',
    strength: '1 Inch',
    unit_of_measure: 'Spool',
    category: 'Surgical & Medical Disposables',
    min_threshold: 50,
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    deleted_at: null,
  },
];

class MedicinePrototypeStore {
  private medicines: Medicine[] = [...initialMedicinesList];

  public getAllRawMedicines(): Medicine[] {
    return [...this.medicines];
  }

  public getMedicines(
    filters: MedicineFilters = {},
    pagination: MedicinePaginationParams = {},
  ): PaginatedMedicinesResult {
    const { search, category, dosage_form, status = 'all', stock_status = 'all' } = filters;
    const page = Math.max(1, pagination.page || 1);
    const pageSize = Math.max(1, Math.min(100, pagination.pageSize || 10));

    // Map medicines to MedicineWithStockSummary
    let list: MedicineWithStockSummary[] = this.medicines
      .filter((m) => !m.deleted_at)
      .map((med) => {
        const batches = inventoryStore.getBatchesForMedicine(med.id);
        const total_stock = batches.reduce((sum, b) => sum + b.quantity_on_hand, 0);
        const available_stock = batches
          .filter((b) => b.status === 'available')
          .reduce((sum, b) => sum + b.quantity_on_hand, 0);
        const quarantined_stock = batches
          .filter((b) => b.status === 'quarantined')
          .reduce((sum, b) => sum + b.quantity_on_hand, 0);
        const expired_stock = batches
          .filter((b) => b.status === 'expired')
          .reduce((sum, b) => sum + b.quantity_on_hand, 0);

        // Calculate earliest expiry of available stock
        const availableBatchesWithDates = batches
          .filter((b) => b.status === 'available' && b.quantity_on_hand > 0)
          .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));

        const earliest_expiry = availableBatchesWithDates[0]?.expiry_date || null;

        let computed_stock_status: StockHealthStatus = 'in_stock';
        if (available_stock === 0 && total_stock === 0) {
          computed_stock_status = 'out_of_stock';
        } else if (available_stock === 0 && expired_stock > 0) {
          computed_stock_status = 'expired';
        } else if (available_stock <= med.min_threshold) {
          computed_stock_status = 'low_stock';
        }

        return {
          ...med,
          total_stock,
          available_stock,
          quarantined_stock,
          expired_stock,
          batch_count: batches.length,
          earliest_expiry,
          stock_status: computed_stock_status,
        };
      });

    // Apply Filters
    if (status !== 'all') {
      const activeFlag = status === 'active';
      list = list.filter((m) => m.is_active === activeFlag);
    }

    if (category) {
      list = list.filter((m) => m.category.toLowerCase() === category.toLowerCase());
    }

    if (dosage_form) {
      list = list.filter((m) => m.dosage_form.toLowerCase() === dosage_form.toLowerCase());
    }

    if (stock_status !== 'all') {
      list = list.filter((m) => m.stock_status === stock_status);
    }

    if (search && search.trim() !== '') {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.generic_name.toLowerCase().includes(term) ||
          (m.item_code && m.item_code.toLowerCase().includes(term)) ||
          m.strength.toLowerCase().includes(term) ||
          m.category.toLowerCase().includes(term),
      );
    }

    // Sort by name
    list.sort((a, b) => a.name.localeCompare(b.name));

    const totalRecords = list.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = list.slice(startIndex, startIndex + pageSize);

    return {
      medicines: paginatedItems,
      totalRecords,
      totalPages,
      currentPage: page,
      pageSize,
      isLiveDatabase: false,
    };
  }

  public getMedicineById(id: string): MedicineWithStockSummary | null {
    const med = this.medicines.find((m) => m.id === id && !m.deleted_at);
    if (!med) return null;

    const batches = inventoryStore.getBatchesForMedicine(med.id);
    const total_stock = batches.reduce((sum, b) => sum + b.quantity_on_hand, 0);
    const available_stock = batches
      .filter((b) => b.status === 'available')
      .reduce((sum, b) => sum + b.quantity_on_hand, 0);
    const quarantined_stock = batches
      .filter((b) => b.status === 'quarantined')
      .reduce((sum, b) => sum + b.quantity_on_hand, 0);
    const expired_stock = batches
      .filter((b) => b.status === 'expired')
      .reduce((sum, b) => sum + b.quantity_on_hand, 0);

    const availableBatchesWithDates = batches
      .filter((b) => b.status === 'available' && b.quantity_on_hand > 0)
      .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));

    const earliest_expiry = availableBatchesWithDates[0]?.expiry_date || null;

    let computed_stock_status: StockHealthStatus = 'in_stock';
    if (available_stock === 0 && total_stock === 0) {
      computed_stock_status = 'out_of_stock';
    } else if (available_stock === 0 && expired_stock > 0) {
      computed_stock_status = 'expired';
    } else if (available_stock <= med.min_threshold) {
      computed_stock_status = 'low_stock';
    }

    return {
      ...med,
      total_stock,
      available_stock,
      quarantined_stock,
      expired_stock,
      batch_count: batches.length,
      earliest_expiry,
      stock_status: computed_stock_status,
    };
  }

  public createMedicine(input: CreateMedicineInput): Medicine {
    const normalizedName = input.name.trim();
    const normalizedStrength = input.strength.trim();

    // Check duplicate (name, strength)
    const exists = this.medicines.find(
      (m) =>
        !m.deleted_at &&
        m.name.toLowerCase() === normalizedName.toLowerCase() &&
        m.strength.toLowerCase() === normalizedStrength.toLowerCase(),
    );

    if (exists) {
      throw new Error(
        `Medicine "${normalizedName}" with strength "${normalizedStrength}" already exists in the catalogue.`,
      );
    }

    // Check item_code uniqueness if provided
    if (input.item_code && input.item_code.trim()) {
      const codeExists = this.medicines.find(
        (m) =>
          !m.deleted_at && m.item_code?.toLowerCase() === input.item_code?.trim().toLowerCase(),
      );
      if (codeExists) {
        throw new Error(
          `Item code "${input.item_code.trim()}" is already assigned to another medicine.`,
        );
      }
    }

    const now = new Date().toISOString();
    const id = `med-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    const newMed: Medicine = {
      id,
      item_code: input.item_code?.trim() || null,
      name: normalizedName,
      generic_name: input.generic_name.trim(),
      dosage_form: input.dosage_form.trim(),
      strength: normalizedStrength,
      unit_of_measure: input.unit_of_measure.trim(),
      category: input.category.trim(),
      min_threshold: input.min_threshold !== undefined ? input.min_threshold : 20,
      is_active: input.is_active !== undefined ? input.is_active : true,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    this.medicines.unshift(newMed);
    return newMed;
  }

  public updateMedicine(id: string, input: UpdateMedicineInput): Medicine {
    const index = this.medicines.findIndex((m) => m.id === id && !m.deleted_at);
    if (index === -1) {
      throw new Error(`Medicine not found: ${id}`);
    }

    const existing = this.medicines[index];
    const candidateName = input.name ? input.name.trim() : existing.name;
    const candidateStrength = input.strength ? input.strength.trim() : existing.strength;

    // Check duplicate (name, strength) against other records
    if (input.name || input.strength) {
      const conflict = this.medicines.find(
        (m) =>
          m.id !== id &&
          !m.deleted_at &&
          m.name.toLowerCase() === candidateName.toLowerCase() &&
          m.strength.toLowerCase() === candidateStrength.toLowerCase(),
      );
      if (conflict) {
        throw new Error(
          `Another medicine with name "${candidateName}" and strength "${candidateStrength}" already exists.`,
        );
      }
    }

    // Check item code uniqueness if changing
    if (input.item_code && input.item_code.trim()) {
      const codeConflict = this.medicines.find(
        (m) =>
          m.id !== id &&
          !m.deleted_at &&
          m.item_code?.toLowerCase() === input.item_code?.trim().toLowerCase(),
      );
      if (codeConflict) {
        throw new Error(
          `Item code "${input.item_code.trim()}" is already assigned to another medicine.`,
        );
      }
    }

    const updated: Medicine = {
      ...existing,
      item_code:
        input.item_code !== undefined ? input.item_code.trim() || null : existing.item_code,
      name: candidateName,
      generic_name: input.generic_name ? input.generic_name.trim() : existing.generic_name,
      dosage_form: input.dosage_form ? input.dosage_form.trim() : existing.dosage_form,
      strength: candidateStrength,
      unit_of_measure: input.unit_of_measure
        ? input.unit_of_measure.trim()
        : existing.unit_of_measure,
      category: input.category ? input.category.trim() : existing.category,
      min_threshold:
        input.min_threshold !== undefined ? input.min_threshold : existing.min_threshold,
      is_active: input.is_active !== undefined ? input.is_active : existing.is_active,
      updated_at: new Date().toISOString(),
    };

    this.medicines[index] = updated;
    return updated;
  }

  public toggleStatus(id: string, is_active: boolean): Medicine {
    const index = this.medicines.findIndex((m) => m.id === id && !m.deleted_at);
    if (index === -1) {
      throw new Error(`Medicine not found: ${id}`);
    }

    this.medicines[index] = {
      ...this.medicines[index],
      is_active,
      updated_at: new Date().toISOString(),
    };

    return this.medicines[index];
  }

  public deleteMedicine(id: string): Medicine {
    const index = this.medicines.findIndex((m) => m.id === id && !m.deleted_at);
    if (index === -1) {
      throw new Error(`Medicine not found: ${id}`);
    }

    this.medicines[index] = {
      ...this.medicines[index],
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return this.medicines[index];
  }

  public resetForTesting() {
    this.medicines = [...initialMedicinesList];
  }
}

export const medicineStore = new MedicinePrototypeStore();
