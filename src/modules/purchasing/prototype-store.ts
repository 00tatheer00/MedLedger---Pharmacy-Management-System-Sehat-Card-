/**
 * MedLedger — Purchasing, Receiving & Payables Prototype Store
 *
 * Implements high-fidelity in-memory management of Purchase Orders, Goods Receipt Notes,
 * Supplier Invoices, and Payment Allocations. Reuses inventoryStore.receiveGoodsBatch
 * for transactional inventory integration without dual stock mutation pathways.
 */

import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderFilters,
  PaginatedPurchaseOrdersResponse,
  CreatePurchaseOrderInput,
  GoodsReceipt,
  GoodsReceiptItem,
  GoodsReceiptFilters,
  PaginatedGoodsReceiptsResponse,
  ReceiveGoodsInput,
  SupplierInvoice,
  SupplierInvoiceFilters,
  PaginatedSupplierInvoicesResponse,
  SupplierPayment,
  SupplierPaymentAllocation,
  RecordSupplierPaymentInput,
} from './types';
import { supplierStore } from '@/modules/suppliers/prototype-store';
import { medicineStore } from '@/modules/medicines/prototype-store';
import { inventoryStore } from '@/modules/inventory/prototype-store';
import { multiplyMoney, addMoney, subtractMoney } from '@/lib/decimal';

