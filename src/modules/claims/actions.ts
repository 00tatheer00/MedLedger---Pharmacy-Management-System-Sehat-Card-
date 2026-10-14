'use server';

/**
 * MedLedger — Hospital Claims Server Actions
 *
 * Implements server-side actions for reimbursement claim compilation,
 * submission, review decisions, and reimbursement payment recordings with RBAC & audit logging.
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/core/auth';
import { requirePermission } from '@/core/authorization';
import { auditLogger } from '@/core/audit';
import { isSupabaseConfigured } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import {
  createClaimSchema,
  submitClaimSchema,
  reviewClaimSchema,
  recordClaimPaymentSchema,
} from './validation';
import { claimsStore } from './prototype-store';
import {
  fetchEligibleDispensingItems,
  fetchClaims,
  fetchClaimById,
  fetchClaimsKPIs,
} from './server-queries';
import {
  ClaimWithDetails,
  EligibleDispensingItem,
  PaginatedClaimsResult,
  ClaimOverviewKPIs,
  ClaimFilterParams,
  ClaimPaymentDetail,
} from './types';

// ==========================================
// 1. Fetch Eligible Dispensing Items Action
// ==========================================

export async function getEligibleDispensingItemsAction(): Promise<{
  success: boolean;
  data?: EligibleDispensingItem[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'claims:read');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const items = await fetchEligibleDispensingItems();
    return { success: true, data: items };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch eligible dispensing items';
    return { success: false, error: message };
  }
}

// ==========================================
// 2. Create Claim Action
// ==========================================

export async function createClaimAction(
  rawInput: unknown,
): Promise<{ success: boolean; data?: ClaimWithDetails; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'claims:manage');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const parsed = createClaimSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { success: false, error: `${issue.path.join('.')}: ${issue.message}` };
    }

    const input = parsed.data;
    const actor = {
      id: user?.id || 'usr-finance-001',
      name: user?.fullName || 'Finance & Billing Staff',
    };

    let result: ClaimWithDetails;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) throw new Error('Supabase client unavailable');

      const { data: claimId, error: rpcError } = await supabase.rpc('fn_create_claim_atomic', {
        p_claim_period_start: input.claim_period_start,
        p_claim_period_end: input.claim_period_end,
        p_notes: input.notes || null,
        p_items: input.items,
        p_submitted_by: actor.id,
        p_status: input.status,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const fetched = await fetchClaimById(claimId as string);
      if (!fetched) throw new Error('Claim created but failed to load');
      result = fetched;
    } else {
      result = claimsStore.createClaim(input, actor);
    }

    await auditLogger.log({
      eventType: 'claim_created',
      entityType: 'claims',
      entityId: result.id,
      userId: actor.id,
      action: 'create',
      newValues: {
        claim_number: result.claim_number,
        status: result.status,
        total_amount: result.total_amount,
        items_count: result.items.length,
      },
    });

    revalidatePath('/claims');
    revalidatePath(`/claims/${result.id}`);

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create reimbursement claim';
    return { success: false, error: message };
  }
}

// ==========================================
// 3. Submit Claim Action
// ==========================================

export async function submitClaimAction(
  rawInput: unknown,
): Promise<{ success: boolean; data?: ClaimWithDetails; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'claims:manage');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const parsed = submitClaimSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const actor = {
      id: user?.id || 'usr-finance-001',
      name: user?.fullName || 'Finance & Billing Staff',
    };

    let result: ClaimWithDetails;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) throw new Error('Supabase client unavailable');

      const { error: updateError } = await supabase
        .from('claims')
        .update({
          status: 'submitted',
          submitted_by: actor.id,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', parsed.data.claim_id);

      if (updateError) throw new Error(updateError.message);

      const fetched = await fetchClaimById(parsed.data.claim_id);
      if (!fetched) throw new Error('Claim submitted but failed to reload');
      result = fetched;
    } else {
      result = claimsStore.submitClaim(parsed.data.claim_id, actor);
    }

    await auditLogger.log({
      eventType: 'claim_submitted',
      entityType: 'claims',
      entityId: result.id,
      userId: actor.id,
      action: 'update',
      newValues: {
        claim_number: result.claim_number,
        status: result.status,
      },
    });

    revalidatePath('/claims');
    revalidatePath(`/claims/${result.id}`);

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit claim';
    return { success: false, error: message };
  }
}

// ==========================================
// 4. Review Claim Action
// ==========================================

export async function reviewClaimAction(
  rawInput: unknown,
): Promise<{ success: boolean; data?: ClaimWithDetails; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'claims:manage');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const parsed = reviewClaimSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { success: false, error: `${issue.path.join('.')}: ${issue.message}` };
    }

    const input = parsed.data;
    const actor = {
      id: user?.id || 'usr-admin-001',
      name: user?.fullName || 'Hospital Reviewer',
    };

    let result: ClaimWithDetails;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) throw new Error('Supabase client unavailable');

      const { error: rpcError } = await supabase.rpc('fn_review_claim_atomic', {
        p_claim_id: input.claim_id,
        p_action: input.action,
        p_approved_amount: input.approved_amount,
        p_comments: input.comments,
        p_approved_by: actor.id,
        p_item_reviews: input.item_reviews || [],
      });

      if (rpcError) throw new Error(rpcError.message);

      const fetched = await fetchClaimById(input.claim_id);
      if (!fetched) throw new Error('Claim reviewed but failed to reload');
      result = fetched;
    } else {
      result = claimsStore.reviewClaim(input, actor);
    }

    await auditLogger.log({
      eventType: 'claim_reviewed',
      entityType: 'claims',
      entityId: result.id,
      userId: actor.id,
      action: input.action === 'rejected' ? 'reject' : 'approve',
      newValues: {
        claim_number: result.claim_number,
        action: input.action,
        status: result.status,
        approved_amount: result.approved_amount,
        comments: input.comments,
      },
    });

    revalidatePath('/claims');
    revalidatePath(`/claims/${result.id}`);

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to review claim';
    return { success: false, error: message };
  }
}

// ==========================================
// 5. Record Claim Payment Action
// ==========================================

export async function recordClaimPaymentAction(
  rawInput: unknown,
): Promise<{ success: boolean; data?: ClaimPaymentDetail; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'claims:manage');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const parsed = recordClaimPaymentSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { success: false, error: `${issue.path.join('.')}: ${issue.message}` };
    }

    const input = parsed.data;
    const actor = {
      id: user?.id || 'usr-finance-001',
      name: user?.fullName || 'Finance & Billing Staff',
    };

    let paymentRecord: ClaimPaymentDetail;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) throw new Error('Supabase client unavailable');

      const { data: paymentId, error: rpcError } = await supabase.rpc(
        'fn_record_claim_payment_atomic',
        {
          p_claim_id: input.claim_id,
          p_payment_date: input.payment_date,
          p_amount: input.amount,
          p_payment_method: input.payment_method,
          p_reference_number: input.reference_number || null,
          p_received_by: actor.id,
          p_notes: input.notes || null,
        },
      );

      if (rpcError) throw new Error(rpcError.message);

      const claim = await fetchClaimById(input.claim_id);
      const matched = claim?.payments.find((p) => p.id === paymentId);
      paymentRecord = matched || {
        id: paymentId as string,
        claim_id: input.claim_id,
        payment_date: input.payment_date,
        amount: input.amount,
        payment_method: input.payment_method,
        reference_number: input.reference_number || null,
        received_by: actor.id,
        received_by_name: actor.name,
        notes: input.notes || null,
        created_at: new Date().toISOString(),
      };
    } else {
      paymentRecord = claimsStore.recordPayment(input, actor);
    }

    await auditLogger.log({
      eventType: 'claim_payment_recorded',
      entityType: 'claim_payments',
      entityId: paymentRecord.id,
      userId: actor.id,
      action: 'create',
      newValues: {
        claim_id: input.claim_id,
        amount: input.amount,
        payment_method: input.payment_method,
        reference_number: input.reference_number,
      },
    });

    revalidatePath('/claims');
    revalidatePath(`/claims/${input.claim_id}`);

    return { success: true, data: paymentRecord };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to record reimbursement payment';
    return { success: false, error: message };
  }
}

// ==========================================
// 6. Query Actions
// ==========================================

export async function getClaimsAction(
  params: ClaimFilterParams = {},
): Promise<{ success: boolean; data?: PaginatedClaimsResult; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'claims:read');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const result = await fetchClaims(params);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch claims';
    return { success: false, error: message };
  }
}

export async function getClaimByIdAction(
  id: string,
): Promise<{ success: boolean; data?: ClaimWithDetails | null; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'claims:read');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const claim = await fetchClaimById(id);
    return { success: true, data: claim };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch claim details';
    return { success: false, error: message };
  }
}

export async function getClaimsOverviewKPIsAction(): Promise<{
  success: boolean;
  data?: ClaimOverviewKPIs;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'claims:read');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const kpis = await fetchClaimsKPIs();
    return { success: true, data: kpis };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch claim KPIs';
    return { success: false, error: message };
  }
}
