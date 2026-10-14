/**
 * MedLedger — Purchasing Validation Schemas
 *
 * Enforces server-side validation for Purchase Orders, Goods Receipt Notes,
 * and Supplier Invoice Payment Allocations.
 */

import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// ==========================================
// 1. Purchase Order Schemas
// ==========================================

export const createPurchaseOrderItemSchema = z.object({
  medicine_id: z.string().min(1, 'Please select a valid medicine.'),
  quantity_ordered: z
    .number()
    .int('Quantity must be an integer.')
    .positive('Quantity must be greater than zero.'),
  unit_price: z
    .number()
    .min(0, 'Unit price cannot be negative.')
    .max(1_000_000, 'Unit price exceeds permitted limit.'),
});

export const createPurchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Please select a supplier.'),
  order_date: z.string().regex(dateRegex, 'Order date must be in YYYY-MM-DD format.'),
  expected_delivery_date: z
    .string()
    .regex(dateRegex, 'Expected delivery date must be in YYYY-MM-DD format.')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters.').optional().or(z.literal('')),
  items: z
    .array(createPurchaseOrderItemSchema)
    .min(1, 'Purchase order must contain at least one line item.'),
});

export const purchaseOrderFilterSchema = z.object({
  search: z.string().optional(),
  supplier_id: z.string().optional(),
  status: z
    .enum(['all', 'draft', 'submitted', 'partially_received', 'fully_received', 'cancelled'])
    .optional()
    .default('all'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

// ==========================================
// 2. Goods Receiving Schemas
// ==========================================

export const receiveItemSchema = z
  .object({
    purchase_order_item_id: z.string().optional().or(z.literal('')),
    medicine_id: z.string().min(1, 'Medicine reference is required.'),
    batch_number: z
      .string()
      .trim()
      .min(2, 'Batch number must be at least 2 characters.')
      .max(50, 'Batch number cannot exceed 50 characters.'),
    expiry_date: z.string().regex(dateRegex, 'Expiry date must be in YYYY-MM-DD format.'),
    quantity_received: z
      .number()
      .int('Quantity received must be an integer.')
      .positive('Delivered quantity must be greater than zero.'),
    quantity_accepted: z
      .number()
      .int('Quantity accepted must be an integer.')
      .min(0, 'Accepted quantity cannot be negative.'),
    quantity_rejected: z
      .number()
      .int('Quantity rejected must be an integer.')
      .min(0, 'Rejected quantity cannot be negative.')
      .optional()
      .default(0),
    rejection_reason: z.string().max(255).optional().or(z.literal('')),
    unit_cost: z.number().min(0, 'Unit cost cannot be negative.'),
  })
  .refine(
    (data) => data.quantity_accepted + (data.quantity_rejected || 0) === data.quantity_received,
    {
      message: 'The sum of accepted and rejected quantities must equal total delivered quantity.',
      path: ['quantity_received'],
    },
  );

export const receiveGoodsSchema = z.object({
  purchase_order_id: z.string().optional().or(z.literal('')),
  supplier_id: z.string().min(1, 'Supplier is required.'),
  received_date: z.string().regex(dateRegex, 'Received date must be in YYYY-MM-DD format.'),
  delivery_challan_number: z
    .string()
    .trim()
    .max(100, 'Delivery challan cannot exceed 100 characters.')
    .optional()
    .or(z.literal('')),
  supplier_invoice_ref: z
    .string()
    .trim()
    .max(100, 'Invoice reference cannot exceed 100 characters.')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  idempotency_key: z.string().min(8, 'Idempotency key must be at least 8 characters.'),
  create_invoice: z.boolean().optional().default(false),
  invoice_due_date: z.string().regex(dateRegex).optional().or(z.literal('')),
  items: z
    .array(receiveItemSchema)
    .min(1, 'Goods receipt must contain at least one received item.'),
});

export const goodsReceiptFilterSchema = z.object({
  search: z.string().optional(),
  supplier_id: z.string().optional(),
  purchase_order_id: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

// ==========================================
// 3. Supplier Invoice & Payment Schemas
// ==========================================

export const supplierInvoiceFilterSchema = z.object({
  search: z.string().optional(),
  supplier_id: z.string().optional(),
  status: z
    .enum(['all', 'pending', 'partially_paid', 'paid', 'disputed', 'cancelled'])
    .optional()
    .default('all'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const paymentAllocationItemSchema = z.object({
  invoice_id: z.string().min(1, 'Invoice ID is required.'),
  amount_allocated: z
    .number()
    .positive('Allocated amount must be greater than zero.')
    .max(10_000_000, 'Allocated amount exceeds permitted limit.'),
});

export const recordSupplierPaymentSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required.'),
  payment_date: z.string().regex(dateRegex, 'Payment date must be in YYYY-MM-DD format.'),
  amount: z
    .number()
    .positive('Payment amount must be greater than zero.')
    .max(10_000_000, 'Payment amount exceeds permitted limit.'),
  payment_method: z.enum(['bank_transfer', 'cheque', 'cash']),
  reference_number: z
    .string()
    .trim()
    .max(100, 'Payment reference cannot exceed 100 characters.')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  idempotency_key: z.string().min(8, 'Idempotency key must be at least 8 characters.'),
  allocations: z
    .array(paymentAllocationItemSchema)
    .min(1, 'Payment must allocate funds to at least one invoice.'),
});

export type CreatePurchaseOrderSchemaType = z.infer<typeof createPurchaseOrderSchema>;
export type ReceiveGoodsSchemaType = z.infer<typeof receiveGoodsSchema>;
export type RecordSupplierPaymentSchemaType = z.infer<typeof recordSupplierPaymentSchema>;