// ==========================================
// Initial Demo Data
// ==========================================

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-001',
    po_number: 'PO-2026-0045',
    supplier_id: 'sup-001',
    order_date: '2026-10-01',
    expected_delivery_date: '2026-10-05',
    status: 'fully_received',
    total_amount: 53500.0,
    notes: 'Urgent central dispensary restocking for emergency & surgical wards.',
    created_by: 'usr-001',
    created_by_name: 'Dr. Ayesha Bangash',
    created_at: '2026-10-01T08:30:00.000Z',
    updated_at: '2026-10-03T11:00:00.000Z',
    items: [
      {
        id: 'poi-001-1',
        purchase_order_id: 'po-001',
        medicine_id: 'med-001',
        medicine_name: 'Amoxicillin 500mg',
        generic_name: 'Amoxicillin Trihydrate',
        strength: '500mg',
        dosage_form: 'capsule',
        unit_of_measure: 'capsule',
        quantity_ordered: 1000,
        quantity_received: 1000,
        unit_price: 18.5,
        total_price: 18500.0,
        created_at: '2026-10-01T08:30:00.000Z',
        updated_at: '2026-10-03T11:00:00.000Z',
      },
      {
        id: 'poi-001-2',
        purchase_order_id: 'po-001',
        medicine_id: 'med-002',
        medicine_name: 'Ceftriaxone 1g',
        generic_name: 'Ceftriaxone Sodium',
        strength: '1g',
        dosage_form: 'injection',
        unit_of_measure: 'vial',
        quantity_ordered: 140,
        quantity_received: 140,
        unit_price: 250.0,
        total_price: 35000.0,
        created_at: '2026-10-01T08:30:00.000Z',
        updated_at: '2026-10-03T11:00:00.000Z',
      },
    ],
  },
  {
    id: 'po-002',
    po_number: 'PO-2026-0048',
    supplier_id: 'sup-002',
    order_date: '2026-10-05',
    expected_delivery_date: '2026-10-12',
    status: 'partially_received',
    total_amount: 84000.0,
    notes: 'Quarterly chronic disease maintenance consignment.',
    created_by: 'usr-001',
    created_by_name: 'Dr. Ayesha Bangash',
    created_at: '2026-10-05T09:00:00.000Z',
    updated_at: '2026-10-08T14:30:00.000Z',
    items: [
      {
        id: 'poi-002-1',
        purchase_order_id: 'po-002',
        medicine_id: 'med-003',
        medicine_name: 'Metformin 500mg',
        generic_name: 'Metformin Hydrochloride',
        strength: '500mg',
        dosage_form: 'tablet',
        unit_of_measure: 'tablet',
        quantity_ordered: 2000,
        quantity_received: 1000,
        unit_price: 4.0,
        total_price: 8000.0,
        created_at: '2026-10-05T09:00:00.000Z',
        updated_at: '2026-10-08T14:30:00.000Z',
      },
      {
        id: 'poi-002-2',
        purchase_order_id: 'po-002',
        medicine_id: 'med-004',
        medicine_name: 'Paracetamol 500mg',
        generic_name: 'Acetaminophen / Paracetamol',
        strength: '500mg',
        dosage_form: 'tablet',
        unit_of_measure: 'tablet',
        quantity_ordered: 10000,
        quantity_received: 4000,
        unit_price: 2.5,
        total_price: 25000.0,
        created_at: '2026-10-05T09:00:00.000Z',
        updated_at: '2026-10-08T14:30:00.000Z',
      },
      {
        id: 'poi-002-3',
        purchase_order_id: 'po-002',
        medicine_id: 'med-005',
        medicine_name: 'Omeprazole 20mg',
        generic_name: 'Omeprazole Magnesium',
        strength: '20mg',
        dosage_form: 'capsule',
        unit_of_measure: 'capsule',
        quantity_ordered: 1250,
        quantity_received: 1250,
        unit_price: 12.0,
        total_price: 15000.0,
        created_at: '2026-10-05T09:00:00.000Z',
        updated_at: '2026-10-08T14:30:00.000Z',
      },
      {
        id: 'poi-002-4',
        purchase_order_id: 'po-002',
        medicine_id: 'med-006',
        medicine_name: 'Insulin Glargine 100 IU/ml',
        generic_name: 'Insulin Glargine (Recombinant)',
        strength: '100 IU/ml (3ml)',
        dosage_form: 'injection',
        unit_of_measure: 'cartridge',
        quantity_ordered: 200,
        quantity_received: 0,
        unit_price: 180.0,
        total_price: 36000.0,
        created_at: '2026-10-05T09:00:00.000Z',
        updated_at: '2026-10-05T09:00:00.000Z',
      },
    ],
  },
  {
    id: 'po-003',
    po_number: 'PO-2026-0051',
    supplier_id: 'sup-001',
    order_date: '2026-10-10',
    expected_delivery_date: '2026-10-18',
    status: 'submitted',
    total_amount: 112500.0,
    notes: 'Emergency antibiotic reserve replenishment.',
    created_by: 'usr-001',
    created_by_name: 'Dr. Ayesha Bangash',
    created_at: '2026-10-10T10:00:00.000Z',
    updated_at: '2026-10-10T10:00:00.000Z',
    items: [
      {
        id: 'poi-003-1',
        purchase_order_id: 'po-003',
        medicine_id: 'med-002',
        medicine_name: 'Ceftriaxone 1g',
        generic_name: 'Ceftriaxone Sodium',
        strength: '1g',
        dosage_form: 'injection',
        unit_of_measure: 'vial',
        quantity_ordered: 300,
        quantity_received: 0,
        unit_price: 250.0,
        total_price: 75000.0,
        created_at: '2026-10-10T10:00:00.000Z',
        updated_at: '2026-10-10T10:00:00.000Z',
      },
      {
        id: 'poi-003-2',
        purchase_order_id: 'po-003',
        medicine_id: 'med-007',
        medicine_name: 'Ciprofloxacin 500mg',
        generic_name: 'Ciprofloxacin Hydrochloride',
        strength: '500mg',
        dosage_form: 'tablet',
        unit_of_measure: 'tablet',
        quantity_ordered: 500,
        quantity_received: 0,
        unit_price: 35.0,
        total_price: 17500.0,
        created_at: '2026-10-10T10:00:00.000Z',
        updated_at: '2026-10-10T10:00:00.000Z',
      },
      {
        id: 'poi-003-3',
        purchase_order_id: 'po-003',
        medicine_id: 'med-008',
        medicine_name: 'Salbutamol Inhaler 100mcg',
        generic_name: 'Salbutamol Sulfate',
        strength: '100mcg (200 doses)',
        dosage_form: 'inhaler',
        unit_of_measure: 'inhaler',
        quantity_ordered: 200,
        quantity_received: 0,
        unit_price: 100.0,
        total_price: 20000.0,
        created_at: '2026-10-10T10:00:00.000Z',
        updated_at: '2026-10-10T10:00:00.000Z',
      },
    ],
  },
];

