/**
 * MedLedger — Dispensing Module Zod Validation Schemas
 *
 * Enforces strict validation on medicine dispensing intake, FEFO overrides,
 * substitutions, and compensating reversals.
 */

import { z } from 'zod';

export const dispenseItemSchema = z
  .object({
    prescription_item_id: z.string().min(1, 'Prescription item reference is required'),
    medicine_batch_id: z.string().min(1, 'Medicine batch reference is required'),
    dispensed_medicine_id: z.string().min(1, 'Dispensed medicine reference is required'),
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .min(1, 'Dispensing quantity must be at least 1'),
    unit_price: z.number().min(0, 'Unit price cannot be negative'),
    is_substitution: z.boolean().default(false),
    substitution_reason: z.string().optional().or(z.literal('')),
    is_fefo_override: z.boolean().default(false),
    fefo_override_reason: z.string().optional().or(z.literal('')),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.is_substitution) {
        return Boolean(data.substitution_reason && data.substitution_reason.trim().length >= 3);
      }
      return true;
    },
    {
      message: 'A clinical reason is mandatory when dispensing a medicine substitute',
      path: ['substitution_reason'],
    },
  )
  .refine(
    (data) => {
      if (data.is_fefo_override) {
        return Boolean(data.fefo_override_reason && data.fefo_override_reason.trim().length >= 3);
      }
      return true;
    },
    {
      message: 'An audit reason is mandatory when overriding the FEFO earliest-expiring batch',
      path: ['fefo_override_reason'],
    },
  );

export const dispensePrescriptionSchema = z.object({
  prescription_id: z.string().min(1, 'Prescription ID is required'),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().or(z.literal('')),
  items: z
    .array(dispenseItemSchema)
    .min(1, 'At least one medicine item must be selected for dispensing'),
  idempotency_key: z
    .string()
    .min(1, 'Idempotency key is required to prevent duplicate submissions'),
});

export const reverseDispensingSchema = z.object({
  dispensing_record_id: z.string().min(1, 'Dispensing record ID is required'),
  reason: z
    .string()
    .min(5, 'A clinical justification of at least 5 characters is required for reversal'),
});

export type DispenseItemSchema = z.infer<typeof dispenseItemSchema>;
export type DispensePrescriptionSchema = z.infer<typeof dispensePrescriptionSchema>;
export type ReverseDispensingSchema = z.infer<typeof reverseDispensingSchema>;
