/**
 * MedLedger — Medicine Master Catalogue Domain Types
 *
 * Defines core entities, filter parameters, and pagination structures
 * for the medicine catalogue at DHQ Hospital Kohat central dispensary.
 */

export type DosageForm =
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Suspension'
  | 'Vial'
  | 'Ampoule'
  | 'Injection'
  | 'Ointment'
  | 'Cream'
  | 'Eye Drops'
  | 'Ear Drops'
  | 'Inhaler'
  | 'Infusion'
  | 'Sachet'
  | 'Suppository';

export type UnitOfMeasure =
  | 'Tablet'
  | 'Capsule'
  | 'Bottle'
  | 'Vial'
  | 'Ampoule'
  | 'Box'
  | 'Tube'
  | 'Sachet'
  | 'Piece'
  | 'Pack';

export type TherapeuticCategory =
  | 'Antibiotics & Antimicrobials'
  | 'Analgesics & Anti-inflammatory'
  | 'Cardiovascular & Antihypertensives'
  | 'Diabetes & Endocrine'
  | 'Gastrointestinal'
  | 'Respiratory'
  | 'Central Nervous System'
  | 'Emergency & Resuscitation'
  | 'Dermatological'
  | 'Ophthalmology'
  | 'Obstetrics & Gynecology'
  | 'Vitamins & Minerals'
  | 'Other';

export interface Medicine {
  id: string;
  item_code?: string | null;
  name: string;
  generic_name: string;
  dosage_form: DosageForm | string;
  strength: string;
  unit_of_measure: UnitOfMeasure | string;
  category: TherapeuticCategory | string;
  min_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export type StockHealthStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';

export interface MedicineWithStockSummary extends Medicine {
  total_stock: number;
  available_stock: number;
  quarantined_stock: number;
  expired_stock: number;
  batch_count: number;
  earliest_expiry: string | null;
  stock_status: StockHealthStatus;
}

export interface MedicineFilters {
  search?: string;
  category?: string;
  dosage_form?: string;
  status?: 'all' | 'active' | 'inactive';
  stock_status?: 'all' | StockHealthStatus;
}

export interface MedicinePaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedMedicinesResult {
  medicines: MedicineWithStockSummary[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLiveDatabase: boolean;
}

export interface CreateMedicineInput {
  item_code?: string;
  name: string;
  generic_name: string;
  dosage_form: string;
  strength: string;
  unit_of_measure: string;
  category: string;
  min_threshold?: number;
  is_active?: boolean;
}

export interface UpdateMedicineInput {
  item_code?: string;
  name?: string;
  generic_name?: string;
  dosage_form?: string;
  strength?: string;
  unit_of_measure?: string;
  category?: string;
  min_threshold?: number;
  is_active?: boolean;
}
