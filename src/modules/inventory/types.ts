/**
 * MedLedger — Inventory & Stock Ledger Domain Types
 *
 * Defines batch records, immutable stock movements, inventory alerts,
 * adjustments, and warehouse surveillance summaries for DHQ Hospital Kohat.
 */

import { Medicine } from '@/modules/medicines/types';

export type BatchStatus = 'available' | 'quarantined' | 'expired' | 'recalled' | 'depleted';

export type MovementType = 'receipt' | 'dispensing' | 'adjustment' | 'return' | 'expired_write_off';

export type ReferenceType =
  | 'inventory_adjustment'
  | 'manual_correction'
  | 'quarantine'
  | 'expired_write_off'
  | 'opening_balance'
  | 'goods_receipt'
  | 'goods_receipt_item'
  | 'dispensing_item';

export type AdjustmentReason =
  | 'count_discrepancy'
  | 'damage'
  | 'breakage'
  | 'expired'
  | 'quarantine'
  | 'audit_reconciliation'
  | 'opening_balance';

export interface MedicineBatch {
  id: string;
  medicine_id: string;
  batch_number: string;
  expiry_date: string; // YYYY-MM-DD
  quantity_on_hand: number;
  quantity_received: number;
  unit_cost: number;
  supplier_id?: string | null;
  goods_receipt_item_id?: string | null;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
  medicine?: Medicine;
}

export interface StockMovement {
  id: string;
  medicine_batch_id: string;
  movement_type: MovementType;
  quantity: number; // positive for addition, negative for deduction
  reference_type: ReferenceType;
  reference_id: string;
  reason?: string | null;
  performed_by: string;
  performed_by_name?: string;
  performed_at: string;
  batch_number?: string;
  medicine_id?: string;
  medicine_name?: string;
  strength?: string;
  dosage_form?: string;
  previous_balance?: number;
  new_balance?: number;
}

export type AlertType = 'out_of_stock' | 'low_stock' | 'near_expiry' | 'expired' | 'quarantined';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface InventoryAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  medicine_id: string;
  medicine_name: string;
  strength: string;
  dosage_form: string;
  batch_id?: string;
  batch_number?: string;
  current_quantity: number;
  threshold?: number;
  expiry_date?: string;
  days_until_expiry?: number;
  message: string;
}

export interface InventoryOverviewSummary {
  total_medicines: number;
  total_batches: number;
  total_units_on_hand: number;
  available_units: number;
  quarantined_units: number;
  expired_units: number;
  low_stock_medicines_count: number;
  out_of_stock_medicines_count: number;
  near_expiry_batches_count: number;
  expired_batches_count: number;
  estimated_stock_value_pkr: number;
  isLiveDatabase: boolean;
}

export interface BatchFilters {
  search?: string;
  medicine_id?: string;
  status?: 'all' | BatchStatus;
  expiry_window?: 'all' | 'expired' | 'near_expiry' | 'valid';
  page?: number;
  pageSize?: number;
}

export interface MovementFilters {
  search?: string;
  medicine_id?: string;
  batch_id?: string;
  movement_type?: 'all' | MovementType;
  reference_type?: 'all' | ReferenceType;
  page?: number;
  pageSize?: number;
}

export interface StockAdjustmentInput {
  batch_id: string;
  adjustment_type: 'increase' | 'decrease' | 'quarantine' | 'write_off';
  quantity: number;
  reason: AdjustmentReason;
  notes: string;
  idempotency_key: string;
}

export interface CreateOpeningBatchInput {
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  unit_cost: number;
  supplier_name?: string;
  notes?: string;
}

export interface ReceiveGoodsBatchInput {
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  quantity_accepted: number;
  unit_cost: number;
  supplier_id: string;
  goods_receipt_id: string;
  goods_receipt_item_id?: string | null;
  grn_number: string;
  notes?: string;
  idempotency_key: string;
}

export interface DispenseBatchStockInput {
  batch_id: string;
  quantity: number;
  dispensing_record_id: string;
  dispensing_item_id: string;
  dispensing_number: string;
  prescription_number: string;
  notes?: string;
  idempotency_key: string;
}

export interface ReverseDispensedStockInput {
  batch_id: string;
  quantity: number;
  dispensing_record_id: string;
  dispensing_item_id: string;
  dispensing_number: string;
  reason: string;
}
