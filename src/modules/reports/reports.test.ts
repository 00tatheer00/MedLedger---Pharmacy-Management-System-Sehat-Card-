import { describe, it, expect, beforeEach } from 'vitest';
import { ReportGenerator, REPORT_REGISTRY } from './generators';
import { CsvExporter } from './csv-exporter';
import { purchasingStore } from '@/modules/purchasing/prototype-store';
import { claimsStore } from '@/modules/claims/prototype-store';

describe('Reporting & Audit Domain Engine', () => {
  beforeEach(() => {
    purchasingStore.resetForTesting();
    claimsStore.resetForTesting();
  });

  describe('Report Registry Schema Verification', () => {
    it('contains metadata for all 6 operational and 8 financial reports', () => {
      const keys = Object.keys(REPORT_REGISTRY);
      expect(keys.length).toBe(14);

      expect(REPORT_REGISTRY.stock_overview.category).toBe('operational');
      expect(REPORT_REGISTRY.low_stock.category).toBe('operational');
      expect(REPORT_REGISTRY.expiring_batches.category).toBe('operational');
      expect(REPORT_REGISTRY.goods_received.category).toBe('operational');
      expect(REPORT_REGISTRY.dispensing_history.category).toBe('operational');
      expect(REPORT_REGISTRY.prescription_summary.category).toBe('operational');

      expect(REPORT_REGISTRY.supplier_payables.category).toBe('financial');
      expect(REPORT_REGISTRY.supplier_payments.category).toBe('financial');
      expect(REPORT_REGISTRY.claims_by_status.category).toBe('financial');
      expect(REPORT_REGISTRY.approved_claims.category).toBe('financial');
      expect(REPORT_REGISTRY.claim_payments.category).toBe('financial');
      expect(REPORT_REGISTRY.payment_allocations.category).toBe('financial');
      expect(REPORT_REGISTRY.reconciliation_audit.category).toBe('financial');
      expect(REPORT_REGISTRY.financial_transactions.category).toBe('financial');
    });
  });

  describe('Operational Reports Generation', () => {
    it('generates Stock Overview report with exact valuation', () => {
      const res = ReportGenerator.generate('stock_overview');
      expect(res.rows.length).toBeGreaterThan(0);
      expect(res.metadata.title).toBe('Current Stock Overview');

      const valStat = res.summary_stats.find((s) => s.label === 'Total Inventory Valuation');
      expect(valStat).toBeDefined();
      expect(Number(valStat?.value)).toBeGreaterThan(0);

      // Verify row fields
      const first = res.rows[0];
      expect(first).toHaveProperty('medicine_name');
      expect(first).toHaveProperty('quantity_on_hand');
      expect(first).toHaveProperty('unit_cost');
      expect(first).toHaveProperty('total_valuation');
    });

    it('generates Low Stock report identifying medicines at/below threshold', () => {
      const res = ReportGenerator.generate('low_stock');
      expect(res.rows.length).toBeGreaterThanOrEqual(1);

      res.rows.forEach((row) => {
        expect(row.quantity_on_hand).toBeLessThanOrEqual(row.min_reorder_level);
        expect(row.deficit).toBeGreaterThanOrEqual(0);
      });
    });

    it('generates Expiring Batches report', () => {
      const res = ReportGenerator.generate('expiring_batches');
      expect(res.rows.length).toBeGreaterThan(0);

      const expiredItem = res.rows.find((r) => r.status === 'EXPIRED');
      expect(expiredItem).toBeDefined();
    });

    it('generates Goods Received report with unit acceptance and rejection totals', () => {
      const res = ReportGenerator.generate('goods_received');
      expect(res.rows.length).toBeGreaterThan(0);

      const acceptedStat = res.summary_stats.find((s) => s.label === 'Total Units Accepted');
      expect(Number(acceptedStat?.value)).toBeGreaterThan(0);
    });

    it('generates Dispensing History report', () => {
      const res = ReportGenerator.generate('dispensing_history');
      expect(res.rows.length).toBeGreaterThan(0);
      expect(res.rows[0]).toHaveProperty('dispensing_number');
      expect(res.rows[0]).toHaveProperty('patient_name');
    });

    it('generates Prescription Summary report', () => {
      const res = ReportGenerator.generate('prescription_summary');
      expect(res.rows.length).toBeGreaterThan(0);
      expect(res.rows[0]).toHaveProperty('prescription_number');
    });
  });

  describe('Financial Reports Generation', () => {
    it('generates Supplier Payables report with outstanding balances', () => {
      const res = ReportGenerator.generate('supplier_payables');
      expect(res.rows.length).toBeGreaterThan(0);

      const outstandingStat = res.summary_stats.find(
        (s) => s.label === 'Total Outstanding Payables',
      );
      expect(Number(outstandingStat?.value)).toBeGreaterThan(0);
    });

    it('generates Supplier Payments report', () => {
      const res = ReportGenerator.generate('supplier_payments');
      expect(res.rows.length).toBeGreaterThan(0);

      const disbursedStat = res.summary_stats.find((s) => s.label === 'Total Amount Disbursed');
      expect(Number(disbursedStat?.value)).toBeGreaterThan(0);
    });

    it('generates Claims by Status aggregation report', () => {
      const res = ReportGenerator.generate('claims_by_status');
      expect(res.rows.length).toBeGreaterThan(0);
      expect(res.rows.some((r) => r.claim_count > 0)).toBe(true);
    });

    it('generates Approved Claims & Receivables report', () => {
      const res = ReportGenerator.generate('approved_claims');
      expect(res.rows.length).toBeGreaterThan(0);

      const claim1 = res.rows.find((r) => r.claim_number === 'CLM-20261011-0001');
      expect(claim1?.approved_amount).toBe(1840.0);
      expect(claim1?.outstanding_balance).toBe(840.0);
    });

    it('generates Hospital Payment Receipts report', () => {
      const res = ReportGenerator.generate('claim_payments');
      expect(res.rows.length).toBeGreaterThan(0);
      expect(res.rows[0].amount).toBe(1000.0);
    });

    it('generates Payment Allocation Breakdown report', () => {
      const res = ReportGenerator.generate('payment_allocations');
      expect(res.rows.length).toBeGreaterThan(0);
      expect(res.rows[0]).toHaveProperty('payment_voucher');
      expect(res.rows[0]).toHaveProperty('invoice_number');
    });

    it('generates Reconciliation Discrepancy Audit report', () => {
      const res = ReportGenerator.generate('reconciliation_audit');
      expect(res.rows.length).toBeGreaterThan(0);
      expect(res.rows[0]).toHaveProperty('reference');
      expect(res.rows[0]).toHaveProperty('status');
    });

    it('generates Financial Transactions Cash Flow ledger report', () => {
      const res = ReportGenerator.generate('financial_transactions');
      expect(res.rows.length).toBeGreaterThan(0);

      const outflowsStat = res.summary_stats.find((s) => s.label === 'Total Outflows (Disbursed)');
      const inflowsStat = res.summary_stats.find((s) => s.label === 'Total Inflows (Collected)');
      expect(Number(outflowsStat?.value)).toBeGreaterThan(0);
      expect(Number(inflowsStat?.value)).toBeGreaterThan(0);
    });
  });

  describe('RFC 4180 CSV Serialization & Filename Generation', () => {
    it('properly escapes commas, double quotes, and linebreaks in fields', () => {
      expect(CsvExporter.escapeField('Clean Text')).toBe('Clean Text');
      expect(CsvExporter.escapeField('Text with, comma')).toBe('"Text with, comma"');
      expect(CsvExporter.escapeField('Text with "quotes"')).toBe('"Text with ""quotes"""');
      expect(CsvExporter.escapeField('Line1\nLine2')).toBe('"Line1\nLine2"');
    });

    it('prepends UTF-8 BOM and formats CSV rows with Windows CR-LF linebreaks', () => {
      const columns = [
        { key: 'col1', label: 'Item Name' },
        { key: 'col2', label: 'Rate, PKR' },
      ];
      const rows = [
        { col1: 'Paracetamol 500mg', col2: 2.5 },
        { col1: 'Syrup "Cold Care"', col2: 120.0 },
      ];

      const csv = CsvExporter.serializeReport(columns, rows);

      // Verify BOM
      expect(csv.startsWith('\uFEFF')).toBe(true);

      // Verify Header
      expect(csv).toContain('Item Name,"Rate, PKR"');

      // Verify Escaped Quotes in Data Row
      expect(csv).toContain('"Syrup ""Cold Care""",120');

      // Verify CR-LF
      expect(csv).toContain('\r\n');
    });

    it('generates standardized, sanitized filenames', () => {
      const fn = CsvExporter.generateFilename('stock_overview', new Date('2026-10-13T00:00:00Z'));
      expect(fn).toBe('DHQ_Kohat_stock_overview_2026-10-13.csv');
    });
  });
});
