/**
 * MedLedger — Dispensing & Atomic Stock Transactions Domain Types
 *
 * Defines models, validation contracts, FEFO allocations, and transactional responses
 * for outpatient and inpatient medicine dispensing at DHQ Hospital Kohat.
 */

import { PrescriptionWithDetails } from '@/modules/prescriptions/types';
import { MedicineBatch } from '@/modules/inventory/types';

export type DispensingStatus = 'completed' | 'reversed';

export interface DispensingItemDetail {
  id: string;
  dispensing_record_id: string;
  prescription_item_id: string;
  medicine_batch_id: string;
  dispensed_medicine_id: string;
  quantity_dispensed: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  // Enriched presentation fields
  prescribed_medicine_name: string;
  dispensed_medicine_name: string;
  strength: string;
  dosage_form: string;
  batch_number: string;
  expiry_date: string;
  is_substitution: boolean;
  substitution_reason?: string | null;
  is_fefo_override: boolean;
  fefo_override_reason?: string | null;
}

export interface DispensingWithDetails {
  id: string;
  dispensing_number: string;
  prescription_id: string;
  prescription_number: string;
  patient_id: string;
  patient_name: string;
  mr_number: string;
  admission_id?: string | null;
  admission_number?: string | null;
  ssp_visit_no?: string | null;
  ward?: string | null;
  bed_number?: string | null;
  dispensed_by: string;
  dispensed_by_name: string;
  dispensed_at: string;
  notes?: string | null;
  status: DispensingStatus;
  total_amount: number;
  total_items: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  items: DispensingItemDetail[];
  prescription?: PrescriptionWithDetails;
}

export interface FEFOBatchCandidate {
  batch: MedicineBatch;
  is_eligible: boolean;
  ineligibility_reason?: string;
  is_fefo_recommended: boolean;
  days_until_expiry: number;
}

export interface DispenseItemInput {
  prescription_item_id: string;
  medicine_batch_id: string;
  dispensed_medicine_id: string;
  quantity: number;
  unit_price: number;
  is_substitution?: boolean;
  substitution_reason?: string;
  is_fefo_override?: boolean;
  fefo_override_reason?: string;
  notes?: string;
}

export interface DispensePrescriptionInput {
  prescription_id: string;
  notes?: string;
  items: DispenseItemInput[];
  idempotency_key: string;
}

export interface ReverseDispensingInput {
  dispensing_record_id: string;
  reason: string;
}

export interface DispensingFilterParams {
  search?: string;
  status?: 'all' | DispensingStatus;
  date_from?: string;
  date_to?: string;
  patient_id?: string;
  prescription_id?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedDispensingResult {
  records: DispensingWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLiveDatabase: boolean;
}

export interface DispensingOverviewKPIs {
  total_dispensed_today: number;
  total_units_dispensed_today: number;
  pending_prescriptions_count: number;
  partially_dispensed_count: number;
  reversed_dispensations_count: number;
}
