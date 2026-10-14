/**
 * MedLedger — Supabase Database TypeScript Schema Types
 *
 * Strongly-typed definitions matching the 28 relational tables defined
 * in supabase/migrations/20261013000001_core_schema.sql.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Gender = 'male' | 'female' | 'other';
export type AdmissionStatus = 'admitted' | 'discharged' | 'transferred' | 'cancelled';
export type PrescriptionStatus =
  'pending' | 'partially_dispensed' | 'fully_dispensed' | 'cancelled';
export type BatchStatus = 'available' | 'quarantined' | 'expired' | 'recalled' | 'depleted';
export type StockMovementType =
  'receipt' | 'dispensing' | 'adjustment' | 'return' | 'expired_write_off';
export type StockReferenceType =
  'dispensing_item' | 'goods_receipt_item' | 'inventory_adjustment' | 'manual_correction';
export type PurchaseOrderStatus =
  'draft' | 'submitted' | 'partially_received' | 'fully_received' | 'cancelled';
export type SupplierInvoiceStatus =
  'pending' | 'partially_paid' | 'paid' | 'disputed' | 'cancelled';
export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'returned'
  | 'partially_paid'
  | 'paid'
  | 'cancelled';
export type ClaimItemStatus = 'pending' | 'approved' | 'rejected';
export type ClaimApprovalAction = 'approved' | 'partially_approved' | 'rejected' | 'returned';
export type NotificationType =
  'low_stock' | 'expiry_alert' | 'approval_needed' | 'payment_due' | 'system';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by: string | null;
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  description: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
}

export interface Patient {
  id: string;
  mr_number: string;
  full_name: string;
  father_name: string | null;
  cnic: string | null;
  date_of_birth: string | null;
  gender: Gender;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Admission {
  id: string;
  patient_id: string;
  admission_number: string;
  admission_date: string;
  discharge_date: string | null;
  ward: string;
  bed_number: string | null;
  attending_doctor: string | null;
  status: AdmissionStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Medicine {
  id: string;
  item_code: string | null;
  name: string;
  generic_name: string;
  dosage_form: string;
  strength: string;
  unit_of_measure: string;
  category: string;
  min_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MedicineBatch {
  id: string;
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  quantity_on_hand: number;
  quantity_received: number;
  unit_cost: number;
  supplier_id: string | null;
  goods_receipt_item_id: string | null;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  medicine_batch_id: string;
  movement_type: StockMovementType;
  quantity: number;
  reference_type: StockReferenceType;
  reference_id: string;
  reason: string | null;
  performed_by: string;
  performed_at: string;
}

export interface Prescription {
  id: string;
  prescription_number: string;
  patient_id: string;
  admission_id: string | null;
  prescriber_name: string;
  prescription_date: string;
  status: PrescriptionStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_id: string;
  prescribed_quantity: number;
  dispensed_quantity: number;
  dosage_instructions: string | null;
  status: PrescriptionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DispensingRecord {
  id: string;
  dispensing_number: string;
  prescription_id: string;
  dispensed_by: string;
  dispensed_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DispensingItem {
  id: string;
  dispensing_record_id: string;
  prescription_item_id: string;
  medicine_batch_id: string;
  dispensed_medicine_id: string;
  quantity_dispensed: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  ntn_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: PurchaseOrderStatus;
  total_amount: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  medicine_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface GoodsReceipt {
  id: string;
  grn_number: string;
  purchase_order_id: string | null;
  supplier_id: string;
  received_date: string;
  received_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoodsReceiptItem {
  id: string;
  goods_receipt_id: string;
  purchase_order_item_id: string | null;
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

export interface SupplierInvoice {
  id: string;
  invoice_number: string;
  supplier_id: string;
  goods_receipt_id: string | null;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: SupplierInvoiceStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SupplierPayment {
  id: string;
  payment_voucher_number: string;
  supplier_id: string;
  supplier_invoice_id: string | null;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  approved_by: string;
  created_at: string;
}

export interface Claim {
  id: string;
  claim_number: string;
  claim_period_start: string;
  claim_period_end: string;
  total_amount: number;
  approved_amount: number;
  status: ClaimStatus;
  submitted_by: string | null;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ClaimItem {
  id: string;
  claim_id: string;
  dispensing_record_id: string;
  dispensing_item_id: string;
  medicine_id: string;
  quantity: number;
  unit_rate: number;
  total_amount: number;
  status: ClaimItemStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimApproval {
  id: string;
  claim_id: string;
  action: ClaimApprovalAction;
  approved_by: string;
  approved_amount: number;
  comments: string | null;
  approved_at: string;
}

export interface ClaimPayment {
  id: string;
  claim_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  received_by: string;
  notes: string | null;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  action: string;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: Json;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}
