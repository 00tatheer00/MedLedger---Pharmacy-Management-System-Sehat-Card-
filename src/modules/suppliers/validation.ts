/**
 * MedLedger — Supplier Validation Schemas
 *
 * Enforces server-side validation for pharmaceutical distributor registration.
 * Tax identifiers (NTN) and regulatory numbers are optional.
 */

import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Supplier name must be at least 2 characters.')
    .max(200, 'Supplier name cannot exceed 200 characters.'),
  contact_person: z
    .string()
    .trim()
    .max(150, 'Contact person name cannot exceed 150 characters.')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number cannot exceed 30 characters.')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .max(150, 'Email cannot exceed 150 characters.')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(500, 'Address cannot exceed 500 characters.')
    .optional()
    .or(z.literal('')),
  ntn_number: z
    .string()
    .trim()
    .max(50, 'NTN number cannot exceed 50 characters.')
    .optional()
    .or(z.literal('')),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const supplierFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateSupplierSchemaType = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierSchemaType = z.infer<typeof updateSupplierSchema>;
export type SupplierFilterSchemaType = z.infer<typeof supplierFilterSchema>;
