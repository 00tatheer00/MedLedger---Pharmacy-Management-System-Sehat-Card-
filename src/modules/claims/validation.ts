/**
 * MedLedger — Hospital Claims Validation Schemas
 *
 * Implements authoritative runtime validation for claim preparation,
 * submission, review decisions, and reimbursement payment recordings using Zod.
 */

import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createClaimItemSchema = z.object({
  dispensing_item_id: z.string().min(1, 'Dispensing item reference is required'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than zero'),
  unit_rate: z.number().min(0, 'Unit rate cannot be negative').optional(),
});

export const createClaimSchema = z
  .object({
    claim_period_start: z.string().regex(dateRegex, 'Start date must be in YYYY-MM-DD format'),
    claim_period_end: z.string().regex(dateRegex, 'End date must be in YYYY-MM-DD format'),
    status: z.enum(['draft', 'submitted']).default('draft'),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').nullable().optional(),
    items: z
      .array(createClaimItemSchema)
      .min(1, 'A claim must contain at least one eligible dispensing item'),
  })
  .refine((data) => data.claim_period_end >= data.claim_period_start, {
    message: 'Claim period end date cannot be earlier than start date',
    path: ['claim_period_end'],
  });

export const submitClaimSchema = z.object({
  claim_id: z.string().min(1, 'Claim ID is required'),
});

export const reviewClaimItemSchema = z.object({
  claim_item_id: z.string().min(1, 'Claim item ID is required'),
  status: z.enum(['pending', 'approved', 'rejected']),
  rejection_reason: z.string().nullable().optional(),
});

export const reviewClaimSchema = z
  .object({
    claim_id: z.string().min(1, 'Claim ID is required'),
    action: z.enum(['approved', 'partially_approved', 'rejected', 'returned']),
    approved_amount: z.number().min(0, 'Approved amount cannot be negative'),
    comments: z.string(),
    item_reviews: z.array(reviewClaimItemSchema).optional(),
  })
  .refine(
    (data) => {
      if (['rejected', 'returned', 'partially_approved'].includes(data.action)) {
        return data.comments && data.comments.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Comments are mandatory when rejecting, returning, or partially approving a claim',
      path: ['comments'],
    },
  )
  .refine(
    (data) => {
      if (data.action === 'rejected' && data.approved_amount > 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Approved amount must be 0 for rejected claims',
      path: ['approved_amount'],
    },
  );

export const recordClaimPaymentSchema = z.object({
  claim_id: z.string().min(1, 'Claim ID is required'),
  payment_date: z.string().regex(dateRegex, 'Payment date must be in YYYY-MM-DD format'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  payment_method: z.string().min(1, 'Payment method is required'),
  reference_number: z.string().nullable().optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').nullable().optional(),
});
