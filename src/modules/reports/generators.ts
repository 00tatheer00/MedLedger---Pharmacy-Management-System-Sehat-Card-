/**
 * MedLedger — Authoritative Report Generators
 *
 * Implements authoritative extraction and decimal aggregation for 6 Operational Reports
 * and 8 Financial Reports from live domain stores.
 */

import { addMoney, multiplyMoney, subtractMoney } from '@/lib/decimal';
import { medicineStore } from '@/modules/medicines/prototype-store';
import { inventoryStore } from '@/modules/inventory/prototype-store';
import { purchasingStore } from '@/modules/purchasing/prototype-store';
import { dispensingStore } from '@/modules/dispensing/prototype-store';
import { prescriptionStore } from '@/modules/prescriptions/prototype-store';
import { claimsStore } from '@/modules/claims/prototype-store';
import { financeStore } from '@/modules/finance/prototype-store';
import {
  ReportId,
  ReportMetadata,
  ReportFilterParams,
  ReportExecutionResult,
  ReportRow,
} from './types';

// ==========================================
// Report Metadata Registry
// ==========================================

export const REPORT_REGISTRY: Record<ReportId, ReportMetadata> = {
  // Operational Reports
  stock_overview: {
    id: 'stock_overview',
    title: 'Current Stock Overview',
    category: 'operational',
    description:
      'Central dispensary active stock on hand, unit costs, and total valuation across catalogue medicines.',
    columns: [
      { key: 'medicine_name', label: 'Medicine Name', align: 'left' },
      { key: 'generic_name', label: 'Generic Formula', align: 'left' },
      { key: 'category', label: 'Category', align: 'left' },
      { key: 'dosage_form', label: 'Dosage Form', align: 'left' },
      { key: 'quantity_on_hand', label: 'Total Stock', align: 'right', format: 'number' },
      { key: 'unit_cost', label: 'Unit Cost (PKR)', align: 'right', format: 'currency' },
      { key: 'total_valuation', label: 'Valuation (PKR)', align: 'right', format: 'currency' },
      { key: 'status', label: 'Status', align: 'center', format: 'badge' },
    ],
  },
  low_stock: {
    id: 'low_stock',
    title: 'Low-Stock Medicines',
    category: 'operational',
    description:
      'Medicines where current stock on hand has fallen below the designated minimum reorder threshold.',
    columns: [
      { key: 'medicine_name', label: 'Medicine Name', align: 'left' },
      { key: 'dosage_form', label: 'Dosage Form', align: 'left' },
      { key: 'quantity_on_hand', label: 'Current Stock', align: 'right', format: 'number' },
      { key: 'min_reorder_level', label: 'Min Reorder Level', align: 'right', format: 'number' },
      { key: 'deficit', label: 'Deficit Units', align: 'right', format: 'number' },
      { key: 'urgency', label: 'Urgency Level', align: 'center', format: 'badge' },
    ],
  },
  expiring_batches: {
    id: 'expiring_batches',
    title: 'Expiring & Expired Batches',
    category: 'operational',
    description:
      'Medicine batches approaching shelf-life expiration (within 30/60/90 days) or already expired.',
    columns: [
      { key: 'batch_number', label: 'Batch No.', align: 'left' },
      { key: 'medicine_name', label: 'Medicine Name', align: 'left' },
      { key: 'expiry_date', label: 'Expiry Date', align: 'center', format: 'date' },
      { key: 'days_remaining', label: 'Days Remaining', align: 'right', format: 'number' },
      { key: 'quantity_on_hand', label: 'Stock On Hand', align: 'right', format: 'number' },
      { key: 'status', label: 'Batch Status', align: 'center', format: 'badge' },
    ],
  },
  goods_received: {
    id: 'goods_received',
    title: 'Goods Receiving History',
    category: 'operational',
    description:
      'Consignments accepted at the central pharmacy receiving bay with inspection outcomes and delivery challans.',
    columns: [
      { key: 'grn_number', label: 'GRN No.', align: 'left' },
      { key: 'received_date', label: 'Received Date', align: 'center', format: 'date' },
      { key: 'supplier_name', label: 'Supplier', align: 'left' },
      { key: 'po_number', label: 'PO Ref.', align: 'left' },
      { key: 'delivery_challan', label: 'Challan / DC', align: 'left' },
      { key: 'accepted_quantity', label: 'Accepted Units', align: 'right', format: 'number' },
      { key: 'rejected_quantity', label: 'Rejected Units', align: 'right', format: 'number' },
      { key: 'received_by', label: 'Received By', align: 'left' },
    ],
  },
  dispensing_history: {
    id: 'dispensing_history',
    title: 'Dispensing Audit History',
    category: 'operational',
    description:
      'Clinical dispensing events with ward, bed, patient MRN, prescription linkage, and pharmacist signatures.',
    columns: [
      { key: 'dispensing_number', label: 'Dispense No.', align: 'left' },
      { key: 'dispensed_at', label: 'Dispensed Date', align: 'center', format: 'date' },
      { key: 'patient_name', label: 'Patient Name', align: 'left' },
      { key: 'mr_number', label: 'MRN', align: 'left' },
      { key: 'ward', label: 'Ward / Bed', align: 'left' },
      { key: 'total_items', label: 'Items', align: 'right', format: 'number' },
      { key: 'total_amount', label: 'Total Value (PKR)', align: 'right', format: 'currency' },
      { key: 'dispensed_by', label: 'Pharmacist', align: 'left' },
      { key: 'status', label: 'Status', align: 'center', format: 'badge' },
    ],
  },
  prescription_summary: {
    id: 'prescription_summary',
    title: 'Prescription Dispensing Summaries',
    category: 'operational',
    description:
      'Inpatient and outpatient prescriptions with fulfilment progress and physician details.',
    columns: [
      { key: 'prescription_number', label: 'Prescription No.', align: 'left' },
      { key: 'prescription_date', label: 'Prescribed Date', align: 'center', format: 'date' },
      { key: 'patient_name', label: 'Patient Name', align: 'left' },
      { key: 'prescriber_name', label: 'Prescriber', align: 'left' },
      { key: 'ward', label: 'Ward', align: 'left' },
      { key: 'total_items', label: 'Items Prescribed', align: 'right', format: 'number' },
      { key: 'status', label: 'Fulfilment Status', align: 'center', format: 'badge' },
    ],
  },

  // Financial Reports
  supplier_payables: {
    id: 'supplier_payables',
    title: 'Supplier Payables & Invoices',
    category: 'financial',
    description:
      'Approved vendor invoices, payments settled to date, and outstanding payable obligations.',
    columns: [
      { key: 'invoice_number', label: 'Invoice No.', align: 'left' },
      { key: 'supplier_name', label: 'Supplier', align: 'left' },
      { key: 'invoice_date', label: 'Invoice Date', align: 'center', format: 'date' },
      { key: 'due_date', label: 'Due Date', align: 'center', format: 'date' },
      { key: 'total_amount', label: 'Total (PKR)', align: 'right', format: 'currency' },
      { key: 'paid_amount', label: 'Paid (PKR)', align: 'right', format: 'currency' },
      {
        key: 'outstanding_balance',
        label: 'Outstanding (PKR)',
        align: 'right',
        format: 'currency',
      },
      { key: 'status', label: 'Status', align: 'center', format: 'badge' },
    ],
  },
  supplier_payments: {
    id: 'supplier_payments',
    title: 'Supplier Payment History',
    category: 'financial',
    description:
      'Disbursements released to pharmaceutical distributors against verified delivery consignments.',
    columns: [
      { key: 'voucher_number', label: 'Voucher No.', align: 'left' },
      { key: 'payment_date', label: 'Payment Date', align: 'center', format: 'date' },
      { key: 'supplier_name', label: 'Supplier', align: 'left' },
      { key: 'amount', label: 'Amount (PKR)', align: 'right', format: 'currency' },
      { key: 'payment_method', label: 'Method', align: 'left' },
      { key: 'reference_number', label: 'Reference / Chq No.', align: 'left' },
      { key: 'approved_by', label: 'Authorized Officer', align: 'left' },
    ],
  },
  claims_by_status: {
    id: 'claims_by_status',
    title: 'Hospital Claims by Status',
    category: 'financial',
    description:
      'Summary breakdown of healthcare reimbursement claims submitted to DHQ Kohat administration by status.',
    columns: [
      { key: 'status_label', label: 'Claim Status', align: 'left' },
      { key: 'claim_count', label: 'Total Claims', align: 'right', format: 'number' },
      { key: 'total_submitted', label: 'Submitted (PKR)', align: 'right', format: 'currency' },
      { key: 'total_approved', label: 'Approved (PKR)', align: 'right', format: 'currency' },
      { key: 'total_collected', label: 'Collected (PKR)', align: 'right', format: 'currency' },
      {
        key: 'outstanding_receivable',
        label: 'Outstanding (PKR)',
        align: 'right',
        format: 'currency',
      },
    ],
  },
  approved_claims: {
    id: 'approved_claims',
    title: 'Approved Claims & Outstanding Receivables',
    category: 'financial',
    description:
      'Claims reviewed and approved by hospital administration, tracking outstanding treasury reimbursements.',
    columns: [
      { key: 'claim_number', label: 'Claim No.', align: 'left' },
      { key: 'claim_period', label: 'Claim Period', align: 'center' },
      { key: 'total_amount', label: 'Submitted (PKR)', align: 'right', format: 'currency' },
      { key: 'approved_amount', label: 'Approved (PKR)', align: 'right', format: 'currency' },
      { key: 'paid_amount', label: 'Collected (PKR)', align: 'right', format: 'currency' },
      {
        key: 'outstanding_balance',
        label: 'Outstanding (PKR)',
        align: 'right',
        format: 'currency',
      },
      { key: 'status', label: 'Status', align: 'center', format: 'badge' },
    ],
  },
  claim_payments: {
    id: 'claim_payments',
    title: 'Hospital Payment Receipts',
    category: 'financial',
    description:
      'Direct reimbursement receipts received from District Treasury / Hospital finance against approved claims.',
    columns: [
      { key: 'receipt_id', label: 'Receipt Ref.', align: 'left' },
      { key: 'payment_date', label: 'Date', align: 'center', format: 'date' },
      { key: 'claim_number', label: 'Claim Ref.', align: 'left' },
      { key: 'amount', label: 'Amount Received (PKR)', align: 'right', format: 'currency' },
      { key: 'payment_method', label: 'Payment Method', align: 'left' },
      { key: 'reference_number', label: 'Treasury Transaction Ref.', align: 'left' },
      { key: 'received_by', label: 'Received By', align: 'left' },
    ],
  },
  payment_allocations: {
    id: 'payment_allocations',
    title: 'Payment Allocation Breakdown',
    category: 'financial',
    description: 'Audit trace of payment vouchers allocated against specific supplier invoices.',
    columns: [
      { key: 'payment_voucher', label: 'Payment Voucher', align: 'left' },
      { key: 'supplier_name', label: 'Supplier', align: 'left' },
      { key: 'invoice_number', label: 'Allocated Invoice', align: 'left' },
      {
        key: 'allocated_amount',
        label: 'Allocated Amount (PKR)',
        align: 'right',
        format: 'currency',
      },
      { key: 'allocated_date', label: 'Date Allocated', align: 'center', format: 'date' },
    ],
  },
  reconciliation_audit: {
    id: 'reconciliation_audit',
    title: 'Reconciliation Discrepancy Audit',
    category: 'financial',
    description:
      'Detailed analysis of payment allocations, highlighting fully matched transactions, unallocated sums, and discrepancies.',
    columns: [
      { key: 'reference', label: 'Reference No.', align: 'left' },
      { key: 'flow_type', label: 'Transaction Type', align: 'left' },
      { key: 'transaction_date', label: 'Date', align: 'center', format: 'date' },
      { key: 'counterparty', label: 'Counterparty', align: 'left' },
      { key: 'recorded_amount', label: 'Recorded (PKR)', align: 'right', format: 'currency' },
      { key: 'allocated_amount', label: 'Allocated (PKR)', align: 'right', format: 'currency' },
      { key: 'unallocated_amount', label: 'Unallocated (PKR)', align: 'right', format: 'currency' },
      { key: 'status', label: 'Reconciliation Status', align: 'center', format: 'badge' },
      { key: 'discrepancy_details', label: 'Discrepancy Notes', align: 'left' },
    ],
  },
  financial_transactions: {
    id: 'financial_transactions',
    title: 'Financial Transaction Cash Flow History',
    category: 'financial',
    description:
      'Chronological unified ledger of all disbursements (supplier payments) and receipts (claim reimbursements).',
    columns: [
      { key: 'transaction_date', label: 'Date', align: 'center', format: 'date' },
      { key: 'transaction_type', label: 'Flow Type', align: 'center', format: 'badge' },
      { key: 'voucher_or_ref', label: 'Voucher / Ref', align: 'left' },
      { key: 'counterparty', label: 'Counterparty', align: 'left' },
      { key: 'amount', label: 'Amount (PKR)', align: 'right', format: 'currency' },
      { key: 'payment_method', label: 'Method', align: 'left' },
      { key: 'reference_number', label: 'Tx Reference', align: 'left' },
      { key: 'operator_name', label: 'Recorded By', align: 'left' },
    ],
  },
};