export const initialGoodsReceipts: GoodsReceipt[] = [
  {
    id: 'grn-001',
    grn_number: 'GRN-2026-0451',
    purchase_order_id: 'po-001',
    purchase_order_number: 'PO-2026-0045',
    supplier_id: 'sup-001',
    supplier_name: 'Kohat Pharma Distributors',
    received_date: '2026-10-03',
    received_by: 'usr-001',
    received_by_name: 'Dr. Ayesha Bangash',
    delivery_challan_number: 'DC-KPD-9921',
    supplier_invoice_ref: 'INV-KP-8821',
    notes: 'Full consignment received in sound condition. Cold chain verified.',
    created_at: '2026-10-03T11:00:00.000Z',
    updated_at: '2026-10-03T11:00:00.000Z',
    items: [
      {
        id: 'gri-001-1',
        goods_receipt_id: 'grn-001',
        purchase_order_item_id: 'poi-001-1',
        medicine_id: 'med-001',
        medicine_name: 'Amoxicillin 500mg',
        batch_number: 'AMX-2026-01',
        expiry_date: '2027-05-15',
        quantity_received: 1000,
        quantity_accepted: 1000,
        quantity_rejected: 0,
        unit_cost: 18.5,
        total_cost: 18500.0,
        created_at: '2026-10-03T11:00:00.000Z',
      },
      {
        id: 'gri-001-2',
        goods_receipt_id: 'grn-001',
        purchase_order_item_id: 'poi-001-2',
        medicine_id: 'med-002',
        medicine_name: 'Ceftriaxone 1g',
        batch_number: 'CTX-2026-08',
        expiry_date: '2027-08-20',
        quantity_received: 140,
        quantity_accepted: 140,
        quantity_rejected: 0,
        unit_cost: 250.0,
        total_cost: 35000.0,
        created_at: '2026-10-03T11:00:00.000Z',
      },
    ],
  },
  {
    id: 'grn-002',
    grn_number: 'GRN-2026-0452',
    purchase_order_id: 'po-002',
    purchase_order_number: 'PO-2026-0048',
    supplier_id: 'sup-002',
    supplier_name: 'Khyber Drug Agency',
    received_date: '2026-10-08',
    received_by: 'usr-001',
    received_by_name: 'Dr. Ayesha Bangash',
    delivery_challan_number: 'DC-KDA-4100',
    supplier_invoice_ref: 'INV-KD-9410',
    notes: 'Partial intake. Insulin cartridges pending temperature-controlled vehicle dispatch.',
    created_at: '2026-10-08T14:30:00.000Z',
    updated_at: '2026-10-08T14:30:00.000Z',
    items: [
      {
        id: 'gri-002-1',
        goods_receipt_id: 'grn-002',
        purchase_order_item_id: 'poi-002-1',
        medicine_id: 'med-003',
        medicine_name: 'Metformin 500mg',
        batch_number: 'MET-2026-04',
        expiry_date: '2027-10-15',
        quantity_received: 1000,
        quantity_accepted: 1000,
        quantity_rejected: 0,
        unit_cost: 4.0,
        total_cost: 4000.0,
        created_at: '2026-10-08T14:30:00.000Z',
      },
      {
        id: 'gri-002-2',
        goods_receipt_id: 'grn-002',
        purchase_order_item_id: 'poi-002-2',
        medicine_id: 'med-004',
        medicine_name: 'Paracetamol 500mg',
        batch_number: 'PCM-2026-11',
        expiry_date: '2027-12-01',
        quantity_received: 4050,
        quantity_accepted: 4000,
        quantity_rejected: 50,
        rejection_reason: '50 units crushed in transit packaging box.',
        unit_cost: 2.5,
        total_cost: 10000.0,
        created_at: '2026-10-08T14:30:00.000Z',
      },
      {
        id: 'gri-002-3',
        goods_receipt_id: 'grn-002',
        purchase_order_item_id: 'poi-002-3',
        medicine_id: 'med-005',
        medicine_name: 'Omeprazole 20mg',
        batch_number: 'OMP-2026-07',
        expiry_date: '2027-09-30',
        quantity_received: 1250,
        quantity_accepted: 1250,
        quantity_rejected: 0,
        unit_cost: 12.0,
        total_cost: 15000.0,
        created_at: '2026-10-08T14:30:00.000Z',
      },
    ],
  },
];

