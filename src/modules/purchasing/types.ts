/**
 * MedLedger — Purchasing Domain Types
 *
 * Defines Purchase Orders (PO), Goods Receipt Notes (GRN), Supplier Invoices,
 * and Multi-Invoice Payment Allocations for DHQ Hospital Kohat.
 */

import { Medicine } from '@/modules/medicines/types';
import { Supplier } from '@/modules/suppliers/types';

// ==========================================
// 1. Purchase Orders
// ==========================================

export type PurchaseOrderStatus =
  'draft' | 'submitted' | 'partially_received' | 'fully_received' | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  medicine_id: string;
  medicine_name?: string;
  generic_name?: string;
  strength?: string;
  dosage_form?: string;
  unit_of_measure?: string;
  quantity_ordered: number;
  quantity_received: number; // Running total of accepted items
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  medicine?: Medicine;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name?: string;
  order_date: string;
  expected_delivery_date?: string | null;
  status: PurchaseOrderStatus;
  total_amount: number;
  notes?: string | null;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  supplier?: Supplier;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderFilters {
  search?: string;
  supplier_id?: string;
  status?: 'all' | PurchaseOrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedPurchaseOrdersResponse {
  orders: PurchaseOrder[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLiveDatabase: boolean;
}

export interface CreatePurchaseOrderItemInput {
  medicine_id: string;
  quantity_ordered: number;
  unit_price: number;
}

export interface CreatePurchaseOrderInput {
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string;
  notes?: string;
  items: CreatePurchaseOrderItemInput[];
}

// ==========================================
// 2. Goods Receipts (GRN)
// ==========================================

export interface GoodsReceiptItem {
  id: string;
  goods_receipt_id: string;
  purchase_order_item_id?: string | null;
  medicine_id: string;
  medicine_name?: string;
  batch_number: string;
  expiry_date: string;
  quantity_received: number; // Total delivered
  quantity_accepted: number; // Accepted into inventory
  quantity_rejected: number; // Rejected (damaged/expired/discrepant)
  rejection_reason?: string | null;
  unit_cost: number;
  total_cost: number; // Accepted * unit_cost
  created_at: string;
}

export interface GoodsReceipt {
  id: string;
  grn_number: string;
  purchase_order_id?: string | null;
  purchase_order_number?: string | null;
  supplier_id: string;
  supplier_name?: string;
  received_date: string;
  received_by: string;
  received_by_name?: string;
  delivery_challan_number?: string | null;
  supplier_invoice_ref?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items: GoodsReceiptItem[];
}

export interface GoodsReceiptFilters {
  search?: string;
  supplier_id?: string;
  purchase_order_id?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedGoodsReceiptsResponse {
  receipts: GoodsReceipt[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLiveDatabase: boolean;
}

export interface ReceiveItemInput {
  purchase_order_item_id?: string;
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  quantity_received: number;
  quantity_accepted: number;
  quantity_rejected?: number;
  rejection_reason?: string;
  unit_cost: number;
}

export interface ReceiveGoodsInput {
  purchase_order_id?: string;
  supplier_id: string;
  received_date: string;
  delivery_challan_number?: string;
  supplier_invoice_ref?: string;
  notes?: string;
  idempotency_key: string;
  create_invoice?: boolean;
  invoice_due_date?: string;
  items: ReceiveItemInput[];
}

// ==========================================
// 3. Supplier Invoices & Payables
// ==========================================

export type SupplierInvoiceStatus =
  'pending' | 'partially_paid' | 'paid' | 'disputed' | 'cancelled';

export interface SupplierInvoice {
  id: string;
  invoice_number: string;
  supplier_id: string;
  supplier_name?: string;
  goods_receipt_id?: string | null;
  grn_number?: string | null;
  purchase_order_id?: string | null;
  po_number?: string | null;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  outstanding_balance: number;
  status: SupplierInvoiceStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface SupplierInvoiceFilters {
  search?: string;
  supplier_id?: string;
  status?: 'all' | SupplierInvoiceStatus;
  page?: number;
  pageSize?: number;
}

export interface PaginatedSupplierInvoicesResponse {
  invoices: SupplierInvoice[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLiveDatabase: boolean;
}

// ==========================================
// 4. Supplier Payments & Allocation
// ==========================================

export interface SupplierPaymentAllocation {
  id: string;
  payment_id: string;
  supplier_invoice_id: string;
  invoice_number: string;
  amount_allocated: number;
  allocated_at: string;
}

export interface SupplierPayment {
  id: string;
  payment_voucher_number: string;
  supplier_id: string;
  supplier_name?: string;
  payment_date: string;
  amount: number;
  payment_method: 'bank_transfer' | 'cheque' | 'cash';
  reference_number?: string | null;
  notes?: string | null;
  approved_by: string;
  approved_by_name?: string;
  created_at: string;
  allocations: SupplierPaymentAllocation[];
}

export interface PaymentAllocationItemInput {
  invoice_id: string;
  amount_allocated: number;
}

export interface RecordSupplierPaymentInput {
  supplier_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'bank_transfer' | 'cheque' | 'cash';
  reference_number?: string;
  notes?: string;
  idempotency_key: string;
  allocations: PaymentAllocationItemInput[];
}
