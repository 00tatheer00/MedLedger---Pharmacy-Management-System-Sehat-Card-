/**
 * MedLedger — Finance & Reconciliation Server Queries
 *
 * Executes PostgreSQL queries against live Supabase database when configured,
 * or safely uses prototype store in development environment.
 * In staging and production tiers, missing database or query failures throw immediately (fail-closed).
 */

import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { financeStore } from './prototype-store';
import {
  FinancialPositionKPIs,
  SupplierPayableSummary,
  HospitalReceivableSummary,
  FinancialTransaction,
  ReconciliationAuditReport,
  ReconciliationItem,
  ReconciliationStatus,
  FinanceOverviewFilterParams,
} from './types';

export async function fetchFinancialKPIs(): Promise<FinancialPositionKPIs> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const [invRes, claimsRes, paymentsRes, claimPaymentsRes] = await Promise.all([
        supabase
          .from('supplier_invoices')
          .select('total_amount, paid_amount, status')
          .is('deleted_at', null),
        supabase
          .from('claims')
          .select('total_amount, approved_amount, status')
          .is('deleted_at', null),
        supabase.from('supplier_payments').select('amount'),
        supabase.from('claim_payments').select('amount'),
      ]);

      if (invRes.error) {
        throw new Error(`Database error fetching invoice KPIs: ${invRes.error.message}`);
      }
      if (claimsRes.error) {
        throw new Error(`Database error fetching claims KPIs: ${claimsRes.error.message}`);
      }
      if (paymentsRes.error) {
        throw new Error(`Database error fetching payments KPIs: ${paymentsRes.error.message}`);
      }
      if (claimPaymentsRes.error) {
        throw new Error(
          `Database error fetching claim payments KPIs: ${claimPaymentsRes.error.message}`,
        );
      }

      type InvoiceRow = {
        total_amount: number | string;
        paid_amount: number | string;
        status: string;
      };
      type ClaimRow = {
        total_amount: number | string;
        approved_amount: number | string | null;
        status: string;
      };
      type PaymentRow = { amount: number | string };

      let totalPayables = 0;
      let pendingInvoicesCount = 0;
      ((invRes.data || []) as unknown as InvoiceRow[]).forEach((inv) => {
        if (inv.status !== 'cancelled') {
          const tot = Number(inv.total_amount || 0);
          const paid = Number(inv.paid_amount || 0);
          const balance = Math.max(0, tot - paid);
          totalPayables += balance;
          if (balance > 0) pendingInvoicesCount++;
        }
      });

      let totalDisbursed = 0;
      ((paymentsRes.data || []) as unknown as PaymentRow[]).forEach((p) => {
        totalDisbursed += Number(p.amount || 0);
      });

      let totalCollected = 0;
      ((claimPaymentsRes.data || []) as unknown as PaymentRow[]).forEach((cp) => {
        totalCollected += Number(cp.amount || 0);
      });

      let totalReceivables = 0;
      let pendingClaimsCount = 0;
      ((claimsRes.data || []) as unknown as ClaimRow[]).forEach((c) => {
        if (!['rejected', 'cancelled'].includes(c.status)) {
          const target =
            c.approved_amount !== null ? Number(c.approved_amount) : Number(c.total_amount || 0);
          totalReceivables += target;
          if (['submitted', 'under_review', 'partially_approved', 'approved'].includes(c.status)) {
            pendingClaimsCount++;
          }
        }
      });

      const netReceivables = Math.max(0, totalReceivables - totalCollected);
      const netPosition = totalCollected - totalDisbursed;

      return {
        total_payables: totalPayables,
        total_receivables: netReceivables,
        total_disbursed: totalDisbursed,
        total_reimbursements_collected: totalCollected,
        net_financial_position: netPosition,
        pending_invoices_count: pendingInvoicesCount,
        pending_claims_count: pendingClaimsCount,
      };
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return financeStore.getFinancialKPIs();
}

