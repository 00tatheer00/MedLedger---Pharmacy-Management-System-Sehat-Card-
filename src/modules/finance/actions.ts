'use server';

/**
 * MedLedger — Finance & Reconciliation Server Actions
 *
 * Implements server-side actions for supplier payments, hospital reimbursement receipts,
 * reconciliation audits, and cash flow queries with strict RBAC & audit logging.
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/core/auth';
import { requirePermission, hasRole } from '@/core/authorization';
import { auditLogger } from '@/core/audit';
import {
  recordSupplierPaymentSchema,
  recordHospitalReceiptSchema,
  financeFilterSchema,
  RecordSupplierPaymentFormData,
  RecordHospitalReceiptFormData,
} from './validation';
import { financeStore } from './prototype-store';
import {
  fetchFinancialKPIs,
  fetchSupplierPayables,
  fetchHospitalReceivables,
  fetchFinancialTransactions,
  fetchReconciliationAudit,
} from './server-queries';
import {
  FinancialPositionKPIs,
  SupplierPayableSummary,
  HospitalReceivableSummary,
  FinancialTransaction,
  ReconciliationAuditReport,
  FinanceOverviewFilterParams,
} from './types';

// ==========================================
// 1. Fetch Financial KPIs Action
// ==========================================

export async function getFinancialKPIsAction(): Promise<{
  success: boolean;
  data?: FinancialPositionKPIs;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized: Session required.' };

    const data = await fetchFinancialKPIs();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch financial KPIs';
    return { success: false, error: message };
  }
}

// ==========================================
// 2. Fetch Supplier Payables Action
// ==========================================

export async function getSupplierPayablesAction(
  filters: FinanceOverviewFilterParams = {},
): Promise<{
  success: boolean;
  data?: SupplierPayableSummary[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized: Session required.' };

    const parsedFilters = financeFilterSchema.parse(filters);
    const data = await fetchSupplierPayables(parsedFilters);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch supplier payables';
    return { success: false, error: message };
  }
}

// ==========================================
// 3. Fetch Hospital Receivables Action
// ==========================================

export async function getHospitalReceivablesAction(
  filters: FinanceOverviewFilterParams = {},
): Promise<{
  success: boolean;
  data?: HospitalReceivableSummary[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized: Session required.' };

    const parsedFilters = financeFilterSchema.parse(filters);
    const data = await fetchHospitalReceivables(parsedFilters);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch hospital receivables';
    return { success: false, error: message };
  }
}

// ==========================================
// 4. Fetch Financial Transactions Action
// ==========================================

export async function getFinancialTransactionsAction(
  filters: FinanceOverviewFilterParams = {},
): Promise<{
  success: boolean;
  data?: FinancialTransaction[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized: Session required.' };

    const parsedFilters = financeFilterSchema.parse(filters);
    const data = await fetchFinancialTransactions(parsedFilters);
    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch financial transactions';
    return { success: false, error: message };
  }
}

// ==========================================
// 5. Run Reconciliation Audit Action
// ==========================================

export async function runReconciliationAuditAction(): Promise<{
  success: boolean;
  data?: ReconciliationAuditReport;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized: Session required.' };

    const data = await fetchReconciliationAudit();

    // Log audit event
    await auditLogger.log({
      eventType: 'reconciliation_audit_executed',
      entityType: 'financial_reconciliation',
      entityId: `recon-${Date.now()}`,
      userId: user.id,
      action: 'reconcile',
      newValues: {
        total_analyzed: data.total_transactions_analyzed,
        discrepancies: data.discrepancy_count,
        unallocated_amount: data.total_unallocated_amount,
        is_healthy: data.is_healthy,
      },
    });

    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to execute reconciliation audit';
    return { success: false, error: message };
  }
}

// ==========================================
// 6. Record Supplier Payment Action
// ==========================================

export async function recordSupplierPaymentAction(
  formData: RecordSupplierPaymentFormData,
): Promise<{
  success: boolean;
  data?: ReturnType<typeof financeStore.recordSupplierPayment>;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized: Session required.' };

    // RBAC: Requires purchasing:manage or finance_staff or system_admin
    const isAuthorized =
      hasRole(user, 'system_admin') ||
      hasRole(user, 'pharmacy_manager') ||
      hasRole(user, 'purchasing_staff') ||
      hasRole(user, 'finance_staff');

    if (!isAuthorized) {
      return {
        success: false,
        error: 'Forbidden: Insufficient privileges to post supplier payments.',
      };
    }

    const validated = recordSupplierPaymentSchema.parse(formData);

    const result = financeStore.recordSupplierPayment(validated, {
      id: user.id,
      name: user.fullName || 'Finance Officer',
    });

    await auditLogger.log({
      eventType: 'supplier_payment_recorded',
      entityType: 'supplier_payments',
      entityId: result.payment.id,
      userId: user.id,
      action: 'create',
      newValues: {
        voucher_number: result.payment.payment_voucher_number,
        supplier_id: validated.supplier_id,
        amount: validated.amount,
        payment_method: validated.payment_method,
        allocations_count: validated.allocations.length,
      },
    });

    revalidatePath('/reports');
    revalidatePath('/purchases');

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record supplier payment';
    return { success: false, error: message };
  }
}

// ==========================================
// 7. Record Hospital Claim Receipt Action
// ==========================================

export async function recordHospitalReceiptAction(
  formData: RecordHospitalReceiptFormData,
): Promise<{
  success: boolean;
  data?: ReturnType<typeof financeStore.recordClaimReceipt>;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'claims:manage');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }
    const actorUser = authCheck.data;

    const validated = recordHospitalReceiptSchema.parse(formData);

    const result = financeStore.recordClaimReceipt(validated, {
      id: actorUser.id,
      name: actorUser.fullName || 'Finance Officer',
    });

    await auditLogger.log({
      eventType: 'claim_payment_recorded',
      entityType: 'claim_payments',
      entityId: result.id,
      userId: actorUser.id,
      action: 'create',
      newValues: {
        claim_id: validated.claim_id,
        amount: validated.amount,
        payment_method: validated.payment_method,
        reference_number: validated.reference_number,
      },
    });

    revalidatePath('/reports');
    revalidatePath('/claims');

    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to record hospital claim receipt';
    return { success: false, error: message };
  }
}