export const initialSupplierInvoices: SupplierInvoice[] = [
  {
    id: 'inv-001',
    invoice_number: 'INV-KP-8821',
    supplier_id: 'sup-001',
    supplier_name: 'Kohat Pharma Distributors',
    goods_receipt_id: 'grn-001',
    grn_number: 'GRN-2026-0451',
    purchase_order_id: 'po-001',
    po_number: 'PO-2026-0045',
    invoice_date: '2026-10-03',
    due_date: '2026-11-03',
    total_amount: 53500.0,
    paid_amount: 53500.0,
    outstanding_balance: 0.0,
    status: 'paid',
    notes: 'Settled in full via NBP online bank transfer.',
    created_at: '2026-10-03T11:30:00.000Z',
    updated_at: '2026-10-04T15:00:00.000Z',
  },
  {
    id: 'inv-002',
    invoice_number: 'INV-KD-9410',
    supplier_id: 'sup-002',
    supplier_name: 'Khyber Drug Agency',
    goods_receipt_id: 'grn-002',
    grn_number: 'GRN-2026-0452',
    purchase_order_id: 'po-002',
    po_number: 'PO-2026-0048',
    invoice_date: '2026-10-08',
    due_date: '2026-11-08',
    total_amount: 29000.0,
    paid_amount: 15000.0,
    outstanding_balance: 14000.0,
    status: 'partially_paid',
    notes: 'Initial 50% mobilization payment released. Remaining balance upon insulin delivery.',
    created_at: '2026-10-08T15:00:00.000Z',
    updated_at: '2026-10-10T11:00:00.000Z',
  },
  {
    id: 'inv-003',
    invoice_number: 'INV-KP-8990',
    supplier_id: 'sup-001',
    supplier_name: 'Kohat Pharma Distributors',
    goods_receipt_id: null,
    grn_number: null,
    purchase_order_id: null,
    po_number: null,
    invoice_date: '2026-10-10',
    due_date: '2026-11-10',
    total_amount: 75000.0,
    paid_amount: 0.0,
    outstanding_balance: 75000.0,
    status: 'pending',
    notes: 'Direct consignment invoice awaiting payment verification.',
    created_at: '2026-10-10T12:00:00.000Z',
    updated_at: '2026-10-10T12:00:00.000Z',
  },
];

export const initialSupplierPayments: SupplierPayment[] = [
  {
    id: 'pay-001',
    payment_voucher_number: 'PV-2026-0081',
    supplier_id: 'sup-001',
    supplier_name: 'Kohat Pharma Distributors',
    payment_date: '2026-10-04',
    amount: 53500.0,
    payment_method: 'bank_transfer',
    reference_number: 'NBP-TRF-9941',
    notes: 'Full settlement of INV-KP-8821.',
    approved_by: 'usr-002',
    approved_by_name: 'Tariq Finance Officer',
    created_at: '2026-10-04T15:00:00.000Z',
    allocations: [
      {
        id: 'pva-001',
        payment_id: 'pay-001',
        supplier_invoice_id: 'inv-001',
        invoice_number: 'INV-KP-8821',
        amount_allocated: 53500.0,
        allocated_at: '2026-10-04T15:00:00.000Z',
      },
    ],
  },
  {
    id: 'pay-002',
    payment_voucher_number: 'PV-2026-0085',
    supplier_id: 'sup-002',
    supplier_name: 'Khyber Drug Agency',
    payment_date: '2026-10-10',
    amount: 15000.0,
    payment_method: 'cheque',
    reference_number: 'HBL-CHQ-10492',
    notes: 'Part-payment on INV-KD-9410.',
    approved_by: 'usr-002',
    approved_by_name: 'Tariq Finance Officer',
    created_at: '2026-10-10T11:00:00.000Z',
    allocations: [
      {
        id: 'pva-002',
        payment_id: 'pay-002',
        supplier_invoice_id: 'inv-002',
        invoice_number: 'INV-KD-9410',
        amount_allocated: 15000.0,
        allocated_at: '2026-10-10T11:00:00.000Z',
      },
    ],
  },
];

// ==========================================
// Purchasing Prototype Store Class
// ==========================================

class PurchasingPrototypeStore {
  private purchaseOrders: PurchaseOrder[] = JSON.parse(JSON.stringify(initialPurchaseOrders));
  private goodsReceipts: GoodsReceipt[] = JSON.parse(JSON.stringify(initialGoodsReceipts));
  private supplierInvoices: SupplierInvoice[] = JSON.parse(JSON.stringify(initialSupplierInvoices));
  private supplierPayments: SupplierPayment[] = JSON.parse(JSON.stringify(initialSupplierPayments));
  private processedIdempotencyKeys = new Set<string>();

  // ------------------------------------------
  // Purchase Orders
  // ------------------------------------------

