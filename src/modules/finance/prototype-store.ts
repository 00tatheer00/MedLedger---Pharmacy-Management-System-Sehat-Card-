/**
 * MedLedger — Finance & Reconciliation Prototype Store
 *
 * Provides a unified facade over supplier payables (from purchasingStore)
 * and hospital receivables (from claimsStore) without creating duplicate
 * tables or parallel accounting data.
 */

import { purchasingStore } from '@/modules/purchasing/prototype-store';
import { claimsStore } from '@/modules/claims/prototype-store';
import { addMoney, subtractMoney } from '@/lib/decimal';
import { RecordSupplierPaymentInput, SupplierInvoiceFilters } from '@/modules/purchasing/types';
import { RecordClaimPaymentInput, ClaimFilterParams } from '@/modules/claims/types';
import {
  FinancialPositionKPIs,
  SupplierPayableSummary,
  HospitalReceivableSummary,
  FinancialTransaction,
  ReconciliationAuditReport,
  FinanceOverviewFilterParams,
} from './types';
import { ReconciliationEngine } from './reconciliation';

export class FinancePrototypeStore {
  /**
   * Computes authoritative high-level financial KPIs.
   */
  public getFinancialKPIs(): FinancialPositionKPIs {
    const invoicesRes = purchasingStore.getSupplierInvoices({ pageSize: 1000 });
    const invoices = invoicesRes.invoices;

    let totalPayables = 0;
    let pendingInvoicesCount = 0;

    for (const inv of invoices) {
      if (inv.status !== 'cancelled') {
        totalPayables = addMoney(totalPayables, inv.outstanding_balance);
        if (inv.outstanding_balance > 0) {
          pendingInvoicesCount++;
        }
      }
    }

    const claimsKPIs = claimsStore.getOverviewKPIs();
    const supplierPayments = purchasingStore.getSupplierPayments();

    let totalDisbursed = 0;
    for (const sp of supplierPayments) {
      totalDisbursed = addMoney(totalDisbursed, sp.amount);
    }

    const totalCollected = claimsKPIs.total_reimbursement_collected;
    const totalReceivables = claimsKPIs.total_outstanding_balance;
    const netPosition = subtractMoney(totalCollected, totalDisbursed);

    return {
      total_payables: totalPayables,
      total_receivables: totalReceivables,
      total_disbursed: totalDisbursed,
      total_reimbursements_collected: totalCollected,
      net_financial_position: netPosition,
      pending_invoices_count: pendingInvoicesCount,
      pending_claims_count: claimsKPIs.approved_claims_count,
    };
  }