export async function fetchSupplierPayables(
  filters: FinanceOverviewFilterParams = {},
): Promise<SupplierPayableSummary[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      let query = supabase
        .from('supplier_invoices')
        .select('*, supplier:suppliers(name)')
        .is('deleted_at', null)
        .order('invoice_date', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('invoice_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('invoice_date', filters.date_to);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(`Database error fetching supplier payables: ${error.message}`);
      }

      type InvoiceJoinRow = {
        id: string;
        invoice_number: string;
        supplier_id: string;
        invoice_date: string;
        due_date: string;
        total_amount: number | string;
        paid_amount: number | string;
        status: SupplierPayableSummary['status'];
        grn_id?: string | null;
        purchase_order_id?: string | null;
        notes?: string | null;
        supplier?: { name?: string } | null;
      };

      const rows: SupplierPayableSummary[] = ((data || []) as unknown as InvoiceJoinRow[]).map(
        (inv) => {
          const tot = Number(inv.total_amount || 0);
          const paid = Number(inv.paid_amount || 0);
          return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            supplier_id: inv.supplier_id,
            supplier_name: inv.supplier?.name || 'Registered Supplier',
            invoice_date: inv.invoice_date,
            due_date: inv.due_date,
            total_amount: tot,
            paid_amount: paid,
            outstanding_balance: Math.max(0, tot - paid),
            status: inv.status,
            grn_number: inv.grn_id || null,
            po_number: inv.purchase_order_id || null,
            notes: inv.notes || null,
          };
        },
      );

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        return rows.filter(
          (inv) =>
            inv.invoice_number.toLowerCase().includes(q) ||
            inv.supplier_name.toLowerCase().includes(q) ||
            (inv.notes && inv.notes.toLowerCase().includes(q)),
        );
      }

      return rows;
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return financeStore.getSupplierPayables(filters);
}

