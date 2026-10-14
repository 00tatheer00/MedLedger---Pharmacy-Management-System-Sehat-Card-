/**
 * MedLedger — Finance, Payments & Reconciliation Domain Types
 *
 * Exact decimal financial records for supplier payables, hospital claim receivables,
 * payment allocations, reconciliation audits, and unified cash flow transactions.
 */

export type TransactionFlowType = 'disbursement' | 'receipt';

export interface FinancialPositionKPIs {
  total_payables: number;
  total_receivables: number;
  total_disbursed: number;
  total_reimbursements_collected: number;
  net_financial_position: number;
  pending_invoices_count: number;
  pending_claims_count: number;
}

export interface SupplierPayableSummary {
  id: string;
  invoice_number: string;
  supplier_id: string;
  supplier_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  outstanding_balance: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'disputed' | 'cancelled';
  grn_number?: string | null;
  po_number?: string | null;
  notes?: string | null;
}

export interface HospitalReceivableSummary {
  id: string;
  claim_number: string;
  claim_period_start: string;
  claim_period_end: string;
  total_amount: number;
  approved_amount: number;
  paid_amount: number;
  outstanding_balance: number;
  status: string;
  reconciliation_status:
    'fully_collected' | 'partially_collected' | 'uncollected' | 'pending_review';
  patient_count: number;
  dispensing_count: number;
}

export interface FinancialTransaction {
  id: string;
  transaction_type: TransactionFlowType;
  voucher_or_ref: string;
  transaction_date: string;
  counterparty: string;
  counterparty_type: 'supplier' | 'hospital_treasury';
  amount: number;
  payment_method: string;
  reference_number?: string | null;
  operator_name: string;
  created_at: string;
  notes?: string | null;
}

export type ReconciliationStatus =
  'fully_allocated' | 'partially_allocated' | 'unallocated' | 'discrepancy';

export interface ReconciliationItem {
  id: string;
  reference: string;
  flow_type: 'supplier_payment' | 'hospital_claim_receipt';
  transaction_date: string;
  counterparty: string;
  recorded_amount: number;
  allocated_amount: number;
  unallocated_amount: number;
  status: ReconciliationStatus;
  discrepancy_details?: string | null;
}

export interface ReconciliationAuditReport {
  audit_date: string;
  audited_by: string;
  total_transactions_analyzed: number;
  fully_allocated_count: number;
  partially_allocated_count: number;
  unallocated_count: number;
  discrepancy_count: number;
  total_unallocated_amount: number;
  items: ReconciliationItem[];
  is_healthy: boolean;
}

export interface FinanceOverviewFilterParams {
  date_from?: string;
  date_to?: string;
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}
