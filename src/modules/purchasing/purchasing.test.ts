/**
 * MedLedger — Purchasing, Receiving & Payables Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { roundMoney, multiplyMoney, addMoney, subtractMoney } from '@/lib/decimal';
import { createPurchaseOrderSchema } from './validation';
import { purchasingStore } from './prototype-store';
import { inventoryStore } from '@/modules/inventory/prototype-store';
import { supplierStore } from '@/modules/suppliers/prototype-store';

describe('Purchasing & Goods Receiving Module', () => {
  const testActor = { id: 'usr-test', name: 'Test Purchasing Officer' };

  beforeEach(() => {
    purchasingStore.resetForTesting();
    inventoryStore.resetForTesting();
    supplierStore.resetForTesting();
  });

  describe('Decimal-Safe Financial Arithmetic', () => {
    it('accurately adds decimal values without binary floating-point artifact', () => {
      // 0.1 + 0.2 in standard JS is 0.30000000000000004
      expect(0.1 + 0.2).not.toBe(0.3);
      expect(addMoney(0.1, 0.2)).toBe(0.3);
      expect(addMoney(10.55, 20.45, 5.01)).toBe(36.01);
    });

    it('accurately multiplies quantities and prices with exact 2-decimal precision', () => {
      expect(multiplyMoney(1000, 18.5)).toBe(18500.0);
      expect(multiplyMoney(3, 33.33)).toBe(99.99);
      expect(multiplyMoney(12, 15.5)).toBe(186.0);
    });

    it('accurately subtracts amounts', () => {
      expect(subtractMoney(100.0, 33.33)).toBe(66.67);
      expect(subtractMoney(53500.0, 53500.0)).toBe(0.0);
    });

    it('rounds numbers to nearest paisa', () => {
      expect(roundMoney(125.456)).toBe(125.46);
      expect(roundMoney(125.454)).toBe(125.45);
    });
  });

  describe('Purchase Order Validation and Creation', () => {
    it('validates a correct purchase order input', () => {
      const valid = {
        supplier_id: 'sup-001',
        order_date: '2026-10-15',
        expected_delivery_date: '2026-10-22',
        notes: 'Monthly ward consignment',
        items: [
          { medicine_id: 'med-001', quantity_ordered: 500, unit_price: 18.5 },
          { medicine_id: 'med-002', quantity_ordered: 100, unit_price: 250.0 },
        ],
      };
      const res = createPurchaseOrderSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('rejects purchase order without any items', () => {
      const emptyItems = {
        supplier_id: 'sup-001',
        order_date: '2026-10-15',
        items: [],
      };
      const res = createPurchaseOrderSchema.safeParse(emptyItems);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('at least one line item');
      }
    });

    it('creates purchase order and calculates line totals and grand total', () => {
      const newPO = purchasingStore.createPurchaseOrder(
        {
          supplier_id: 'sup-001',
          order_date: '2026-10-15',
          items: [
            { medicine_id: 'med-001', quantity_ordered: 100, unit_price: 18.5 }, // 1850.0
            { medicine_id: 'med-002', quantity_ordered: 20, unit_price: 250.0 }, // 5000.0
          ],
        },
        testActor,
      );

      expect(newPO.id).toBeDefined();
      expect(newPO.po_number).toMatch(/^PO-\d{4}-\d{4}$/);
      expect(newPO.status).toBe('submitted');
      expect(newPO.items[0].total_price).toBe(1850.0);
      expect(newPO.items[1].total_price).toBe(5000.0);
      expect(newPO.total_amount).toBe(6850.0);
    });

    it('rejects creating purchase order for deactivated supplier', () => {
      expect(() => {
        purchasingStore.createPurchaseOrder(
          {
            supplier_id: 'sup-004', // Inactive supplier in demo dataset
            order_date: '2026-10-15',
            items: [{ medicine_id: 'med-001', quantity_ordered: 100, unit_price: 18.5 }],
          },
          testActor,
        );
      }).toThrow(/deactivated/i);
    });
  });

  describe('Goods Receiving & Inventory Integration', () => {
    it('receives goods against a purchase order and updates inventory stock atomically', () => {
      const initialStockOverview = inventoryStore.getInventoryOverview();
      const initialUnits = initialStockOverview.total_units_on_hand;

      // PO-002 has Omeprazole (poi-002-3) with 1250 ordered, but let's test receiving Insulin (poi-002-4, 200 ordered, 0 received)
      const res = purchasingStore.receiveGoods(
        {
          purchase_order_id: 'po-002',
          supplier_id: 'sup-002',
          received_date: '2026-10-15',
          delivery_challan_number: 'DC-INS-9901',
          supplier_invoice_ref: 'INV-KD-9988',
          idempotency_key: 'test-idemp-grn-001',
          create_invoice: true,
          items: [
            {
              purchase_order_item_id: 'poi-002-4',
              medicine_id: 'med-006',
              batch_number: 'INS-2026-09',
              expiry_date: '2027-11-20',
              quantity_received: 100,
              quantity_accepted: 100,
              quantity_rejected: 0,
              unit_cost: 180.0,
            },
          ],
        },
        testActor,
      );

      expect(res.receipt.grn_number).toMatch(/^GRN-\d{4}-\d{4}$/);
      expect(res.receipt.items[0].quantity_accepted).toBe(100);

      // Verify inventory was immediately updated!
      const afterStockOverview = inventoryStore.getInventoryOverview();
      expect(afterStockOverview.total_units_on_hand).toBe(initialUnits + 100);

      // Verify batch exists in inventoryStore
      const batch = inventoryStore
        .getBatches({ search: 'INS-2026-09' })
        .batches.find((b) => b.batch_number === 'INS-2026-09');
      expect(batch).toBeDefined();
      expect(batch?.quantity_on_hand).toBe(100);

      // Verify StockMovement record was appended
      const movements = inventoryStore.getStockMovements().movements;
      const recentMov = movements[0];
      expect(recentMov.movement_type).toBe('receipt');
      expect(recentMov.reference_type).toBe('goods_receipt');
      expect(recentMov.reference_id).toBe(res.receipt.grn_number);
      expect(recentMov.quantity).toBe(100);

      // Verify PO item quantity_received increased
      const updatedPO = purchasingStore.getPurchaseOrderById('po-002');
      const insItem = updatedPO?.items.find((i) => i.id === 'poi-002-4');
      expect(insItem?.quantity_received).toBe(100);
      expect(updatedPO?.status).toBe('partially_received');

      // Verify invoice was created
      expect(res.invoice).toBeDefined();
      expect(res.invoice?.invoice_number).toBe('INV-KD-9988');
      expect(res.invoice?.total_amount).toBe(18000.0);
    });

    it('prevents over-receipt exceeding outstanding purchase order quantity', () => {
      // PO-002 item poi-002-1 has 2000 ordered, 1000 already received -> 1000 remaining
      expect(() => {
        purchasingStore.receiveGoods(
          {
            purchase_order_id: 'po-002',
            supplier_id: 'sup-002',
            received_date: '2026-10-15',
            idempotency_key: 'test-idemp-over-recv',
            items: [
              {
                purchase_order_item_id: 'poi-002-1',
                medicine_id: 'med-003',
                batch_number: 'MET-2026-99',
                expiry_date: '2027-10-15',
                quantity_received: 1500,
                quantity_accepted: 1500, // Exceeds remaining 1000!
                quantity_rejected: 0,
                unit_cost: 4.0,
              },
            ],
          },
          testActor,
        );
      }).toThrow(/exceeds outstanding quantity/i);
    });

    it('rejects duplicate goods receipt submission with same idempotency key', () => {
      const payload = {
        purchase_order_id: 'po-003',
        supplier_id: 'sup-001',
        received_date: '2026-10-15',
        idempotency_key: 'test-duplicate-key-12345',
        items: [
          {
            purchase_order_item_id: 'poi-003-1',
            medicine_id: 'med-002',
            batch_number: 'CTX-2026-99',
            expiry_date: '2027-08-20',
            quantity_received: 50,
            quantity_accepted: 50,
            quantity_rejected: 0,
            unit_cost: 250.0,
          },
        ],
      };

      purchasingStore.receiveGoods(payload, testActor);

      // Attempting to submit again with identical idempotency key throws
      expect(() => {
        purchasingStore.receiveGoods(payload, testActor);
      }).toThrow(/Duplicate goods receiving transaction/i);
    });

    it('does not increment inventory stock for rejected damaged goods', () => {
      const initialUnits = inventoryStore.getInventoryOverview().total_units_on_hand;

      purchasingStore.receiveGoods(
        {
          purchase_order_id: 'po-003',
          supplier_id: 'sup-001',
          received_date: '2026-10-15',
          idempotency_key: 'test-rejected-goods-key',
          items: [
            {
              purchase_order_item_id: 'poi-003-2',
              medicine_id: 'med-007',
              batch_number: 'CIP-2026-01',
              expiry_date: '2027-12-31',
              quantity_received: 100,
              quantity_accepted: 0, // 0 accepted
              quantity_rejected: 100, // All 100 rejected
              rejection_reason: 'Bottles broken and soaked during courier shipment.',
              unit_cost: 35.0,
            },
          ],
        },
        testActor,
      );

      // Stock on hand must remain unchanged!
      const afterUnits = inventoryStore.getInventoryOverview().total_units_on_hand;
      expect(afterUnits).toBe(initialUnits);
    });

    it('rejects receiving batch with past expiration date', () => {
      expect(() => {
        purchasingStore.receiveGoods(
          {
            purchase_order_id: 'po-003',
            supplier_id: 'sup-001',
            received_date: '2026-10-15',
            idempotency_key: 'test-past-expiry-key',
            items: [
              {
                purchase_order_item_id: 'poi-003-3',
                medicine_id: 'med-008',
                batch_number: 'SAL-2026-PAST',
                expiry_date: '2025-01-01', // Expired in the past!
                quantity_received: 50,
                quantity_accepted: 50,
                quantity_rejected: 0,
                unit_cost: 100.0,
              },
            ],
          },
          testActor,
        );
      }).toThrow(/Cannot receive expired batch/i);
    });
  });

  describe('Supplier Payments & Multi-Invoice Allocation', () => {
    it('records a supplier payment and allocates across multiple outstanding invoices', () => {
      // In demo data, sup-001 has inv-003 (outstanding 75000.0)
      // Let's create an additional invoice for sup-001
      const invListBefore = purchasingStore.getSupplierInvoices({ supplier_id: 'sup-001' });
      expect(invListBefore.invoices.some((i) => i.id === 'inv-003')).toBe(true);

      const res = purchasingStore.recordSupplierPayment(
        {
          supplier_id: 'sup-001',
          payment_date: '2026-10-15',
          amount: 50000.0,
          payment_method: 'bank_transfer',
          reference_number: 'NBP-ONL-55214',
          idempotency_key: 'test-pay-voucher-001',
          allocations: [
            {
              invoice_id: 'inv-003',
              amount_allocated: 50000.0,
            },
          ],
        },
        testActor,
      );

      expect(res.payment.payment_voucher_number).toMatch(/^PV-\d{4}-\d{4}$/);
      expect(res.payment.amount).toBe(50000.0);
      expect(res.payment.allocations[0].amount_allocated).toBe(50000.0);

      // Verify invoice was updated
      const updatedInv = purchasingStore.getSupplierInvoiceById('inv-003');
      expect(updatedInv?.paid_amount).toBe(50000.0);
      expect(updatedInv?.outstanding_balance).toBe(25000.0);
      expect(updatedInv?.status).toBe('partially_paid');
    });

    it('rejects payment if total allocated does not match payment voucher amount', () => {
      expect(() => {
        purchasingStore.recordSupplierPayment(
          {
            supplier_id: 'sup-001',
            payment_date: '2026-10-15',
            amount: 50000.0,
            payment_method: 'bank_transfer',
            idempotency_key: 'test-mismatch-allocation',
            allocations: [
              {
                invoice_id: 'inv-003',
                amount_allocated: 40000.0, // 40000 != 50000
              },
            ],
          },
          testActor,
        );
      }).toThrow(/must equal payment voucher amount/i);
    });

    it('rejects allocation exceeding invoice outstanding balance', () => {
      // inv-002 has 14000 outstanding balance
      expect(() => {
        purchasingStore.recordSupplierPayment(
          {
            supplier_id: 'sup-002',
            payment_date: '2026-10-15',
            amount: 20000.0,
            payment_method: 'cheque',
            idempotency_key: 'test-over-allocation',
            allocations: [
              {
                invoice_id: 'inv-002',
                amount_allocated: 20000.0, // 20000 > 14000
              },
            ],
          },
          testActor,
        );
      }).toThrow(/exceeds outstanding balance/i);
    });

    it('rejects allocating payment to an invoice belonging to a different supplier', () => {
      // Trying to allocate a payment for sup-001 to inv-002 (which belongs to sup-002)
      expect(() => {
        purchasingStore.recordSupplierPayment(
          {
            supplier_id: 'sup-001',
            payment_date: '2026-10-15',
            amount: 10000.0,
            payment_method: 'cash',
            idempotency_key: 'test-cross-supplier-key',
            allocations: [
              {
                invoice_id: 'inv-002', // Belongs to sup-002
                amount_allocated: 10000.0,
              },
            ],
          },
          testActor,
        );
      }).toThrow(/belongs to another supplier/i);
    });
  });
});