  public getPurchaseOrders(filters: PurchaseOrderFilters = {}): PaginatedPurchaseOrdersResponse {
    const { search = '', supplier_id, status = 'all', page = 1, pageSize = 20 } = filters;

    let list = this.purchaseOrders.filter((po) => !po.deleted_at);

    if (supplier_id) {
      list = list.filter((po) => po.supplier_id === supplier_id);
    }

    if (status !== 'all') {
      list = list.filter((po) => po.status === status);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (po) =>
          po.po_number.toLowerCase().includes(q) ||
          (po.supplier && po.supplier.name.toLowerCase().includes(q)) ||
          po.items.some((item) => (item.medicine_name || '').toLowerCase().includes(q)),
      );
    }

    // Sort descending by order date
    list.sort((a, b) => b.order_date.localeCompare(a.order_date));

    // Populate supplier entity
    list = list.map((po) => ({
      ...po,
      supplier: supplierStore.getSupplierById(po.supplier_id) || undefined,
    }));

    const totalRecords = list.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;

    return {
      orders: list.slice(startIndex, startIndex + pageSize),
      totalRecords,
      totalPages,
      currentPage: page,
      pageSize,
      isLiveDatabase: false,
    };
  }

  public getPurchaseOrderById(id: string): PurchaseOrder | null {
    const po = this.purchaseOrders.find((p) => p.id === id && !p.deleted_at);
    if (!po) return null;

    return {
      ...po,
      supplier: supplierStore.getSupplierById(po.supplier_id) || undefined,
    };
  }

  public createPurchaseOrder(
    input: CreatePurchaseOrderInput,
    actor: { id: string; name: string },
  ): PurchaseOrder {
    const supplier = supplierStore.getSupplierById(input.supplier_id);
    if (!supplier) {
      throw new Error(`Supplier with ID "${input.supplier_id}" does not exist.`);
    }

    if (!supplier.is_active) {
      throw new Error(`Supplier "${supplier.name}" is deactivated. Cannot create order.`);
    }

    const now = new Date().toISOString();
    const poCount = this.purchaseOrders.length + 1;
    const year = new Date().getFullYear();
    const poNumber = `PO-${year}-${String(poCount).padStart(4, '0')}`;
    const poId = `po-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    let orderTotal = 0;
    const orderItems: PurchaseOrderItem[] = [];

    input.items.forEach((itemInput, idx) => {
      const med = medicineStore.getAllRawMedicines().find((m) => m.id === itemInput.medicine_id);
      if (!med) {
        throw new Error(`Medicine with ID "${itemInput.medicine_id}" does not exist.`);
      }

      const lineTotal = multiplyMoney(itemInput.quantity_ordered, itemInput.unit_price);
      orderTotal = addMoney(orderTotal, lineTotal);

      orderItems.push({
        id: `poi-${Date.now()}-${idx + 1}`,
        purchase_order_id: poId,
        medicine_id: med.id,
        medicine_name: med.name,
        generic_name: med.generic_name,
        strength: med.strength,
        dosage_form: med.dosage_form,
        unit_of_measure: med.unit_of_measure,
        quantity_ordered: itemInput.quantity_ordered,
        quantity_received: 0,
        unit_price: itemInput.unit_price,
        total_price: lineTotal,
        created_at: now,
        updated_at: now,
        medicine: med,
      });
    });

    const newPO: PurchaseOrder = {
      id: poId,
      po_number: poNumber,
      supplier_id: supplier.id,
      order_date: input.order_date,
      expected_delivery_date: input.expected_delivery_date || null,
      status: 'submitted',
      total_amount: orderTotal,
      notes: input.notes?.trim() || null,
      created_by: actor.id,
      created_by_name: actor.name,
      created_at: now,
      updated_at: now,
      supplier,
      items: orderItems,
    };

    this.purchaseOrders.unshift(newPO);
    return newPO;
  }

  // ------------------------------------------
  // Goods Receiving (GRN) & Inventory Integration
  // ------------------------------------------

  public receiveGoods(
    input: ReceiveGoodsInput,
    actor: { id: string; name: string },
  ): { receipt: GoodsReceipt; updatedPO?: PurchaseOrder; invoice?: SupplierInvoice } {
    // 1. Idempotency Guard
    if (this.processedIdempotencyKeys.has(input.idempotency_key)) {
      throw new Error(
        'Duplicate goods receiving transaction detected. This receiving note has already been recorded.',
      );
    }

    const supplier = supplierStore.getSupplierById(input.supplier_id);
    if (!supplier) {
      throw new Error(`Supplier with ID "${input.supplier_id}" not found.`);
    }

    let linkedPO: PurchaseOrder | null = null;
    if (input.purchase_order_id) {
      const foundPO = this.purchaseOrders.find(
        (p) => p.id === input.purchase_order_id && !p.deleted_at,
      );
      if (!foundPO) {
        throw new Error(`Linked purchase order "${input.purchase_order_id}" not found.`);
      }
      if (foundPO.status === 'cancelled') {
        throw new Error(
          `Purchase order "${foundPO.po_number}" is cancelled. Cannot receive goods.`,
        );
      }
      if (foundPO.status === 'fully_received') {
        throw new Error(
          `Purchase order "${foundPO.po_number}" has already been completely received.`,
        );
      }
      linkedPO = foundPO;
    }

    // 2. Validate Items & Over-receipt Constraint
    input.items.forEach((itemInput) => {
      const med = medicineStore.getAllRawMedicines().find((m) => m.id === itemInput.medicine_id);
      if (!med) {
        throw new Error(`Invalid medicine ID: ${itemInput.medicine_id}`);
      }

      if (linkedPO && itemInput.purchase_order_item_id) {
        const poItem = linkedPO.items.find((i) => i.id === itemInput.purchase_order_item_id);
        if (!poItem) {
          throw new Error(
            `Line item "${itemInput.purchase_order_item_id}" does not belong to PO ${linkedPO.po_number}.`,
          );
        }

        const remainingToReceive = poItem.quantity_ordered - poItem.quantity_received;
        if (itemInput.quantity_accepted > remainingToReceive) {
          throw new Error(
            `Accepted quantity (${itemInput.quantity_accepted}) exceeds outstanding quantity (${remainingToReceive}) for ${med.name}. Over-receipt is prohibited.`,
          );
        }
      }
    });

    const now = new Date().toISOString();
    const grnCount = this.goodsReceipts.length + 1;
    const year = new Date().getFullYear();
    const grnNumber = `GRN-${year}-${String(grnCount).padStart(4, '0')}`;
    const grnId = `grn-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    const receiptItems: GoodsReceiptItem[] = [];
    let totalReceivedCost = 0;

    // 3. Atomically Process Items & Inventory Intake
    input.items.forEach((itemInput, idx) => {
      const med = medicineStore.getAllRawMedicines().find((m) => m.id === itemInput.medicine_id);
      const lineCost = multiplyMoney(itemInput.quantity_accepted, itemInput.unit_cost);
      totalReceivedCost = addMoney(totalReceivedCost, lineCost);

      const griId = `gri-${Date.now()}-${idx + 1}`;
      receiptItems.push({
        id: griId,
        goods_receipt_id: grnId,
        purchase_order_item_id: itemInput.purchase_order_item_id || null,
        medicine_id: itemInput.medicine_id,
        medicine_name: med ? med.name : 'Unknown Medicine',
        batch_number: itemInput.batch_number.trim().toUpperCase(),
        expiry_date: itemInput.expiry_date,
        quantity_received: itemInput.quantity_received,
        quantity_accepted: itemInput.quantity_accepted,
        quantity_rejected: itemInput.quantity_rejected || 0,
        rejection_reason: itemInput.rejection_reason?.trim() || null,
        unit_cost: itemInput.unit_cost,
        total_cost: lineCost,
        created_at: now,
      });

      // Intake accepted items into the trusted inventory store!
      if (itemInput.quantity_accepted > 0) {
        inventoryStore.receiveGoodsBatch(
          {
            medicine_id: itemInput.medicine_id,
            batch_number: itemInput.batch_number,
            expiry_date: itemInput.expiry_date,
            quantity_accepted: itemInput.quantity_accepted,
            unit_cost: itemInput.unit_cost,
            supplier_id: input.supplier_id,
            goods_receipt_id: grnId,
            goods_receipt_item_id: griId,
            grn_number: grnNumber,
            notes: input.notes,
            idempotency_key: `${input.idempotency_key}-${idx}`,
          },
          actor,
        );
      }

      // Update PO item running total
      if (linkedPO && itemInput.purchase_order_item_id) {
        const poItem = linkedPO.items.find((i) => i.id === itemInput.purchase_order_item_id);
        if (poItem) {
          poItem.quantity_received += itemInput.quantity_accepted;
          poItem.updated_at = now;
        }
      }
    });

    // 4. Update PO Status
    if (linkedPO) {
      const allFullyReceived = linkedPO.items.every(
        (item) => item.quantity_received >= item.quantity_ordered,
      );
      const anyReceived = linkedPO.items.some((item) => item.quantity_received > 0);

      linkedPO.status = allFullyReceived
        ? 'fully_received'
        : anyReceived
          ? 'partially_received'
          : linkedPO.status;
      linkedPO.updated_at = now;
    }

    // 5. Create Goods Receipt
    const receipt: GoodsReceipt = {
      id: grnId,
      grn_number: grnNumber,
      purchase_order_id: linkedPO ? linkedPO.id : null,
      purchase_order_number: linkedPO ? linkedPO.po_number : null,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      received_date: input.received_date,
      received_by: actor.id,
      received_by_name: actor.name,
      delivery_challan_number: input.delivery_challan_number?.trim() || null,
      supplier_invoice_ref: input.supplier_invoice_ref?.trim() || null,
      notes: input.notes?.trim() || null,
      created_at: now,
      updated_at: now,
      items: receiptItems,
    };
    this.goodsReceipts.unshift(receipt);

    // 6. Optional Supplier Invoice Creation
    let createdInvoice: SupplierInvoice | undefined;
    if (input.create_invoice && input.supplier_invoice_ref) {
      const invoiceNumber = input.supplier_invoice_ref.trim();
      const dueDate =
        input.invoice_due_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const newInv: SupplierInvoice = {
        id: `inv-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        invoice_number: invoiceNumber,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        goods_receipt_id: grnId,
        grn_number: grnNumber,
        purchase_order_id: linkedPO ? linkedPO.id : null,
        po_number: linkedPO ? linkedPO.po_number : null,
        invoice_date: input.received_date,
        due_date: dueDate,
        total_amount: totalReceivedCost,
        paid_amount: 0,
        outstanding_balance: totalReceivedCost,
        status: 'pending',
        notes: `Created automatically upon GRN intake against challan ${input.delivery_challan_number || 'N/A'}.`,
        created_at: now,
        updated_at: now,
      };
      this.supplierInvoices.unshift(newInv);
      createdInvoice = newInv;
    }

    // 7. Record Idempotency Key
    this.processedIdempotencyKeys.add(input.idempotency_key);

    return { receipt, updatedPO: linkedPO || undefined, invoice: createdInvoice };
  }

  public getGoodsReceipts(filters: GoodsReceiptFilters = {}): PaginatedGoodsReceiptsResponse {
    const { search = '', supplier_id, purchase_order_id, page = 1, pageSize = 20 } = filters;

    let list = this.goodsReceipts;

    if (supplier_id) {
      list = list.filter((grn) => grn.supplier_id === supplier_id);
    }

    if (purchase_order_id) {
      list = list.filter((grn) => grn.purchase_order_id === purchase_order_id);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (grn) =>
          grn.grn_number.toLowerCase().includes(q) ||
          (grn.purchase_order_number || '').toLowerCase().includes(q) ||
          (grn.delivery_challan_number || '').toLowerCase().includes(q) ||
          (grn.supplier_name || '').toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => b.received_date.localeCompare(a.received_date));

    const totalRecords = list.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;

    return {
      receipts: list.slice(startIndex, startIndex + pageSize),
      totalRecords,
      totalPages,
      currentPage: page,
      pageSize,
      isLiveDatabase: false,
    };
  }

  // ------------------------------------------
  // Supplier Invoices & Payments
  // ------------------------------------------

  public getSupplierInvoices(
    filters: SupplierInvoiceFilters = {},
  ): PaginatedSupplierInvoicesResponse {
    const { search = '', supplier_id, status = 'all', page = 1, pageSize = 20 } = filters;

    let list = this.supplierInvoices.filter((inv) => !inv.deleted_at);

    if (supplier_id) {
      list = list.filter((inv) => inv.supplier_id === supplier_id);
    }

    if (status !== 'all') {
      list = list.filter((inv) => inv.status === status);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(q) ||
          (inv.supplier_name || '').toLowerCase().includes(q) ||
          (inv.grn_number || '').toLowerCase().includes(q) ||
          (inv.po_number || '').toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));

    const totalRecords = list.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;

    return {
      invoices: list.slice(startIndex, startIndex + pageSize),
      totalRecords,
      totalPages,
      currentPage: page,
      pageSize,
      isLiveDatabase: false,
    };
  }

  public getSupplierInvoiceById(id: string): SupplierInvoice | null {
    return this.supplierInvoices.find((inv) => inv.id === id && !inv.deleted_at) || null;
  }

  public recordSupplierPayment(
    input: RecordSupplierPaymentInput,
    actor: { id: string; name: string },
  ): { payment: SupplierPayment; updatedInvoices: SupplierInvoice[] } {
    // 1. Idempotency Guard
    if (this.processedIdempotencyKeys.has(input.idempotency_key)) {
      throw new Error(
        'Duplicate payment transaction detected. This voucher has already been recorded.',
      );
    }

    const supplier = supplierStore.getSupplierById(input.supplier_id);
    if (!supplier) {
      throw new Error(`Supplier with ID "${input.supplier_id}" not found.`);
    }

    // 2. Validate Allocations
    let totalAllocated = 0;
    input.allocations.forEach((alloc) => {
      totalAllocated = addMoney(totalAllocated, alloc.amount_allocated);
    });

    if (totalAllocated !== input.amount) {
      throw new Error(
        `Total allocated amount (PKR ${totalAllocated}) must equal payment voucher amount (PKR ${input.amount}).`,
      );
    }

    const updatedInvoices: SupplierInvoice[] = [];
    const paymentAllocations: SupplierPaymentAllocation[] = [];
    const now = new Date().toISOString();
    const payId = `pay-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    // 3. Apply Allocations to Invoices
    input.allocations.forEach((allocInput, idx) => {
      const invIndex = this.supplierInvoices.findIndex((i) => i.id === allocInput.invoice_id);
      if (invIndex === -1) {
        throw new Error(`Invoice with ID "${allocInput.invoice_id}" not found.`);
      }

      const inv = this.supplierInvoices[invIndex];
      if (inv.supplier_id !== input.supplier_id) {
        throw new Error(
          `Invoice ${inv.invoice_number} belongs to another supplier. Cross-supplier allocation prohibited.`,
        );
      }

      if (allocInput.amount_allocated > inv.outstanding_balance) {
        throw new Error(
          `Allocation of PKR ${allocInput.amount_allocated} exceeds outstanding balance of PKR ${inv.outstanding_balance} on invoice ${inv.invoice_number}.`,
        );
      }

      const newPaid = addMoney(inv.paid_amount, allocInput.amount_allocated);
      const newOutstanding = subtractMoney(inv.total_amount, newPaid);
      const newStatus = newOutstanding <= 0 ? 'paid' : newPaid > 0 ? 'partially_paid' : inv.status;

      const updatedInv: SupplierInvoice = {
        ...inv,
        paid_amount: newPaid,
        outstanding_balance: Math.max(0, newOutstanding),
        status: newStatus,
        updated_at: now,
      };

      this.supplierInvoices[invIndex] = updatedInv;
      updatedInvoices.push(updatedInv);

      paymentAllocations.push({
        id: `pva-${Date.now()}-${idx + 1}`,
        payment_id: payId,
        supplier_invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        amount_allocated: allocInput.amount_allocated,
        allocated_at: now,
      });
    });

    // 4. Create Supplier Payment Record
    const voucherNumber = `PV-${new Date().getFullYear()}-${String(this.supplierPayments.length + 1).padStart(4, '0')}`;
    const payment: SupplierPayment = {
      id: payId,
      payment_voucher_number: voucherNumber,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      payment_date: input.payment_date,
      amount: input.amount,
      payment_method: input.payment_method,
      reference_number: input.reference_number?.trim() || null,
      notes: input.notes?.trim() || null,
      approved_by: actor.id,
      approved_by_name: actor.name,
      created_at: now,
      allocations: paymentAllocations,
    };

    this.supplierPayments.unshift(payment);
    this.processedIdempotencyKeys.add(input.idempotency_key);

    return { payment, updatedInvoices };
  }

  public getSupplierPayments(supplier_id?: string): SupplierPayment[] {
    if (supplier_id) {
      return this.supplierPayments.filter((p) => p.supplier_id === supplier_id);
    }
    return this.supplierPayments;
  }

  public resetForTesting(): void {
    this.purchaseOrders = JSON.parse(JSON.stringify(initialPurchaseOrders));
    this.goodsReceipts = JSON.parse(JSON.stringify(initialGoodsReceipts));
    this.supplierInvoices = JSON.parse(JSON.stringify(initialSupplierInvoices));
    this.supplierPayments = JSON.parse(JSON.stringify(initialSupplierPayments));
    this.processedIdempotencyKeys.clear();
  }
}

export const purchasingStore = new PurchasingPrototypeStore();
