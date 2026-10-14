/**
 * MedLedger — Payment & Claim Allocation Reconciliation Engine
 *
 * Implements authoritative mathematical checks on all financial transactions:
 * 1. Supplier payment vs invoice allocations.
 * 2. Hospital reimbursement receipts vs approved claims.
 * 3. Identifies fully allocated, partially allocated, unallocated, and discrepancy states.
 * 4. Preserves exact-decimal calculation integrity (no floating-point drift).
 */

import { addMoney, subtractMoney } from '@/lib/decimal';
import { SupplierPayment, SupplierInvoice } from '@/modules/purchasing/types';
import { ClaimWithDetails } from '@/modules/claims/types';
import { ReconciliationItem, ReconciliationAuditReport, ReconciliationStatus } from './types';

export class ReconciliationEngine {
  /**
   * Reconciles all supplier payments against their invoice allocations.
   */
  public static reconcileSupplierPayments(
    payments: SupplierPayment[],
    invoices: SupplierInvoice[],
  ): ReconciliationItem[] {
    const invoiceMap = new Map<string, SupplierInvoice>();
    invoices.forEach((inv) => invoiceMap.set(inv.id, inv));

    return payments.map((payment) => {
      let allocatedTotal = 0;
      let hasInvoiceDiscrepancy = false;
      let discrepancyReason: string | null = null;

      if (payment.allocations && payment.allocations.length > 0) {
        for (const alloc of payment.allocations) {
          allocatedTotal = addMoney(allocatedTotal, alloc.amount_allocated);
          const targetInv = invoiceMap.get(alloc.supplier_invoice_id);

          if (!targetInv) {
            hasInvoiceDiscrepancy = true;
            discrepancyReason = `Allocated to non-existent invoice ID: ${alloc.supplier_invoice_id}`;
            break;
          }

          if (targetInv.paid_amount > targetInv.total_amount) {
            hasInvoiceDiscrepancy = true;
            discrepancyReason = `Invoice ${targetInv.invoice_number} is overpaid (Paid: PKR ${targetInv.paid_amount}, Total: PKR ${targetInv.total_amount})`;
            break;
          }
        }
      }

      const unallocated = Math.max(0, subtractMoney(payment.amount, allocatedTotal));

      let status: ReconciliationStatus;
      if (hasInvoiceDiscrepancy) {
        status = 'discrepancy';
      } else if (allocatedTotal > payment.amount) {
        status = 'discrepancy';
        discrepancyReason = `Over-allocated: Allocations (PKR ${allocatedTotal}) exceed voucher amount (PKR ${payment.amount})`;
      } else if (allocatedTotal === 0) {
        status = 'unallocated';
      } else if (allocatedTotal === payment.amount) {
        status = 'fully_allocated';
      } else {
        status = 'partially_allocated';
      }

      return {
        id: `recon-sp-${payment.id}`,
        reference: payment.payment_voucher_number,
        flow_type: 'supplier_payment',
        transaction_date: payment.payment_date,
        counterparty: payment.supplier_name || 'Registered Supplier',
        recorded_amount: payment.amount,
        allocated_amount: allocatedTotal,
        unallocated_amount: unallocated,
        status,
        discrepancy_details: discrepancyReason,
      };
    });
  }

  /**
   * Reconciles all hospital reimbursement claim receipts.
   */
  public static reconcileClaimReceipts(claims: ClaimWithDetails[]): ReconciliationItem[] {
    const items: ReconciliationItem[] = [];

    for (const claim of claims) {
      if (!claim.payments || claim.payments.length === 0) continue;

      let sumPayments = 0;
      for (const p of claim.payments) {
        sumPayments = addMoney(sumPayments, p.amount);

        let status: ReconciliationStatus = 'fully_allocated';
        let discrepancyReason: string | null = null;

        // Check 1: Claim must be in eligible state
        if (!['approved', 'partially_approved', 'partially_paid', 'paid'].includes(claim.status)) {
          status = 'discrepancy';
          discrepancyReason = `Payment recorded against claim in ineligible status: "${claim.status}"`;
        }

        // Check 2: Payment exceeds approved ceiling
        if (claim.paid_amount > claim.approved_amount) {
          status = 'discrepancy';
          discrepancyReason = `Claim overpaid: Received PKR ${claim.paid_amount} exceeds approved PKR ${claim.approved_amount}`;
        }

        items.push({
          id: `recon-cp-${p.id}`,
          reference: p.reference_number || `REC-${claim.claim_number}`,
          flow_type: 'hospital_claim_receipt',
          transaction_date: p.payment_date,
          counterparty: 'DHQ Kohat Treasury',
          recorded_amount: p.amount,
          allocated_amount: p.amount,
          unallocated_amount: 0,
          status,
          discrepancy_details: discrepancyReason,
        });
      }

      // Check 3: Claim paid_amount equals sum of payments
      if (claim.paid_amount !== sumPayments) {
        items.push({
          id: `recon-clm-sum-${claim.id}`,
          reference: claim.claim_number,
          flow_type: 'hospital_claim_receipt',
          transaction_date: claim.updated_at.slice(0, 10),
          counterparty: 'DHQ Kohat Treasury',
          recorded_amount: claim.paid_amount,
          allocated_amount: sumPayments,
          unallocated_amount: Math.abs(subtractMoney(claim.paid_amount, sumPayments)),
          status: 'discrepancy',
          discrepancy_details: `Claim header paid_amount (PKR ${claim.paid_amount}) does not equal sum of payment records (PKR ${sumPayments})`,
        });
      }
    }

    return items;
  }

  /**
   * Generates a comprehensive audit report over payables and receivables.
   */
  public static generateAuditReport(
    supplierPayments: SupplierPayment[],
    invoices: SupplierInvoice[],
    claims: ClaimWithDetails[],
    auditorName: string = 'Automated System Auditor',
  ): ReconciliationAuditReport {
    const spItems = this.reconcileSupplierPayments(supplierPayments, invoices);
    const cpItems = this.reconcileClaimReceipts(claims);
    const allItems = [...spItems, ...cpItems].sort((a, b) =>
      b.transaction_date.localeCompare(a.transaction_date),
    );

    let fullyCount = 0;
    let partiallyCount = 0;
    let unallocatedCount = 0;
    let discrepancyCount = 0;
    let totalUnallocated = 0;

    for (const item of allItems) {
      if (item.status === 'fully_allocated') fullyCount++;
      if (item.status === 'partially_allocated') partiallyCount++;
      if (item.status === 'unallocated') unallocatedCount++;
      if (item.status === 'discrepancy') discrepancyCount++;

      totalUnallocated = addMoney(totalUnallocated, item.unallocated_amount);
    }

    return {
      audit_date: new Date().toISOString(),
      audited_by: auditorName,
      total_transactions_analyzed: allItems.length,
      fully_allocated_count: fullyCount,
      partially_allocated_count: partiallyCount,
      unallocated_count: unallocatedCount,
      discrepancy_count: discrepancyCount,
      total_unallocated_amount: totalUnallocated,
      items: allItems,
      is_healthy: discrepancyCount === 0,
    };
  }
}