  /**
   * Returns list of supplier payables with status and balance.
   */
  public getSupplierPayables(filters: FinanceOverviewFilterParams = {}): SupplierPayableSummary[] {
    const res = purchasingStore.getSupplierInvoices({
      search: filters.search,
      status: (filters.status as SupplierInvoiceFilters['status']) || 'all',
      pageSize: 1000,
    });

    let list: SupplierPayableSummary[] = res.invoices.map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      supplier_id: inv.supplier_id,
      supplier_name: inv.supplier_name || 'Registered Supplier',
      invoice_date: inv.invoice_date,
      due_date: inv.due_date,
      total_amount: inv.total_amount,
      paid_amount: inv.paid_amount,
      outstanding_balance: inv.outstanding_balance,
      status: inv.status,
      grn_number: inv.grn_number,
      po_number: inv.po_number,
      notes: inv.notes,
    }));

    if (filters.date_from) {
      list = list.filter((inv) => inv.invoice_date >= filters.date_from!);
    }
    if (filters.date_to) {
      list = list.filter((inv) => inv.invoice_date <= filters.date_to!);
    }

    return list;
  }

  /**
   * Returns list of hospital claim receivables with approval status.
   */
  public getHospitalReceivables(
    filters: FinanceOverviewFilterParams = {},
  ): HospitalReceivableSummary[] {
    const res = claimsStore.getClaims({
      search: filters.search,
      status: (filters.status as ClaimFilterParams['status']) || 'all',
      date_from: filters.date_from,
      date_to: filters.date_to,
      pageSize: 1000,
    });

    return res.claims.map((c) => {
      let reconciliationStatus: HospitalReceivableSummary['reconciliation_status'] = 'uncollected';
      if (['paid'].includes(c.status)) {
        reconciliationStatus = 'fully_collected';
      } else if (['partially_paid'].includes(c.status)) {
        reconciliationStatus = 'partially_collected';
      } else if (['draft', 'submitted', 'under_review'].includes(c.status)) {
        reconciliationStatus = 'pending_review';
      }

      return {
        id: c.id,
        claim_number: c.claim_number,
        claim_period_start: c.claim_period_start,
        claim_period_end: c.claim_period_end,
        total_amount: c.total_amount,
        approved_amount: c.approved_amount,
        paid_amount: c.paid_amount,
        outstanding_balance: c.outstanding_balance,
        status: c.status,
        reconciliation_status: reconciliationStatus,
        patient_count: c.patient_count,
        dispensing_count: c.dispensing_count,
      };
    });
  }

  /**
   * Returns a unified chronological cash flow ledger (disbursements vs receipts).
   */
  public getFinancialTransactions(
    filters: FinanceOverviewFilterParams = {},
  ): FinancialTransaction[] {
    const transactions: FinancialTransaction[] = [];

    // 1. Supplier payment disbursements (Outflows)
    const supplierPayments = purchasingStore.getSupplierPayments();
    for (const sp of supplierPayments) {
      transactions.push({
        id: `tx-sp-${sp.id}`,
        transaction_type: 'disbursement',
        voucher_or_ref: sp.payment_voucher_number,
        transaction_date: sp.payment_date,
        counterparty: sp.supplier_name || 'Registered Supplier',
        counterparty_type: 'supplier',
        amount: sp.amount,
        payment_method: sp.payment_method,
        reference_number: sp.reference_number,
        operator_name: sp.approved_by_name || 'Finance Officer',
        created_at: sp.created_at,
        notes: sp.notes,
      });
    }

    // 2. Hospital reimbursement receipts (Inflows)
    const claimsRes = claimsStore.getClaims({ pageSize: 1000 });
    for (const c of claimsRes.claims) {
      for (const p of c.payments || []) {
        transactions.push({
          id: `tx-cp-${p.id}`,
          transaction_type: 'receipt',
          voucher_or_ref: p.reference_number || `REC-${c.claim_number}`,
          transaction_date: p.payment_date,
          counterparty: 'DHQ Kohat Treasury',
          counterparty_type: 'hospital_treasury',
          amount: p.amount,
          payment_method: p.payment_method,
          reference_number: p.reference_number,
          operator_name: p.received_by_name || 'Finance Officer',
          created_at: p.created_at,
          notes: p.notes,
        });
      }
    }

    // Sort chronologically descending
    transactions.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

    let filtered = transactions;
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (tx) =>
          tx.voucher_or_ref.toLowerCase().includes(q) ||
          tx.counterparty.toLowerCase().includes(q) ||
          (tx.reference_number && tx.reference_number.toLowerCase().includes(q)),
      );
    }
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((tx) => tx.transaction_type === filters.status);
    }
    if (filters.date_from) {
      filtered = filtered.filter((tx) => tx.transaction_date >= filters.date_from!);
    }
    if (filters.date_to) {
      filtered = filtered.filter((tx) => tx.transaction_date <= filters.date_to!);
    }

    return filtered;
  }

  /**
   * Executes an authoritative reconciliation audit.
   */
  public runReconciliationAudit(
    auditorName: string = 'Dr. Tariq Khan (Audit Officer)',
  ): ReconciliationAuditReport {
    const payments = purchasingStore.getSupplierPayments();
    const invoices = purchasingStore.getSupplierInvoices({ pageSize: 1000 }).invoices;
    const claims = claimsStore.getClaims({ pageSize: 1000 }).claims;

    return ReconciliationEngine.generateAuditReport(payments, invoices, claims, auditorName);
  }

  /**
   * Records supplier payment through the authoritative purchasingStore.
   */
  public recordSupplierPayment(
    input: RecordSupplierPaymentInput,
    actor: { id: string; name: string },
  ) {
    return purchasingStore.recordSupplierPayment(input, actor);
  }

  /**
   * Records hospital claim receipt through the authoritative claimsStore.
   */
  public recordClaimReceipt(input: RecordClaimPaymentInput, actor: { id: string; name: string }) {
    return claimsStore.recordPayment(input, actor);
  }
}

export const financeStore = new FinancePrototypeStore();
