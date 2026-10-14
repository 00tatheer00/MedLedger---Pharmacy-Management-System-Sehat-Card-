/**
 * MedLedger — Hospital Claims & Billing Domain Types
 *
 * Defines contracts, models, lifecycle states, and aggregations for
 * private pharmacy reimbursement claims submitted to DHQ Hospital Kohat.
 */

import { ClaimStatus, ClaimItemStatus, ClaimApprovalAction } from '@/core/database/schema-types';

export type { ClaimStatus, ClaimItemStatus, ClaimApprovalAction };

export interface ClaimItemDetail {
  id: string;
  claim_id: string;
  dispensing_record_id: string;
  dispensing_item_id: string;
  medicine_id: string;
  quantity: number;
  unit_rate: number;
  total_amount: number;
  status: ClaimItemStatus;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  // Traceability enrichment
  dispensing_number: string;
  dispensed_at: string;
  dispensed_by_name: string;
  prescription_id: string;
  prescription_number: string;
  patient_id: string;
  patient_name: string;
  mr_number: string;
  admission_id?: string | null;
  admission_number?: string | null;
  ward?: string | null;
  bed_number?: string | null;
  medicine_name: string;
  strength: string;
  dosage_form: string;
  batch_number: string;
  expiry_date: string;
}

export interface ClaimApprovalDetail {
  id: string;
  claim_id: string;
  action: ClaimApprovalAction;
  approved_by: string;
  approved_by_name: string;
  approved_amount: number;
  comments: string | null;
  approved_at: string;
}

export interface ClaimPaymentDetail {
  id: string;
  claim_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string | null;
  received_by: string;
  received_by_name: string;
  notes?: string | null;
  created_at: string;
}

export interface ClaimWithDetails {
  id: string;
  claim_number: string;
  claim_period_start: string;
  claim_period_end: string;
  total_amount: number;
  approved_amount: number;
  paid_amount: number;
  outstanding_balance: number;
  status: ClaimStatus;
  submitted_by: string | null;
  submitted_by_name: string | null;
  submitted_at: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  items: ClaimItemDetail[];
  approvals: ClaimApprovalDetail[];
  payments: ClaimPaymentDetail[];
  total_items: number;
  patient_count: number;
  dispensing_count: number;
}

export interface EligibleDispensingItem {
  dispensing_record_id: string;
  dispensing_number: string;
  dispensing_item_id: string;
  dispensed_at: string;
  dispensed_by_name: string;
  prescription_id: string;
  prescription_number: string;
  patient_id: string;
  patient_name: string;
  mr_number: string;
  admission_id?: string | null;
  admission_number?: string | null;
  ward?: string | null;
  bed_number?: string | null;
  medicine_id: string;
  medicine_name: string;
  strength: string;
  dosage_form: string;
  batch_number: string;
  expiry_date: string;
  quantity_dispensed: number;
  already_claimed_quantity: number;
  claimable_quantity: number;
  unit_rate: number;
  total_claimable_amount: number;
}

export interface CreateClaimItemInput {
  dispensing_item_id: string;
  quantity: number;
  unit_rate?: number;
}

export interface CreateClaimInput {
  claim_period_start: string;
  claim_period_end: string;
  status?: 'draft' | 'submitted';
  notes?: string | null;
  items: CreateClaimItemInput[];
}

export interface SubmitClaimInput {
  claim_id: string;
}

export interface ReviewClaimItemInput {
  claim_item_id: string;
  status: ClaimItemStatus;
  rejection_reason?: string | null;
}

export interface ReviewClaimInput {
  claim_id: string;
  action: ClaimApprovalAction;
  approved_amount: number;
  comments: string;
  item_reviews?: ReviewClaimItemInput[];
}

export interface RecordClaimPaymentInput {
  claim_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string | null;
  notes?: string | null;
}

export interface ClaimFilterParams {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedClaimsResult {
  claims: ClaimWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLiveDatabase: boolean;
}

export interface ClaimOverviewKPIs {
  total_claims_count: number;
  submitted_claims_count: number;
  under_review_count: number;
  approved_claims_count: number;
  total_submitted_amount: number;
  total_approved_amount: number;
  total_reimbursement_collected: number;
  total_outstanding_balance: number;
  rejected_claims_count: number;
}
