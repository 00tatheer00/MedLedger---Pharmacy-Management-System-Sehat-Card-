/**
 * MedLedger — Reporting & Audit Domain Types
 *
 * Exact report definitions, column schemas, and filter parameters
 * for operational and financial reports at DHQ Hospital Kohat.
 */

export type ReportCategory = 'operational' | 'financial';

export type OperationalReportId =
  | 'stock_overview'
  | 'low_stock'
  | 'expiring_batches'
  | 'goods_received'
  | 'dispensing_history'
  | 'prescription_summary';

export type FinancialReportId =
  | 'supplier_payables'
  | 'supplier_payments'
  | 'claims_by_status'
  | 'approved_claims'
  | 'claim_payments'
  | 'payment_allocations'
  | 'reconciliation_audit'
  | 'financial_transactions';

export type ReportId = OperationalReportId | FinancialReportId;

export interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'date' | 'badge';
}

export interface ReportSummaryStat {
  label: string;
  value: string | number;
  format?: 'text' | 'number' | 'currency';
}

export interface ReportMetadata {
  id: ReportId;
  title: string;
  category: ReportCategory;
  description: string;
  requiredPermission?: string;
  columns: ReportColumn[];
}

export interface ReportFilterParams {
  date_from?: string;
  date_to?: string;
  status?: string;
  search?: string;
  supplier_id?: string;
  medicine_id?: string;
  expiry_window_days?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReportRow = Record<string, any>;

export interface ReportExecutionResult {
  metadata: ReportMetadata;
  filters: ReportFilterParams;
  generated_at: string;
  generated_by: string;
  total_records: number;
  summary_stats: ReportSummaryStat[];
  rows: ReportRow[];
}
