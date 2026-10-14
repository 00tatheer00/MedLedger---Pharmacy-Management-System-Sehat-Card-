import { z } from 'zod';

export const ADJUSTMENT_REASONS = [
  'count_discrepancy',
  'damage',
  'breakage',
  'expired',
  'quarantine',
  'audit_reconciliation',
  'opening_balance',
] as const;

export const createOpeningBatchSchema = z.object({
  medicine_id: z
    .string({ message: 'Medicine selection is required' })
    .trim()
    .min(1, 'Please select a medicine'),
  batch_number: z
    .string({ message: 'Batch / Lot number is required' })
    .trim()
    .min(2, 'Batch number must be at least 2 characters')
    .max(50, 'Batch number must not exceed 50 characters')
    .transform((val) => val.toUpperCase()),
  expiry_date: z
    .string({ message: 'Expiry date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
  quantity: z
    .number({ message: 'Quantity must be a valid number' })
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than 0')
    .max(1000000, 'Quantity exceeds allowable single batch limit'),
  unit_cost: z
    .number({ message: 'Unit cost must be a valid number' })
    .min(0, 'Unit cost cannot be negative'),
  supplier_name: z.string().trim().max(150).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export const stockAdjustmentSchema = z.object({
  batch_id: z
    .string({ message: 'Batch ID is required' })
    .trim()
    .min(1, 'Please select a batch to adjust'),
  adjustment_type: z.enum(['increase', 'decrease', 'quarantine', 'write_off'], {
    message: 'Invalid adjustment type',
  }),
  quantity: z
    .number({ message: 'Adjustment quantity must be a number' })
    .int('Quantity must be an integer')
    .positive('Adjustment quantity must be greater than zero')
    .max(100000, 'Single adjustment quantity exceeds upper safety threshold'),
  reason: z.enum(ADJUSTMENT_REASONS, {
    message: 'Please select an authorized adjustment reason',
  }),
  notes: z
    .string({ message: 'Clinical audit explanation is required' })
    .trim()
    .min(5, 'Audit explanation must be at least 5 characters')
    .max(500, 'Audit explanation must not exceed 500 characters'),
  idempotency_key: z
    .string({ message: 'Idempotency key is required' })
    .trim()
    .min(6, 'Idempotency key too short'),
});

export const batchFilterSchema = z.object({
  search: z.string().trim().optional(),
  medicine_id: z.string().trim().optional(),
  status: z
    .enum(['all', 'available', 'quarantined', 'expired', 'recalled', 'depleted'])
    .optional()
    .default('all'),
  expiry_window: z.enum(['all', 'expired', 'near_expiry', 'valid']).optional().default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const movementFilterSchema = z.object({
  search: z.string().trim().optional(),
  medicine_id: z.string().trim().optional(),
  batch_id: z.string().trim().optional(),
  movement_type: z
    .enum(['all', 'receipt', 'dispensing', 'adjustment', 'return', 'expired_write_off'])
    .optional()
    .default('all'),
  reference_type: z
    .enum([
      'all',
      'inventory_adjustment',
      'manual_correction',
      'quarantine',
      'expired_write_off',
      'opening_balance',
      'goods_receipt_item',
      'dispensing_item',
    ])
    .optional()
    .default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(15),
});
