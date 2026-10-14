/**
 * MedLedger — Finance & Reconciliation Validation Schemas
 */

import { z } from 'zod';

export const paymentAllocationItemSchema = z.object({
  invoice_id: z.string().min(1, 'Invoice ID is required'),
  amount_allocated: z.number().positive('Allocated amount must be strictly greater than zero'),
});

export const recordSupplierPaymentSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier ID is required'),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid payment date (YYYY-MM-DD) is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  payment_method: z.enum(['bank_transfer', 'cheque', 'cash']),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  idempotency_key: z.string().min(1, 'Idempotency key is required'),
  allocations: z
    .array(paymentAllocationItemSchema)
    .min(1, 'At least one invoice allocation is required'),
});

export const recordHospitalReceiptSchema = z.object({
  claim_id: z.string().min(1, 'Claim ID is required'),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid payment date (YYYY-MM-DD) is required'),
  amount: z.number().positive('Payment receipt amount must be greater than zero'),
  payment_method: z.string().min(1, 'Payment method is required'),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

export const financeFilterSchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
});

export type RecordSupplierPaymentFormData = z.infer<typeof recordSupplierPaymentSchema>;
export type RecordHospitalReceiptFormData = z.infer<typeof recordHospitalReceiptSchema>;
