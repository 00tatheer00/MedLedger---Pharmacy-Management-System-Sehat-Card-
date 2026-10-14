import { describe, it, expect, beforeEach } from 'vitest';
import { financeStore } from './prototype-store';
import { ReconciliationEngine } from './reconciliation';
import { purchasingStore } from '@/modules/purchasing/prototype-store';
import { claimsStore } from '@/modules/claims/prototype-store';
import { SupplierPayment, SupplierInvoice } from '@/modules/purchasing/types';
import { ClaimWithDetails } from '@/modules/claims/types';

describe('Finance & Reconciliation Domain Engine', () => {
  beforeEach(() => {
    purchasingStore.resetForTesting();
    claimsStore.resetForTesting();
  });

  describe('Financial Position KPIs & Balances', () => {
    it('accurately calculates high-level financial position with exact decimal arithmetic', () => {
      const kpis = financeStore.getFinancialKPIs();

      expect(kpis.total_payables).toBeGreaterThan(0);
      expect(kpis.total_receivables).toBeGreaterThan(0);
      expect(kpis.total_disbursed).toBeGreaterThan(0);
      expect(kpis.total_reimbursements_collected).toBeGreaterThan(0);

      // Verify Net Position formula: collected - disbursed
      const expectedNet = kpis.total_reimbursements_collected - kpis.total_disbursed;
      expect(kpis.net_financial_position).toBeCloseTo(expectedNet, 2);
    });

    it('retrieves filterable supplier payables', () => {
      const allPayables = financeStore.getSupplierPayables();
      expect(allPayables.length).toBeGreaterThanOrEqual(3);

      const paidPayables = financeStore.getSupplierPayables({ status: 'paid' });
      expect(paidPayables.every((p) => p.status === 'paid')).toBe(true);

      const pendingPayables = financeStore.getSupplierPayables({ status: 'pending' });
      expect(pendingPayables.every((p) => p.status === 'pending')).toBe(true);
    });

    it('retrieves filterable hospital claim receivables', () => {
      const receivables = financeStore.getHospitalReceivables();
      expect(receivables.length).toBeGreaterThanOrEqual(2);

      const claim1 = receivables.find((r) => r.claim_number === 'CLM-20261011-0001');
      expect(claim1).toBeDefined();
      expect(claim1?.outstanding_balance).toBe(840.0);
      expect(claim1?.reconciliation_status).toBe('partially_collected');
    });

    it('generates unified chronological financial transactions ledger', () => {
      const txs = financeStore.getFinancialTransactions();
      expect(txs.length).toBeGreaterThan(0);

      // Verify both inflows and outflows are present
      const disbursements = txs.filter((t) => t.transaction_type === 'disbursement');
      const receipts = txs.filter((t) => t.transaction_type === 'receipt');

      expect(disbursements.length).toBeGreaterThan(0);
      expect(receipts.length).toBeGreaterThan(0);

      // Verify descending chronological order
      for (let i = 0; i < txs.length - 1; i++) {
        expect(txs[i].transaction_date >= txs[i + 1].transaction_date).toBe(true);
      }
    });
  });

  describe('Transactional Supplier Payment & Claim Receipt Execution', () => {
    it('records a supplier payment and settles outstanding invoice balance', () => {
      const initialInvoices = financeStore.getSupplierPayables();
      const targetInv = initialInvoices.find((i) => i.id === 'inv-002');
      expect(targetInv?.outstanding_balance).toBe(14000.0);

      const result = financeStore.recordSupplierPayment(
        {
          supplier_id: targetInv!.supplier_id,
          payment_date: '2026-10-13',
          amount: 14000.0,
          payment_method: 'bank_transfer',
          reference_number: 'NBP-TX-10092',
          idempotency_key: 'idem-test-pay-14000',
          allocations: [{ invoice_id: 'inv-002', amount_allocated: 14000.0 }],
        },
        { id: 'usr-fin', name: 'Finance Officer' },
      );

      expect(result.payment.amount).toBe(14000.0);
      const updatedInv = financeStore.getSupplierPayables().find((i) => i.id === 'inv-002');
      expect(updatedInv?.outstanding_balance).toBe(0);
      expect(updatedInv?.status).toBe('paid');
    });

    it('rejects duplicate supplier payment submission using idempotency key', () => {
      const payload = {
        supplier_id: 'sup-002',
        payment_date: '2026-10-13',
        amount: 5000.0,
        payment_method: 'cash' as const,
        idempotency_key: 'idem-duplicate-check',
        allocations: [{ invoice_id: 'inv-002', amount_allocated: 5000.0 }],
      };

      financeStore.recordSupplierPayment(payload, { id: 'usr-fin', name: 'Finance Officer' });

      expect(() => {
        financeStore.recordSupplierPayment(payload, { id: 'usr-fin', name: 'Finance Officer' });
      }).toThrow(/Duplicate payment transaction detected/i);
    });

    it('rejects supplier payment allocation that exceeds outstanding balance', () => {
      expect(() => {
        financeStore.recordSupplierPayment(
          {
            supplier_id: 'sup-002',
            payment_date: '2026-10-13',
            amount: 999999.0,
            payment_method: 'bank_transfer',
            idempotency_key: 'idem-excess-test',
            allocations: [{ invoice_id: 'inv-002', amount_allocated: 999999.0 }],
          },
          { id: 'usr-fin', name: 'Finance Officer' },
        );
      }).toThrow(/exceeds outstanding balance/i);
    });

    it('records a hospital claim receipt and updates claim status', () => {
      const claimBefore = financeStore
        .getHospitalReceivables()
        .find((c) => c.id === 'clm-001-kohat');
      expect(claimBefore?.outstanding_balance).toBe(840.0);

      const receipt = financeStore.recordClaimReceipt(
        {
          claim_id: 'clm-001-kohat',
          payment_date: '2026-10-13',
          amount: 840.0,
          payment_method: 'Bank Transfer (DHQ Treasury)',
          reference_number: 'NBP-KOH-FINAL-881',
        },
        { id: 'usr-fin', name: 'Finance Officer' },
      );

      expect(receipt.amount).toBe(840.0);
      const claimAfter = financeStore
        .getHospitalReceivables()
        .find((c) => c.id === 'clm-001-kohat');
      expect(claimAfter?.outstanding_balance).toBe(0);
      expect(claimAfter?.status).toBe('paid');
    });

    it('rejects claim receipt that exceeds approved outstanding balance', () => {
      expect(() => {
        financeStore.recordClaimReceipt(
          {
            claim_id: 'clm-001-kohat',
            payment_date: '2026-10-13',
            amount: 50000.0,
            payment_method: 'Bank Transfer',
          },
          { id: 'usr-fin', name: 'Finance Officer' },
        );
      }).toThrow(/exceeds outstanding balance/i);
    });
  });

  describe('Reconciliation Engine', () => {
    it('correctly matches clean baseline transactions and reports healthy status', () => {
      const report = financeStore.runReconciliationAudit();

      expect(report.total_transactions_analyzed).toBeGreaterThan(0);
      expect(report.fully_allocated_count).toBeGreaterThan(0);
      expect(report.discrepancy_count).toBe(0);
      expect(report.is_healthy).toBe(true);
    });

    it('detects unallocated payment vouchers', () => {
      const mockPayment: SupplierPayment = {
        id: 'sp-unalloc',
        payment_voucher_number: 'PV-UNALLOC-001',
        supplier_id: 'sup-001',
        supplier_name: 'Test Supplier',
        payment_date: '2026-10-10',
        amount: 25000.0,
        payment_method: 'bank_transfer',
        approved_by: 'usr-001',
        created_at: '2026-10-10T10:00:00Z',
        allocations: [], // Zero allocations
      };

      const items = ReconciliationEngine.reconcileSupplierPayments([mockPayment], []);
      expect(items[0].status).toBe('unallocated');
      expect(items[0].unallocated_amount).toBe(25000.0);
    });

    it('detects partially allocated payment vouchers', () => {
      const mockInvoice: SupplierInvoice = {
        id: 'inv-test-1',
        invoice_number: 'INV-TEST-1',
        supplier_id: 'sup-001',
        invoice_date: '2026-10-01',
        due_date: '2026-10-30',
        total_amount: 10000.0,
        paid_amount: 5000.0,
        outstanding_balance: 5000.0,
        status: 'partially_paid',
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
      };

      const mockPayment: SupplierPayment = {
        id: 'sp-part',
        payment_voucher_number: 'PV-PART-002',
        supplier_id: 'sup-001',
        supplier_name: 'Test Supplier',
        payment_date: '2026-10-10',
        amount: 10000.0,
        payment_method: 'cheque',
        approved_by: 'usr-001',
        created_at: '2026-10-10T10:00:00Z',
        allocations: [
          {
            id: 'alloc-1',
            payment_id: 'sp-part',
            supplier_invoice_id: 'inv-test-1',
            invoice_number: 'INV-TEST-1',
            amount_allocated: 5000.0,
            allocated_at: '2026-10-10T10:00:00Z',
          },
        ],
      };

      const items = ReconciliationEngine.reconcileSupplierPayments([mockPayment], [mockInvoice]);
      expect(items[0].status).toBe('partially_allocated');
      expect(items[0].unallocated_amount).toBe(5000.0);
    });

    it('flags over-allocated payments as discrepancies', () => {
      const mockPayment: SupplierPayment = {
        id: 'sp-over',
        payment_voucher_number: 'PV-OVER-003',
        supplier_id: 'sup-001',
        payment_date: '2026-10-10',
        amount: 5000.0,
        payment_method: 'cash',
        approved_by: 'usr-001',
        created_at: '2026-10-10T10:00:00Z',
        allocations: [
          {
            id: 'alloc-err',
            payment_id: 'sp-over',
            supplier_invoice_id: 'inv-001',
            invoice_number: 'INV-KP-8821',
            amount_allocated: 8000.0, // Exceeds 5000
            allocated_at: '2026-10-10T10:00:00Z',
          },
        ],
      };

      const mockInvoice: SupplierInvoice = {
        id: 'inv-001',
        invoice_number: 'INV-KP-8821',
        supplier_id: 'sup-001',
        invoice_date: '2026-10-01',
        due_date: '2026-10-30',
        total_amount: 10000.0,
        paid_amount: 0,
        outstanding_balance: 10000.0,
        status: 'pending',
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
      };

      const items = ReconciliationEngine.reconcileSupplierPayments([mockPayment], [mockInvoice]);
      expect(items[0].status).toBe('discrepancy');
      expect(items[0].discrepancy_details).toContain('Over-allocated');
    });

    it('flags claims where total payments exceed approved amount', () => {
      const corruptedClaim: ClaimWithDetails = {
        id: 'clm-corrupted',
        claim_number: 'CLM-CORRUPT-999',
        claim_period_start: '2026-10-01',
        claim_period_end: '2026-10-10',
        total_amount: 5000.0,
        approved_amount: 3000.0,
        paid_amount: 4000.0, // Corrupted: Paid > Approved!
        outstanding_balance: 0,
        status: 'paid',
        submitted_by: 'usr-1',
        submitted_by_name: 'Test Staff',
        submitted_at: '2026-10-10T10:00:00Z',
        created_at: '2026-10-10T10:00:00Z',
        updated_at: '2026-10-10T10:00:00Z',
        deleted_at: null,
        total_items: 1,
        patient_count: 1,
        dispensing_count: 1,
        items: [],
        approvals: [],
        payments: [
          {
            id: 'cp-err',
            claim_id: 'clm-corrupted',
            payment_date: '2026-10-11',
            amount: 4000.0,
            payment_method: 'Treasury Transfer',
            received_by: 'usr-1',
            received_by_name: 'Test Officer',
            created_at: '2026-10-11T10:00:00Z',
          },
        ],
      };

      const items = ReconciliationEngine.reconcileClaimReceipts([corruptedClaim]);
      const discrepancyItem = items.find((i) => i.status === 'discrepancy');
      expect(discrepancyItem).toBeDefined();
      expect(discrepancyItem?.discrepancy_details).toContain('Claim overpaid');
    });
  });
});