// ==========================================
// Generator Functions
// ==========================================

export class ReportGenerator {
  public static generate(
    reportId: ReportId,
    filters: ReportFilterParams = {},
    actorName: string = 'Authorized Staff',
  ): ReportExecutionResult {
    const metadata = REPORT_REGISTRY[reportId];
    if (!metadata) {
      throw new Error(`Report "${reportId}" is not recognized.`);
    }

    let rows: ReportRow[] = [];
    const summaryStats: {
      label: string;
      value: string | number;
      format?: 'text' | 'number' | 'currency';
    }[] = [];

    switch (reportId) {
      // 1. Stock Overview
      case 'stock_overview': {
        const medicines = medicineStore.getAllRawMedicines().filter((m) => !m.deleted_at);
        const batches = inventoryStore.getBatches({ pageSize: 1000 }).batches;

        let totalUnits = 0;
        let totalValuation = 0;

        rows = medicines.map((med) => {
          const medBatches = batches.filter((b) => b.medicine_id === med.id);
          const stock = medBatches.reduce((acc, b) => acc + b.quantity_on_hand, 0);
          const unitCost = medBatches.length > 0 ? medBatches[0].unit_cost : 0;
          const valuation = multiplyMoney(unitCost, stock);

          totalUnits += stock;
          totalValuation = addMoney(totalValuation, valuation);

          return {
            medicine_name: med.name,
            generic_name: med.generic_name,
            category: med.category,
            dosage_form: med.dosage_form,
            quantity_on_hand: stock,
            unit_cost: unitCost,
            total_valuation: valuation,
            status:
              stock === 0
                ? 'Out of Stock'
                : stock <= (med.min_threshold ?? 20)
                  ? 'Low Stock'
                  : 'Adequate',
          };
        });

        if (filters.search) {
          const q = filters.search.toLowerCase();
          rows = rows.filter(
            (r) =>
              r.medicine_name.toLowerCase().includes(q) ||
              r.generic_name.toLowerCase().includes(q) ||
              r.category.toLowerCase().includes(q),
          );
        }

        summaryStats.push(
          { label: 'Total Tracked Medicines', value: rows.length, format: 'number' },
          { label: 'Total Units on Hand', value: totalUnits, format: 'number' },
          { label: 'Total Inventory Valuation', value: totalValuation, format: 'currency' },
        );
        break;
      }

      // 2. Low Stock
      case 'low_stock': {
        const medicines = medicineStore.getAllRawMedicines().filter((m) => !m.deleted_at);
        const batches = inventoryStore.getBatches({ pageSize: 1000 }).batches;

        const lowStockMeds: ReportRow[] = [];

        for (const med of medicines) {
          const medBatches = batches.filter((b) => b.medicine_id === med.id);
          const stock = medBatches.reduce((acc, b) => acc + b.quantity_on_hand, 0);
          const threshold = med.min_threshold ?? 20;

          if (stock <= threshold) {
            const deficit = Math.max(0, threshold - stock);
            lowStockMeds.push({
              medicine_name: med.name,
              dosage_form: med.dosage_form,
              quantity_on_hand: stock,
              min_reorder_level: threshold,
              deficit,
              urgency: stock === 0 ? 'CRITICAL (Depleted)' : 'WARNING (Below Min)',
            });
          }
        }

        rows = lowStockMeds;
        summaryStats.push(
          { label: 'Low-Stock Medicines Count', value: rows.length, format: 'number' },
          {
            label: 'Completely Depleted Count',
            value: rows.filter((r) => r.quantity_on_hand === 0).length,
            format: 'number',
          },
        );
        break;
      }

      // 3. Expiring Batches
      case 'expiring_batches': {
        const batches = inventoryStore.getBatches({ pageSize: 1000 }).batches;
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);

        rows = batches.map((b) => {
          const expDate = new Date(b.expiry_date);
          const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

          let status = 'Available';
          if (diffDays <= 0 || b.expiry_date <= todayStr) {
            status = 'EXPIRED';
          } else if (diffDays <= 30) {
            status = 'Critical (< 30d)';
          } else if (diffDays <= 90) {
            status = 'Expiring (< 90d)';
          }

          return {
            batch_number: b.batch_number,
            medicine_name: b.medicine?.name || 'Registered Item',
            expiry_date: b.expiry_date,
            days_remaining: diffDays,
            quantity_on_hand: b.quantity_on_hand,
            status,
          };
        });

        // Filter to expiring (<= 90 days or expired)
        rows = rows.filter((r) => r.days_remaining <= 90 || r.status === 'EXPIRED');

        summaryStats.push(
          { label: 'Total Batches in Window', value: rows.length, format: 'number' },
          {
            label: 'Already Expired Count',
            value: rows.filter((r) => r.status === 'EXPIRED').length,
            format: 'number',
          },
        );
        break;
      }

      // 4. Goods Received
      case 'goods_received': {
        const grns = purchasingStore.getGoodsReceipts({ pageSize: 1000 }).receipts;

        let totalAccepted = 0;
        let totalRejected = 0;

        rows = grns.map((g) => {
          const accepted = g.items.reduce((acc, it) => acc + it.quantity_accepted, 0);
          const rejected = g.items.reduce((acc, it) => acc + it.quantity_rejected, 0);
          totalAccepted += accepted;
          totalRejected += rejected;

          return {
            grn_number: g.grn_number,
            received_date: g.received_date,
            supplier_name: g.supplier_name,
            po_number: g.purchase_order_number || 'N/A',
            delivery_challan: g.delivery_challan_number || 'N/A',
            accepted_quantity: accepted,
            rejected_quantity: rejected,
            received_by: g.received_by_name || 'Pharmacist',
          };
        });

        if (filters.date_from) rows = rows.filter((r) => r.received_date >= filters.date_from!);
        if (filters.date_to) rows = rows.filter((r) => r.received_date <= filters.date_to!);

        summaryStats.push(
          { label: 'Total Consignments', value: rows.length, format: 'number' },
          { label: 'Total Units Accepted', value: totalAccepted, format: 'number' },
          { label: 'Total Units Rejected', value: totalRejected, format: 'number' },
        );
        break;
      }

      // 5. Dispensing History
      case 'dispensing_history': {
        const dispRes = dispensingStore.getDispensingRecords({ pageSize: 1000 });
        let totalDispensedValue = 0;

        rows = dispRes.records.map((d) => {
          totalDispensedValue = addMoney(totalDispensedValue, d.total_amount);
          return {
            dispensing_number: d.dispensing_number,
            dispensed_at: d.dispensed_at.slice(0, 10),
            patient_name: d.patient_name,
            mr_number: d.mr_number,
            ward: `${d.ward}${d.bed_number ? ' / ' + d.bed_number : ''}`,
            total_items: d.total_items,
            total_amount: d.total_amount,
            dispensed_by: d.dispensed_by_name,
            status: d.status,
          };
        });

        if (filters.date_from) rows = rows.filter((r) => r.dispensed_at >= filters.date_from!);
        if (filters.date_to) rows = rows.filter((r) => r.dispensed_at <= filters.date_to!);

        summaryStats.push(
          { label: 'Total Dispensing Vouchers', value: rows.length, format: 'number' },
          { label: 'Total Value Dispensed', value: totalDispensedValue, format: 'currency' },
        );
        break;
      }

      // 6. Prescription Summary
      case 'prescription_summary': {
        const rxs = prescriptionStore.getAll();

        rows = rxs.map((rx) => ({
          prescription_number: rx.prescription_number,
          prescription_date: rx.prescription_date,
          patient_name: rx.patient?.full_name || 'Inpatient',
          prescriber_name: rx.prescriber_name,
          ward: rx.admission?.ward || 'OPD',
          total_items: rx.items.length,
          status: rx.status,
        }));

        if (filters.date_from) rows = rows.filter((r) => r.prescription_date >= filters.date_from!);
        if (filters.date_to) rows = rows.filter((r) => r.prescription_date <= filters.date_to!);

        summaryStats.push(
          { label: 'Total Prescriptions', value: rows.length, format: 'number' },
          {
            label: 'Fully Dispensed Count',
            value: rows.filter((r) => r.status === 'fully_dispensed').length,
            format: 'number',
          },
        );
        break;
      }

      // 7. Supplier Payables
      case 'supplier_payables': {
        const payables = financeStore.getSupplierPayables(filters);

        let sumTotal = 0;
        let sumPaid = 0;
        let sumOutstanding = 0;

        rows = payables.map((p) => {
          sumTotal = addMoney(sumTotal, p.total_amount);
          sumPaid = addMoney(sumPaid, p.paid_amount);
          sumOutstanding = addMoney(sumOutstanding, p.outstanding_balance);

          return {
            invoice_number: p.invoice_number,
            supplier_name: p.supplier_name,
            invoice_date: p.invoice_date,
            due_date: p.due_date,
            total_amount: p.total_amount,
            paid_amount: p.paid_amount,
            outstanding_balance: p.outstanding_balance,
            status: p.status,
          };
        });

        summaryStats.push(
          { label: 'Total Invoices', value: rows.length, format: 'number' },
          { label: 'Total Invoiced Amount', value: sumTotal, format: 'currency' },
          { label: 'Total Settled Amount', value: sumPaid, format: 'currency' },
          { label: 'Total Outstanding Payables', value: sumOutstanding, format: 'currency' },
        );
        break;
      }

      // 8. Supplier Payments
      case 'supplier_payments': {
        const payments = purchasingStore.getSupplierPayments();
        let sumPaid = 0;

        rows = payments.map((sp) => {
          sumPaid = addMoney(sumPaid, sp.amount);
          return {
            voucher_number: sp.payment_voucher_number,
            payment_date: sp.payment_date,
            supplier_name: sp.supplier_name || 'Registered Supplier',
            amount: sp.amount,
            payment_method: sp.payment_method,
            reference_number: sp.reference_number || 'N/A',
            approved_by: sp.approved_by_name || 'Finance Officer',
          };
        });

        if (filters.date_from) rows = rows.filter((r) => r.payment_date >= filters.date_from!);
        if (filters.date_to) rows = rows.filter((r) => r.payment_date <= filters.date_to!);

        summaryStats.push(
          { label: 'Total Payment Vouchers', value: rows.length, format: 'number' },
          { label: 'Total Amount Disbursed', value: sumPaid, format: 'currency' },
        );
        break;
      }

      // 9. Claims by Status
      case 'claims_by_status': {
        const claims = claimsStore.getClaims({ pageSize: 1000 }).claims;
        const statusMap = new Map<
          string,
          { count: number; submitted: number; approved: number; collected: number; balance: number }
        >();

        const allStatuses = [
          'draft',
          'submitted',
          'under_review',
          'approved',
          'partially_approved',
          'partially_paid',
          'paid',
          'rejected',
        ];
        allStatuses.forEach((s) => {
          statusMap.set(s, { count: 0, submitted: 0, approved: 0, collected: 0, balance: 0 });
        });

        claims.forEach((c) => {
          const entry = statusMap.get(c.status) || {
            count: 0,
            submitted: 0,
            approved: 0,
            collected: 0,
            balance: 0,
          };
          entry.count++;
          entry.submitted = addMoney(entry.submitted, c.total_amount);
          entry.approved = addMoney(entry.approved, c.approved_amount);
          entry.collected = addMoney(entry.collected, c.paid_amount);
          entry.balance = addMoney(entry.balance, c.outstanding_balance);
          statusMap.set(c.status, entry);
        });

        let totalSubmitted = 0;
        let totalApproved = 0;
        let totalCollected = 0;

        rows = Array.from(statusMap.entries())
          .filter(([, stats]) => stats.count > 0)
          .map(([status, stats]) => {
            totalSubmitted = addMoney(totalSubmitted, stats.submitted);
            totalApproved = addMoney(totalApproved, stats.approved);
            totalCollected = addMoney(totalCollected, stats.collected);

            return {
              status_label: status.replace(/_/g, ' ').toUpperCase(),
              claim_count: stats.count,
              total_submitted: stats.submitted,
              total_approved: stats.approved,
              total_collected: stats.collected,
              outstanding_receivable: stats.balance,
            };
          });

        summaryStats.push(
          { label: 'Total Submitted', value: totalSubmitted, format: 'currency' },
          { label: 'Total Approved', value: totalApproved, format: 'currency' },
          { label: 'Total Collected', value: totalCollected, format: 'currency' },
        );
        break;
      }

      // 10. Approved Claims & Outstanding Receivables
      case 'approved_claims': {
        const receivables = financeStore.getHospitalReceivables(filters);
        const approvedList = receivables.filter((r) =>
          ['approved', 'partially_approved', 'partially_paid', 'paid'].includes(r.status),
        );

        let sumApproved = 0;
        let sumCollected = 0;
        let sumOutstanding = 0;

        rows = approvedList.map((c) => {
          sumApproved = addMoney(sumApproved, c.approved_amount);
          sumCollected = addMoney(sumCollected, c.paid_amount);
          sumOutstanding = addMoney(sumOutstanding, c.outstanding_balance);

          return {
            claim_number: c.claim_number,
            claim_period: `${c.claim_period_start} to ${c.claim_period_end}`,
            total_amount: c.total_amount,
            approved_amount: c.approved_amount,
            paid_amount: c.paid_amount,
            outstanding_balance: c.outstanding_balance,
            status: c.status,
          };
        });

        summaryStats.push(
          { label: 'Approved Claims Count', value: rows.length, format: 'number' },
          { label: 'Total Approved', value: sumApproved, format: 'currency' },
          { label: 'Total Reimbursements Collected', value: sumCollected, format: 'currency' },
          { label: 'Total Outstanding Receivables', value: sumOutstanding, format: 'currency' },
        );
        break;
      }

      // 11. Claim Payments
      case 'claim_payments': {
        const claims = claimsStore.getClaims({ pageSize: 1000 }).claims;
        let totalReceived = 0;

        rows = [];
        claims.forEach((c) => {
          (c.payments || []).forEach((p) => {
            totalReceived = addMoney(totalReceived, p.amount);
            rows.push({
              receipt_id: p.id,
              payment_date: p.payment_date,
              claim_number: c.claim_number,
              amount: p.amount,
              payment_method: p.payment_method,
              reference_number: p.reference_number || 'N/A',
              received_by: p.received_by_name || 'Finance Officer',
            });
          });
        });

        if (filters.date_from) rows = rows.filter((r) => r.payment_date >= filters.date_from!);
        if (filters.date_to) rows = rows.filter((r) => r.payment_date <= filters.date_to!);

        summaryStats.push(
          { label: 'Receipt Vouchers Count', value: rows.length, format: 'number' },
          { label: 'Total Reimbursement Received', value: totalReceived, format: 'currency' },
        );
        break;
      }

      // 12. Payment Allocations
      case 'payment_allocations': {
        const supplierPayments = purchasingStore.getSupplierPayments();

        rows = [];
        let totalAllocated = 0;

        supplierPayments.forEach((sp) => {
          (sp.allocations || []).forEach((alloc) => {
            totalAllocated = addMoney(totalAllocated, alloc.amount_allocated);
            rows.push({
              payment_voucher: sp.payment_voucher_number,
              supplier_name: sp.supplier_name || 'Registered Supplier',
              invoice_number: alloc.invoice_number,
              allocated_amount: alloc.amount_allocated,
              allocated_date: alloc.allocated_at.slice(0, 10),
            });
          });
        });

        summaryStats.push(
          { label: 'Total Allocation Lines', value: rows.length, format: 'number' },
          { label: 'Total Amount Allocated', value: totalAllocated, format: 'currency' },
        );
        break;
      }

      // 13. Reconciliation Discrepancy Audit
      case 'reconciliation_audit': {
        const audit = financeStore.runReconciliationAudit();

        rows = audit.items.map((it) => ({
          reference: it.reference,
          flow_type:
            it.flow_type === 'supplier_payment' ? 'Supplier Disbursement' : 'Claim Reimbursement',
          transaction_date: it.transaction_date,
          counterparty: it.counterparty,
          recorded_amount: it.recorded_amount,
          allocated_amount: it.allocated_amount,
          unallocated_amount: it.unallocated_amount,
          status: it.status,
          discrepancy_details: it.discrepancy_details || 'Verified Matched',
        }));

        summaryStats.push(
          {
            label: 'Total Transactions Audited',
            value: audit.total_transactions_analyzed,
            format: 'number',
          },
          { label: 'Fully Matched Count', value: audit.fully_allocated_count, format: 'number' },
          { label: 'Discrepancy Count', value: audit.discrepancy_count, format: 'number' },
          {
            label: 'Total Unallocated Amount',
            value: audit.total_unallocated_amount,
            format: 'currency',
          },
        );
        break;
      }

      // 14. Financial Transactions Cash Flow History
      case 'financial_transactions': {
        const txs = financeStore.getFinancialTransactions(filters);

        let totalDisbursements = 0;
        let totalReceipts = 0;

        rows = txs.map((tx) => {
          if (tx.transaction_type === 'disbursement') {
            totalDisbursements = addMoney(totalDisbursements, tx.amount);
          } else {
            totalReceipts = addMoney(totalReceipts, tx.amount);
          }

          return {
            transaction_date: tx.transaction_date,
            transaction_type:
              tx.transaction_type === 'disbursement'
                ? 'Outflow (Disbursement)'
                : 'Inflow (Receipt)',
            voucher_or_ref: tx.voucher_or_ref,
            counterparty: tx.counterparty,
            amount: tx.amount,
            payment_method: tx.payment_method,
            reference_number: tx.reference_number || 'N/A',
            operator_name: tx.operator_name,
          };
        });

        const netPosition = subtractMoney(totalReceipts, totalDisbursements);

        summaryStats.push(
          { label: 'Total Outflows (Disbursed)', value: totalDisbursements, format: 'currency' },
          { label: 'Total Inflows (Collected)', value: totalReceipts, format: 'currency' },
          { label: 'Net Position', value: netPosition, format: 'currency' },
        );
        break;
      }
    }

    return {
      metadata,
      filters,
      generated_at: new Date().toISOString(),
      generated_by: actorName,
      total_records: rows.length,
      summary_stats: summaryStats,
      rows,
    };
  }
}
