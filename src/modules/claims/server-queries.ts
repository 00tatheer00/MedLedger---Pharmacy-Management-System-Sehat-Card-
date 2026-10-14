/**
 * MedLedger — Hospital Claims Server Queries
 *
 * Executes PostgreSQL queries against live Supabase database when configured,
 * or safely uses prototype store in development environment.
 * In staging and production tiers, missing database or query failures throw immediately (fail-closed).
 */

import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { claimsStore } from './prototype-store';
import {
  ClaimWithDetails,
  EligibleDispensingItem,
  ClaimFilterParams,
  PaginatedClaimsResult,
  ClaimOverviewKPIs,
  ClaimPaymentDetail,
  ClaimApprovalDetail,
  ClaimApprovalAction,
} from './types';

export async function fetchEligibleDispensingItems(): Promise<EligibleDispensingItem[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      // In live Supabase mode, retrieve dispensing items that have not yet been fully claimed
      const { data, error } = await supabase.from('dispensing_items').select(`
          id,
          dispensing_record_id,
          dispensed_medicine_id,
          quantity_dispensed,
          unit_price,
          total_price,
          created_at,
          record:dispensing_records(
            id,
            dispensing_number,
            dispensed_at,
            prescription:prescriptions(
              id,
              prescription_number,
              patient:patients(id, full_name, mr_number),
              admission:admissions(id, admission_number, ward, bed_number)
            )
          ),
          medicine:medicines(id, name, strength, dosage_form),
          batch:medicine_batches(id, batch_number, expiry_date),
          claimed_items:claim_items(quantity)
        `);

      if (error) {
        throw new Error(`Database error querying eligible dispensing items: ${error.message}`);
      }

      if (data) {
        type SupabaseDispensingItemResult = {
          id: string;
          dispensing_record_id: string;
          dispensed_medicine_id: string;
          quantity_dispensed: number;
          unit_price: number | string;
          total_price: number | string;
          created_at: string;
          record?: {
            id: string;
            dispensing_number: string;
            dispensed_at: string;
            prescription?: {
              id: string;
              prescription_number: string;
              patient?: { id: string; full_name: string; mr_number: string } | null;
              admission?: {
                id: string;
                admission_number: string;
                ward: string;
                bed_number: string;
              } | null;
            } | null;
          } | null;
          medicine?: { id: string; name: string; strength: string; dosage_form: string } | null;
          batch?: { id: string; batch_number: string; expiry_date: string } | null;
          claimed_items?: Array<{ quantity: number }> | null;
        };

        const rows = data as unknown as SupabaseDispensingItemResult[];
        const eligible: EligibleDispensingItem[] = [];

        for (const row of rows) {
          const claimedQty = (row.claimed_items || []).reduce(
            (sum, ci) => sum + (ci.quantity || 0),
            0,
          );
          const remainingQty = (row.quantity_dispensed || 0) - claimedQty;

          if (remainingQty > 0 && row.record) {
            const rx = row.record.prescription;
            const patient = rx?.patient;
            const admission = rx?.admission;

            eligible.push({
              dispensing_item_id: row.id,
              dispensing_record_id: row.dispensing_record_id,
              dispensing_number: row.record.dispensing_number,
              dispensed_at: row.record.dispensed_at,
              dispensed_by_name: 'Dispensing Pharmacist',
              patient_id: patient?.id || '',
              patient_name: patient?.full_name || 'Walk-in Patient',
              mr_number: patient?.mr_number || '',
              admission_id: admission?.id || null,
              admission_number: admission?.admission_number || null,
              ward: admission?.ward || null,
              bed_number: admission?.bed_number || null,
              prescription_id: rx?.id || '',
              prescription_number: rx?.prescription_number || '',
              medicine_id: row.medicine?.id || row.dispensed_medicine_id,
              medicine_name: row.medicine?.name || 'Dispensed Item',
              strength: row.medicine?.strength || '',
              dosage_form: row.medicine?.dosage_form || '',
              batch_number: row.batch?.batch_number || 'B-STOCK',
              expiry_date: row.batch?.expiry_date || '',
              quantity_dispensed: row.quantity_dispensed,
              already_claimed_quantity: claimedQty,
              claimable_quantity: remainingQty,
              unit_rate: Number(row.unit_price) || 0,
              total_claimable_amount: Number(row.unit_price || 0) * remainingQty,
            });
          }
        }

        return eligible;
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return claimsStore.getEligibleDispensingItems();
}

interface SupabaseClaimRow {
  id: string;
  claim_number: string;
  claim_period_start: string;
  claim_period_end: string;
  total_amount: number;
  approved_amount: number | null;
  status: ClaimWithDetails['status'];
  submitted_by: string;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  submitter?: { full_name?: string } | null;
  items?: Array<{
    id: string;
    claim_id: string;
    dispensing_record_id: string;
    dispensing_item_id: string;
    medicine_id: string;
    quantity: number;
    unit_rate: number;
    total_amount: number;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string | null;
    created_at: string;
    updated_at: string;
    medicine?: { name?: string; strength?: string; dosage_form?: string } | null;
  }>;
  approvals?: Array<{
    id: string;
    claim_id: string;
    action: ClaimApprovalAction;
    approved_by: string;
    approved_amount: number;
    comments: string | null;
    approved_at: string;
  }>;
  payments?: Array<{
    id: string;
    claim_id: string;
    payment_date: string;
    amount: number;
    payment_method?: string;
    reference_number: string | null;
    received_by?: string;
    notes: string | null;
    created_at: string;
  }>;
}

export async function fetchClaims(params: ClaimFilterParams = {}): Promise<PaginatedClaimsResult> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const page = Math.max(1, params.page || 1);
      const pageSize = Math.min(100, Math.max(1, params.pageSize || 10));

      let query = supabase
        .from('claims')
        .select(
          `
          id,
          claim_number,
          claim_period_start,
          claim_period_end,
          total_amount,
          approved_amount,
          status,
          submitted_by,
          submitted_at,
          notes,
          created_at,
          updated_at,
          deleted_at,
          submitter:profiles!submitted_by(full_name),
          items:claim_items(
            id,
            claim_id,
            dispensing_record_id,
            dispensing_item_id,
            medicine_id,
            quantity,
            unit_rate,
            total_amount,
            status,
            rejection_reason,
            created_at,
            updated_at,
            medicine:medicines(name, strength, dosage_form)
          ),
          approvals:claim_approvals(*),
          payments:claim_payments(*)
        `,
          { count: 'exact' },
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }
      if (params.search) {
        query = query.ilike('claim_number', `%${params.search.trim()}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query.range(from, to);
      if (error) {
        throw new Error(`Database error fetching claims: ${error.message}`);
      }

      if (data) {
        const rows = data as unknown as SupabaseClaimRow[];
        const claims: ClaimWithDetails[] = rows.map((row) => {
          const items = (row.items || []).map((it) => ({
            ...it,
            medicine_name: it.medicine?.name || '',
            strength: it.medicine?.strength || '',
            dosage_form: it.medicine?.dosage_form || '',
            dispensing_number: '',
            dispensed_at: '',
            dispensed_by_name: '',
            prescription_id: '',
            prescription_number: '',
            patient_id: '',
            patient_name: '',
            mr_number: '',
            batch_number: '',
            expiry_date: '',
          }));

          const payments: ClaimPaymentDetail[] = (row.payments || []).map((p) => ({
            id: p.id,
            claim_id: p.claim_id,
            payment_date: p.payment_date,
            amount: Number(p.amount || 0),
            payment_method: p.payment_method || 'Bank Transfer (DHQ Treasury)',
            reference_number: p.reference_number,
            received_by: p.received_by || 'usr-treasury-001',
            received_by_name: 'DHQ Treasury Officer',
            notes: p.notes,
            created_at: p.created_at,
          }));

          const approvals: ClaimApprovalDetail[] = (row.approvals || []).map((a) => ({
            id: a.id,
            claim_id: a.claim_id,
            action: a.action,
            approved_by: a.approved_by,
            approved_by_name: 'Hospital Administration',
            approved_amount: Number(a.approved_amount || 0),
            comments: a.comments,
            approved_at: a.approved_at,
          }));

          const totalAmt = Number(row.total_amount || 0);
          const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
          const outstanding = Math.max(0, totalAmt - paidAmount);

          return {
            id: row.id,
            claim_number: row.claim_number,
            claim_period_start: row.claim_period_start,
            claim_period_end: row.claim_period_end,
            total_amount: totalAmt,
            approved_amount: Number(row.approved_amount || 0),
            paid_amount: paidAmount,
            outstanding_balance: outstanding,
            status: row.status,
            submitted_by: row.submitted_by,
            submitted_by_name: row.submitter?.full_name || 'Finance Officer',
            submitted_at: row.submitted_at,
            notes: row.notes,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
            items,
            approvals,
            payments,
            total_items: items.length,
            patient_count: 1,
            dispensing_count: items.length,
          };
        });

        const total = count || claims.length;
        return {
          claims,
          total,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          isLiveDatabase: true,
        };
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return claimsStore.getClaims(params);
}

export async function fetchClaimById(id: string): Promise<ClaimWithDetails | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('claims')
        .select(
          `
          id,
          claim_number,
          claim_period_start,
          claim_period_end,
          total_amount,
          approved_amount,
          status,
          submitted_by,
          submitted_at,
          notes,
          created_at,
          updated_at,
          deleted_at,
          submitter:profiles!submitted_by(full_name),
          items:claim_items(
            id,
            claim_id,
            dispensing_record_id,
            dispensing_item_id,
            medicine_id,
            quantity,
            unit_rate,
            total_amount,
            status,
            rejection_reason,
            created_at,
            updated_at,
            medicine:medicines(name, strength, dosage_form)
          ),
          approvals:claim_approvals(*),
          payments:claim_payments(*)
        `,
        )
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Database error fetching claim ${id}: ${error.message}`);
      }

      if (data) {
        const row = data as unknown as SupabaseClaimRow;
        const items = (row.items || []).map((it) => ({
          ...it,
          medicine_name: it.medicine?.name || '',
          strength: it.medicine?.strength || '',
          dosage_form: it.medicine?.dosage_form || '',
          dispensing_number: '',
          dispensed_at: '',
          dispensed_by_name: '',
          prescription_id: '',
          prescription_number: '',
          patient_id: '',
          patient_name: '',
          mr_number: '',
          batch_number: '',
          expiry_date: '',
        }));

        const payments: ClaimPaymentDetail[] = (row.payments || []).map((p) => ({
          id: p.id,
          claim_id: p.claim_id,
          payment_date: p.payment_date,
          amount: Number(p.amount || 0),
          payment_method: p.payment_method || 'Bank Transfer (DHQ Treasury)',
          reference_number: p.reference_number,
          received_by: p.received_by || 'usr-treasury-001',
          received_by_name: 'DHQ Treasury Officer',
          notes: p.notes,
          created_at: p.created_at,
        }));

        const approvals: ClaimApprovalDetail[] = (row.approvals || []).map((a) => ({
          id: a.id,
          claim_id: a.claim_id,
          action: a.action,
          approved_by: a.approved_by,
          approved_by_name: 'Hospital Administration',
          approved_amount: Number(a.approved_amount || 0),
          comments: a.comments,
          approved_at: a.approved_at,
        }));

        const totalAmt = Number(row.total_amount || 0);
        const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const outstanding = Math.max(0, totalAmt - paidAmount);

        return {
          id: row.id,
          claim_number: row.claim_number,
          claim_period_start: row.claim_period_start,
          claim_period_end: row.claim_period_end,
          total_amount: totalAmt,
          approved_amount: Number(row.approved_amount || 0),
          paid_amount: paidAmount,
          outstanding_balance: outstanding,
          status: row.status,
          submitted_by: row.submitted_by,
          submitted_by_name: row.submitter?.full_name || 'Finance Officer',
          submitted_at: row.submitted_at,
          notes: row.notes,
          created_at: row.created_at,
          updated_at: row.updated_at,
          deleted_at: row.deleted_at,
          items,
          approvals,
          payments,
          total_items: items.length,
          patient_count: 1,
          dispensing_count: items.length,
        };
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return claimsStore.getClaimById(id);
}

export async function fetchClaimsKPIs(): Promise<ClaimOverviewKPIs> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('claims')
        .select('total_amount, approved_amount, status, payments:claim_payments(amount)')
        .is('deleted_at', null);

      if (error) {
        throw new Error(`Database error fetching claims KPIs: ${error.message}`);
      }

      if (data) {
        type ClaimKPIRow = {
          total_amount: number;
          approved_amount: number | null;
          status: string;
          payments?: Array<{ amount: number }>;
        };

        const claims = data as unknown as ClaimKPIRow[];
        const totalClaimsCount = claims.length;
        let submittedCount = 0;
        let underReviewCount = 0;
        let approvedCount = 0;
        let rejectedCount = 0;
        let totalSubmittedAmount = 0;
        let totalApprovedAmount = 0;
        let totalReimbursementCollected = 0;

        claims.forEach((c) => {
          const amt = Number(c.total_amount || 0);
          const approved = Number(c.approved_amount || 0);
          totalSubmittedAmount += amt;
          totalApprovedAmount += approved;

          if (c.status === 'submitted') submittedCount++;
          if (c.status === 'under_review') underReviewCount++;
          if (c.status === 'approved' || c.status === 'partially_approved' || c.status === 'paid')
            approvedCount++;
          if (c.status === 'rejected') rejectedCount++;

          const payments = c.payments || [];
          payments.forEach((p) => {
            totalReimbursementCollected += Number(p.amount || 0);
          });
        });

        const totalOutstanding = Math.max(0, totalSubmittedAmount - totalReimbursementCollected);

        return {
          total_claims_count: totalClaimsCount,
          submitted_claims_count: submittedCount,
          under_review_count: underReviewCount,
          approved_claims_count: approvedCount,
          rejected_claims_count: rejectedCount,
          total_submitted_amount: totalSubmittedAmount,
          total_approved_amount: totalApprovedAmount,
          total_reimbursement_collected: totalReimbursementCollected,
          total_outstanding_balance: totalOutstanding,
        };
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return claimsStore.getOverviewKPIs();
}