export async function fetchHospitalReceivables(
  filters: FinanceOverviewFilterParams = {},
): Promise<HospitalReceivableSummary[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      let query = supabase
        .from('claims')
        .select(
          'id, claim_number, claim_period_start, claim_period_end, total_amount, approved_amount, status, payments:claim_payments(amount)',
        )
        .is('deleted_at', null)
        .order('claim_period_start', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('claim_period_start', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('claim_period_end', filters.date_to);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(`Database error fetching hospital receivables: ${error.message}`);
      }

      type ClaimReceivableRow = {
        id: string;
        claim_number: string;
        claim_period_start: string;
        claim_period_end: string;
        total_amount: number | string;
        approved_amount: number | string | null;
        status: string;
        payments?: Array<{ amount: number | string }>;
      };

      const rows: HospitalReceivableSummary[] = (
        (data || []) as unknown as ClaimReceivableRow[]
      ).map((c) => {
        const totalAmt = Number(c.total_amount || 0);
        const approvedAmt = c.approved_amount !== null ? Number(c.approved_amount) : totalAmt;
        const paidAmt = (c.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const outstanding = Math.max(0, approvedAmt - paidAmt);

        let reconciliationStatus: HospitalReceivableSummary['reconciliation_status'] =
          'uncollected';
        if (c.status === 'paid') {
          reconciliationStatus = 'fully_collected';
        } else if (c.status === 'partially_paid') {
          reconciliationStatus = 'partially_collected';
        } else if (['draft', 'submitted', 'under_review'].includes(c.status)) {
          reconciliationStatus = 'pending_review';
        }

        return {
          id: c.id,
          claim_number: c.claim_number,
          claim_period_start: c.claim_period_start,
          claim_period_end: c.claim_period_end,
          total_amount: totalAmt,
          approved_amount: approvedAmt,
          paid_amount: paidAmt,
          outstanding_balance: outstanding,
          status: c.status,
          reconciliation_status: reconciliationStatus,
          patient_count: 0,
          dispensing_count: 0,
        };
      });

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        return rows.filter((c) => c.claim_number.toLowerCase().includes(q));
      }

      return rows;
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return financeStore.getHospitalReceivables(filters);
}

export async function fetchFinancialTransactions(
  filters: FinanceOverviewFilterParams = {},
): Promise<FinancialTransaction[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const [supplierPaymentsRes, claimPaymentsRes] = await Promise.all([
        supabase
          .from('supplier_payments')
          .select('*, supplier:suppliers(name)')
          .order('payment_date', { ascending: false }),
        supabase
          .from('claim_payments')
          .select('*, claim:claims(claim_number)')
          .order('payment_date', { ascending: false }),
      ]);

      if (supplierPaymentsRes.error) {
        throw new Error(
          `Database error fetching supplier payments: ${supplierPaymentsRes.error.message}`,
        );
      }
      if (claimPaymentsRes.error) {
        throw new Error(
          `Database error fetching claim payments: ${claimPaymentsRes.error.message}`,
        );
      }

      type SupplierPaymentRow = {
        id: string;
        payment_date: string;
        amount: number | string;
        payment_method: string;
        payment_voucher_number: string;
        reference_number: string | null;
        notes: string | null;
        created_at: string;
        supplier?: { name?: string } | null;
      };

      type ClaimPaymentRow = {
        id: string;
        payment_date: string;
        amount: number | string;
        reference_number: string | null;
        payment_method?: string;
        notes: string | null;
        created_at: string;
        claim?: { claim_number?: string } | null;
      };

      const transactions: FinancialTransaction[] = [];

      ((supplierPaymentsRes.data || []) as unknown as SupplierPaymentRow[]).forEach((sp) => {
        transactions.push({
          id: `tx-sp-${sp.id}`,
          transaction_type: 'disbursement',
          voucher_or_ref:
            sp.payment_voucher_number || sp.reference_number || `PV-${sp.id.slice(0, 8)}`,
          transaction_date: sp.payment_date,
          counterparty: sp.supplier?.name || 'Registered Supplier',
          counterparty_type: 'supplier',
          amount: Number(sp.amount || 0),
          payment_method: sp.payment_method || 'Cheque',
          reference_number: sp.reference_number,
          operator_name: 'Finance Officer',
          created_at: sp.created_at || new Date().toISOString(),
          notes: sp.notes,
        });
      });

      ((claimPaymentsRes.data || []) as unknown as ClaimPaymentRow[]).forEach((cp) => {
        transactions.push({
          id: `tx-cp-${cp.id}`,
          transaction_type: 'receipt',
          voucher_or_ref:
            cp.reference_number || `REC-${cp.claim?.claim_number || cp.id.slice(0, 8)}`,
          transaction_date: cp.payment_date,
          counterparty: 'DHQ Kohat Treasury',
          counterparty_type: 'hospital_treasury',
          amount: Number(cp.amount || 0),
          payment_method: cp.payment_method || 'Treasury Transfer',
          reference_number: cp.reference_number,
          operator_name: 'Finance Officer',
          created_at: cp.created_at || new Date().toISOString(),
          notes: cp.notes,
        });
      });

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
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return financeStore.getFinancialTransactions(filters);
}

export async function fetchReconciliationAudit(): Promise<ReconciliationAuditReport> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase.from('v_financial_reconciliation').select('*');

      if (error) {
        throw new Error(`Database error querying financial reconciliation view: ${error.message}`);
      }

      if (data) {
        type ReconRow = {
          flow_type: 'supplier_payment' | 'hospital_claim_receipt';
          transaction_id: string;
          reference_number: string;
          transaction_date: string;
          counterparty_name: string;
          recorded_amount: number | string;
          allocated_amount: number | string;
          unallocated_amount: number | string;
          reconciliation_status: string;
        };

        const rows = data as unknown as ReconRow[];
        let fullyAllocated = 0;
        let partiallyAllocated = 0;
        let unallocated = 0;
        let discrepancyCount = 0;
        let totalUnallocated = 0;

        const items: ReconciliationItem[] = rows.map((r) => {
          const recAmt = Number(r.recorded_amount || 0);
          const allocAmt = Number(r.allocated_amount || 0);
          const unallocAmt = Number(r.unallocated_amount || 0);

          let status: ReconciliationStatus = 'unallocated';
          let details: string | null = null;

          if (r.reconciliation_status === 'fully_allocated') {
            status = 'fully_allocated';
            fullyAllocated++;
          } else if (r.reconciliation_status === 'partially_allocated') {
            status = 'partially_allocated';
            partiallyAllocated++;
            totalUnallocated += Math.abs(unallocAmt);
          } else if (r.reconciliation_status === 'unallocated') {
            status = 'unallocated';
            unallocated++;
            totalUnallocated += Math.abs(unallocAmt);
          } else {
            status = 'discrepancy';
            discrepancyCount++;
            totalUnallocated += Math.abs(unallocAmt);
            details = `Anomaly status: ${r.reconciliation_status}`;
          }

          return {
            id: r.transaction_id,
            reference: r.reference_number,
            flow_type: r.flow_type,
            transaction_date: r.transaction_date,
            counterparty: r.counterparty_name,
            recorded_amount: recAmt,
            allocated_amount: allocAmt,
            unallocated_amount: unallocAmt,
            status,
            discrepancy_details: details,
          };
        });

        return {
          audit_date: new Date().toISOString(),
          audited_by: 'PostgreSQL Real-Time Automated Audit',
          total_transactions_analyzed: items.length,
          fully_allocated_count: fullyAllocated,
          partially_allocated_count: partiallyAllocated,
          unallocated_count: unallocated,
          discrepancy_count: discrepancyCount,
          total_unallocated_amount: totalUnallocated,
          items,
          is_healthy: discrepancyCount === 0 && unallocated === 0,
        };
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return financeStore.runReconciliationAudit();
}
