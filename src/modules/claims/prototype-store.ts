/**
 * MedLedger — Hospital Claims Prototype Store
 *
 * Implements high-fidelity, in-memory reimbursement claim processing,
 * exact dispensing traceability, duplicate claim prevention, full lifecycle transitions,
 * approval reviews, and payment allocations.
 */

import {
  ClaimStatus,
  ClaimWithDetails,
  ClaimItemDetail,
  ClaimPaymentDetail,
  EligibleDispensingItem,
  CreateClaimInput,
  ReviewClaimInput,
  RecordClaimPaymentInput,
  ClaimFilterParams,
  PaginatedClaimsResult,
  ClaimOverviewKPIs,
} from './types';
import { dispensingStore } from '@/modules/dispensing/prototype-store';
import { multiplyMoney, addMoney, subtractMoney } from '@/lib/decimal';

// Seed initial claims demonstrating realistic DHQ Hospital reimbursement scenarios
export const initialClaimsData: ClaimWithDetails[] = [
  {
    id: 'clm-001-kohat',
    claim_number: 'CLM-20261011-0001',
    claim_period_start: '2026-10-01',
    claim_period_end: '2026-10-10',
    total_amount: 1840.0,
    approved_amount: 1840.0,
    paid_amount: 1000.0,
    outstanding_balance: 840.0,
    status: 'partially_paid',
    submitted_by: 'usr-finance-001',
    submitted_by_name: 'Ayesha Malik (Finance Officer)',
    submitted_at: '2026-10-11T09:30:00.000Z',
    notes: 'Inpatient cardiology and trauma emergency reimbursement claim for early October batch.',
    created_at: '2026-10-11T09:15:00.000Z',
    updated_at: '2026-10-12T16:00:00.000Z',
    deleted_at: null,
    total_items: 2,
    patient_count: 1,
    dispensing_count: 1,
    items: [
      {
        id: 'clmi-001-01',
        claim_id: 'clm-001-kohat',
        dispensing_record_id: 'dsp-seed-001',
        dispensing_item_id: 'dspi-seed-001-01',
        medicine_id: 'med-002',
        quantity: 4,
        unit_rate: 250.0,
        total_amount: 1000.0,
        status: 'approved',
        rejection_reason: null,
        created_at: '2026-10-11T09:15:00.000Z',
        updated_at: '2026-10-12T11:00:00.000Z',
        dispensing_number: 'DSP-20261009-0814',
        dispensed_at: '2026-10-09T14:20:00.000Z',
        dispensed_by_name: 'Dr. Tariq Khan (Pharmacist)',
        prescription_id: 'rx-seed-001',
        prescription_number: 'RX-2026-0038',
        patient_id: 'pat-seed-001',
        patient_name: 'Sardar Ali Khan',
        mr_number: 'MRN-2026-00085',
        admission_id: 'adm-seed-001',
        admission_number: 'ADM-2026-0391',
        ssp_visit_no: '37634827',
        ward: 'Surgical ICU',
        bed_number: 'Bed 04',
        medicine_name: 'Ceftriaxone 1g',
        strength: '1g',
        dosage_form: 'Vial',
        batch_number: 'CTX-2026-08',
        expiry_date: '2027-08-20',
      },
      {
        id: 'clmi-001-02',
        claim_id: 'clm-001-kohat',
        dispensing_record_id: 'dsp-seed-001',
        dispensing_item_id: 'dspi-seed-001-02',
        medicine_id: 'med-005',
        quantity: 60,
        unit_rate: 14.0,
        total_amount: 840.0,
        status: 'approved',
        rejection_reason: null,
        created_at: '2026-10-11T09:15:00.000Z',
        updated_at: '2026-10-12T11:00:00.000Z',
        dispensing_number: 'DSP-20261009-0814',
        dispensed_at: '2026-10-09T14:20:00.000Z',
        dispensed_by_name: 'Dr. Tariq Khan (Pharmacist)',
        prescription_id: 'rx-seed-001',
        prescription_number: 'RX-2026-0038',
        patient_id: 'pat-seed-001',
        patient_name: 'Sardar Ali Khan',
        mr_number: 'MRN-2026-00085',
        admission_id: 'adm-seed-001',
        admission_number: 'ADM-2026-0391',
        ssp_visit_no: '37634827',
        ward: 'Surgical ICU',
        bed_number: 'Bed 04',
        medicine_name: 'Omeprazole 20mg',
        strength: '20mg',
        dosage_form: 'Capsule',
        batch_number: 'OMP-2026-02',
        expiry_date: '2027-06-30',
      },
    ],
    approvals: [
      {
        id: 'clma-001-01',
        claim_id: 'clm-001-kohat',
        action: 'approved',
        approved_by: 'usr-admin-001',
        approved_by_name: 'Dr. Bilal Qureshi (Medical Superintendent)',
        approved_amount: 1840.0,
        comments: 'Verified against surgical ICU emergency inpatient records. Full claim approved.',
        approved_at: '2026-10-12T11:00:00.000Z',
      },
    ],
    payments: [
      {
        id: 'clmp-001-01',
        claim_id: 'clm-001-kohat',
        payment_date: '2026-10-12',
        amount: 1000.0,
        payment_method: 'Bank Transfer (DHQ Treasury)',
        reference_number: 'NBP-KOH-TX-849102',
        received_by: 'usr-finance-001',
        received_by_name: 'Ayesha Malik (Finance Officer)',
        notes: 'First installment released from District Treasury healthcare fund.',
        created_at: '2026-10-12T16:00:00.000Z',
      },
    ],
  },
  {
    id: 'clm-002-kohat',
    claim_number: 'CLM-20261012-0002',
    claim_period_start: '2026-10-05',
    claim_period_end: '2026-10-12',
    total_amount: 3250.0,
    approved_amount: 0,
    paid_amount: 0,
    outstanding_balance: 0,
    status: 'under_review',
    submitted_by: 'usr-finance-001',
    submitted_by_name: 'Ayesha Malik (Finance Officer)',
    submitted_at: '2026-10-12T14:15:00.000Z',
    notes: 'Weekly general ward antibiotic & analgesic dispensing reconciliation.',
    created_at: '2026-10-12T13:45:00.000Z',
    updated_at: '2026-10-12T14:15:00.000Z',
    deleted_at: null,
    total_items: 1,
    patient_count: 1,
    dispensing_count: 1,
    items: [
      {
        id: 'clmi-002-01',
        claim_id: 'clm-002-kohat',
        dispensing_record_id: 'dsp-seed-002',
        dispensing_item_id: 'dspi-seed-002-01',
        medicine_id: 'med-002',
        quantity: 13,
        unit_rate: 250.0,
        total_amount: 3250.0,
        status: 'pending',
        rejection_reason: null,
        created_at: '2026-10-12T13:45:00.000Z',
        updated_at: '2026-10-12T13:45:00.000Z',
        dispensing_number: 'DSP-20261010-0391',
        dispensed_at: '2026-10-10T11:00:00.000Z',
        dispensed_by_name: 'Dr. Tariq Khan (Pharmacist)',
        prescription_id: 'rx-seed-002',
        prescription_number: 'RX-2026-0039',
        patient_id: 'pat-seed-002',
        patient_name: 'Gulzar Bibi',
        mr_number: 'MRN-2026-00092',
        admission_id: 'adm-seed-002',
        admission_number: 'ADM-2026-0402',
        ward: 'Female Medical Ward',
        bed_number: 'Bed 08',
        medicine_name: 'Ceftriaxone 1g',
        strength: '1g',
        dosage_form: 'Vial',
        batch_number: 'CTX-2026-08',
        expiry_date: '2027-08-20',
      },
    ],
    approvals: [],
    payments: [],
  },
];

class ClaimsPrototypeStore {
  private claims: ClaimWithDetails[] = JSON.parse(JSON.stringify(initialClaimsData));

  /**
   * Returns all finalized, completed dispensing items that have remaining claimable quantity.
   */
  public getEligibleDispensingItems(): EligibleDispensingItem[] {
    const dispensingResult = dispensingStore.getDispensingRecords({ pageSize: 1000 });
    const eligibleList: EligibleDispensingItem[] = [];

    // Tally claimed quantities across all active claims
    const claimedQuantityMap = new Map<string, number>();
    for (const claim of this.claims) {
      if (claim.deleted_at) continue;
      // Exclude rejected and cancelled claims from consuming claimable quota
      if (claim.status === 'cancelled' || claim.status === 'rejected') continue;

      for (const item of claim.items) {
        const current = claimedQuantityMap.get(item.dispensing_item_id) || 0;
        claimedQuantityMap.set(item.dispensing_item_id, current + item.quantity);
      }
    }

    for (const record of dispensingResult.records) {
      // Must be finalized/completed (not reversed)
      if (record.status !== 'completed') continue;

      for (const item of record.items) {
        const alreadyClaimed = claimedQuantityMap.get(item.id) || 0;
        const claimableQty = item.quantity_dispensed - alreadyClaimed;

        if (claimableQty > 0) {
          eligibleList.push({
            dispensing_record_id: record.id,
            dispensing_number: record.dispensing_number,
            dispensing_item_id: item.id,
            dispensed_at: record.dispensed_at,
            dispensed_by_name: record.dispensed_by_name,
            prescription_id: record.prescription_id,
            prescription_number: record.prescription_number,
            patient_id: record.patient_id,
            patient_name: record.patient_name,
            mr_number: record.mr_number,
            admission_id: record.admission_id || null,
            admission_number: record.admission_number || null,
            ssp_visit_no: record.ssp_visit_no || null,
            ward: record.ward || null,
            bed_number: record.bed_number || null,
            medicine_id: item.dispensed_medicine_id,
            medicine_name: item.dispensed_medicine_name,
            strength: item.strength,
            dosage_form: item.dosage_form,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            quantity_dispensed: item.quantity_dispensed,
            already_claimed_quantity: alreadyClaimed,
            claimable_quantity: claimableQty,
            unit_rate: item.unit_price,
            total_claimable_amount: multiplyMoney(claimableQty, item.unit_price),
          });
        }
      }
    }

    return eligibleList;
  }

  /**
   * Prepares and creates a new hospital reimbursement claim.
   * Concurrency-safe: validates remaining claimable quota before committing.
   * CRITICAL INVARIANT: NEVER touches inventory stock movements or batch quantities.
   */
  public createClaim(
    input: CreateClaimInput,
    actor: { id: string; name: string },
  ): ClaimWithDetails {
    if (!input.items || input.items.length === 0) {
      throw new Error('A claim must contain at least one eligible dispensing line item.');
    }

    if (input.claim_period_end < input.claim_period_start) {
      throw new Error(
        `Claim period end date (${input.claim_period_end}) cannot be earlier than start date (${input.claim_period_start}).`,
      );
    }

    const eligibleItems = this.getEligibleDispensingItems();
    const eligibleMap = new Map<string, EligibleDispensingItem>(
      eligibleItems.map((e) => [e.dispensing_item_id, e]),
    );

    const claimId = `clm-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const claimNumber = `CLM-${dateStr}-${randomSuffix}`;

    const claimLineItems: ClaimItemDetail[] = [];
    const distinctPatients = new Set<string>();
    const distinctDispensings = new Set<string>();
    let runningTotal = 0;

    for (const reqItem of input.items) {
      if (reqItem.quantity <= 0) {
        throw new Error('Claimed quantity must be greater than zero.');
      }

      const eligible = eligibleMap.get(reqItem.dispensing_item_id);
      if (!eligible) {
        throw new Error(
          `Dispensing item "${reqItem.dispensing_item_id}" is not eligible for claiming or has already been fully claimed.`,
        );
      }

      if (reqItem.quantity > eligible.claimable_quantity) {
        throw new Error(
          `Requested claim quantity (${reqItem.quantity}) for "${eligible.medicine_name}" exceeds the remaining claimable quantity (${eligible.claimable_quantity}).`,
        );
      }

      const unitRate = reqItem.unit_rate !== undefined ? reqItem.unit_rate : eligible.unit_rate;
      if (unitRate < 0) {
        throw new Error('Unit rate cannot be negative.');
      }

      const lineTotal = multiplyMoney(reqItem.quantity, unitRate);
      runningTotal = addMoney(runningTotal, lineTotal);

      distinctPatients.add(eligible.patient_id);
      distinctDispensings.add(eligible.dispensing_record_id);

      claimLineItems.push({
        id: `clmi-${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`,
        claim_id: claimId,
        dispensing_record_id: eligible.dispensing_record_id,
        dispensing_item_id: eligible.dispensing_item_id,
        medicine_id: eligible.medicine_id,
        quantity: reqItem.quantity,
        unit_rate: unitRate,
        total_amount: lineTotal,
        status: 'pending',
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dispensing_number: eligible.dispensing_number,
        dispensed_at: eligible.dispensed_at,
        dispensed_by_name: eligible.dispensed_by_name,
        prescription_id: eligible.prescription_id,
        prescription_number: eligible.prescription_number,
        patient_id: eligible.patient_id,
        patient_name: eligible.patient_name,
        mr_number: eligible.mr_number,
        admission_id: eligible.admission_id,
        admission_number: eligible.admission_number,
        ssp_visit_no: eligible.ssp_visit_no || null,
        ward: eligible.ward,
        bed_number: eligible.bed_number,
        medicine_name: eligible.medicine_name,
        strength: eligible.strength,
        dosage_form: eligible.dosage_form,
        batch_number: eligible.batch_number,
        expiry_date: eligible.expiry_date,
      });
    }

    const isSubmitted = input.status === 'submitted';
    const nowIso = new Date().toISOString();

    const newClaim: ClaimWithDetails = {
      id: claimId,
      claim_number: claimNumber,
      claim_period_start: input.claim_period_start,
      claim_period_end: input.claim_period_end,
      total_amount: runningTotal,
      approved_amount: 0,
      paid_amount: 0,
      outstanding_balance: 0,
      status: isSubmitted ? 'submitted' : 'draft',
      submitted_by: isSubmitted ? actor.id : null,
      submitted_by_name: isSubmitted ? actor.name : null,
      submitted_at: isSubmitted ? nowIso : null,
      notes: input.notes || null,
      created_at: nowIso,
      updated_at: nowIso,
      deleted_at: null,
      items: claimLineItems,
      approvals: [],
      payments: [],
      total_items: claimLineItems.length,
      patient_count: distinctPatients.size,
      dispensing_count: distinctDispensings.size,
    };

    this.claims.unshift(newClaim);
    return newClaim;
  }

  /**
   * Submits a draft or returned claim for hospital reimbursement review.
   */
  public submitClaim(claimId: string, actor: { id: string; name: string }): ClaimWithDetails {
    const claim = this.claims.find((c) => c.id === claimId && !c.deleted_at);
    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    if (claim.status !== 'draft' && claim.status !== 'returned') {
      throw new Error(
        `Cannot submit claim ${claim.claim_number} with status "${claim.status}". Only draft or returned claims can be submitted.`,
      );
    }

    const nowIso = new Date().toISOString();
    claim.status = 'submitted';
    claim.submitted_by = actor.id;
    claim.submitted_by_name = actor.name;
    claim.submitted_at = nowIso;
    claim.updated_at = nowIso;

    return claim;
  }

  /**
   * Reviews and records an approval/rejection decision on a submitted claim.
   */
  public reviewClaim(
    input: ReviewClaimInput,
    actor: { id: string; name: string },
  ): ClaimWithDetails {
    const claim = this.claims.find((c) => c.id === input.claim_id && !c.deleted_at);
    if (!claim) {
      throw new Error(`Claim not found: ${input.claim_id}`);
    }

    if (claim.status !== 'submitted' && claim.status !== 'under_review') {
      throw new Error(
        `Cannot review claim ${claim.claim_number} with status "${claim.status}". Claim must be submitted or under review.`,
      );
    }

    if (
      ['rejected', 'returned', 'partially_approved'].includes(input.action) &&
      (!input.comments || input.comments.trim().length === 0)
    ) {
      throw new Error(
        'Comments are mandatory when rejecting, returning, or partially approving a claim.',
      );
    }

    const nowIso = new Date().toISOString();
    let newStatus: ClaimStatus = claim.status;
    let approvedAmt = 0;

    if (input.action === 'rejected') {
      newStatus = 'rejected';
      approvedAmt = 0;
      claim.items.forEach((it) => {
        it.status = 'rejected';
        it.rejection_reason = input.comments;
        it.updated_at = nowIso;
      });
    } else if (input.action === 'returned') {
      newStatus = 'returned';
      approvedAmt = 0;
    } else if (input.action === 'approved') {
      newStatus = 'approved';
      if (input.approved_amount > claim.total_amount) {
        throw new Error(
          `Approved amount (PKR ${input.approved_amount}) cannot exceed submitted total (PKR ${claim.total_amount}).`,
        );
      }
      approvedAmt = input.approved_amount;
      claim.items.forEach((it) => {
        it.status = 'approved';
        it.updated_at = nowIso;
      });
    } else if (input.action === 'partially_approved') {
      newStatus = 'partially_approved';
      if (input.approved_amount <= 0 || input.approved_amount >= claim.total_amount) {
        throw new Error(
          `Partially approved amount (PKR ${input.approved_amount}) must be greater than zero and less than submitted total (PKR ${claim.total_amount}).`,
        );
      }
      approvedAmt = input.approved_amount;

      if (input.item_reviews && input.item_reviews.length > 0) {
        const reviewMap = new Map(input.item_reviews.map((r) => [r.claim_item_id, r]));
        claim.items.forEach((it) => {
          const rev = reviewMap.get(it.id);
          if (rev) {
            it.status = rev.status;
            it.rejection_reason = rev.rejection_reason || null;
            it.updated_at = nowIso;
          }
        });
      }
    }

    claim.status = newStatus;
    claim.approved_amount = approvedAmt;
    claim.outstanding_balance = subtractMoney(approvedAmt, claim.paid_amount);
    claim.updated_at = nowIso;

    claim.approvals.push({
      id: `clma-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      claim_id: claim.id,
      action: input.action,
      approved_by: actor.id,
      approved_by_name: actor.name,
      approved_amount: approvedAmt,
      comments: input.comments,
      approved_at: nowIso,
    });

    return claim;
  }

  /**
   * Records a reimbursement payment received from DHQ Hospital for an approved claim.
   * Concurrency-safe: prevents over-payment against the approved amount.
   */
  public recordPayment(
    input: RecordClaimPaymentInput,
    actor: { id: string; name: string },
  ): ClaimPaymentDetail {
    if (input.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const claim = this.claims.find((c) => c.id === input.claim_id && !c.deleted_at);
    if (!claim) {
      throw new Error(`Claim not found: ${input.claim_id}`);
    }

    if (!['approved', 'partially_approved', 'partially_paid'].includes(claim.status)) {
      throw new Error(
        `Cannot record payment for claim ${claim.claim_number} with status "${claim.status}". Claim must be approved, partially approved, or partially paid.`,
      );
    }

    const outstanding = subtractMoney(claim.approved_amount, claim.paid_amount);
    if (input.amount > outstanding) {
      throw new Error(
        `Payment of PKR ${input.amount.toFixed(2)} exceeds outstanding balance of PKR ${outstanding.toFixed(2)} (Approved: PKR ${claim.approved_amount.toFixed(2)}, Already Paid: PKR ${claim.paid_amount.toFixed(2)}).`,
      );
    }

    const nowIso = new Date().toISOString();
    const newPaidTotal = addMoney(claim.paid_amount, input.amount);

    const paymentRecord: ClaimPaymentDetail = {
      id: `clmp-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      claim_id: claim.id,
      payment_date: input.payment_date,
      amount: input.amount,
      payment_method: input.payment_method,
      reference_number: input.reference_number || null,
      received_by: actor.id,
      received_by_name: actor.name,
      notes: input.notes || null,
      created_at: nowIso,
    };

    claim.payments.push(paymentRecord);
    claim.paid_amount = newPaidTotal;
    claim.outstanding_balance = subtractMoney(claim.approved_amount, newPaidTotal);
    claim.status = claim.outstanding_balance <= 0 ? 'paid' : 'partially_paid';
    claim.updated_at = nowIso;

    return paymentRecord;
  }

  /**
   * Query filter and search across claims.
   */
  public getClaims(params: ClaimFilterParams = {}): PaginatedClaimsResult {
    let filtered = [...this.claims].filter((c) => !c.deleted_at);

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.claim_number.toLowerCase().includes(q) ||
          (c.submitted_by_name && c.submitted_by_name.toLowerCase().includes(q)) ||
          c.items.some(
            (it) =>
              it.patient_name.toLowerCase().includes(q) ||
              it.mr_number.toLowerCase().includes(q) ||
              it.dispensing_number.toLowerCase().includes(q) ||
              it.medicine_name.toLowerCase().includes(q),
          ),
      );
    }

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((c) => c.status === params.status);
    }

    if (params.date_from) {
      filtered = filtered.filter((c) => c.claim_period_start >= params.date_from!);
    }

    if (params.date_to) {
      filtered = filtered.filter((c) => c.claim_period_end <= params.date_to!);
    }

    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paginatedRecords = filtered.slice(start, start + pageSize);

    return {
      claims: paginatedRecords,
      total,
      page,
      pageSize,
      totalPages,
      isLiveDatabase: false,
    };
  }

  /**
   * Fetches a single claim by its unique ID.
   */
  public getClaimById(id: string): ClaimWithDetails | null {
    const claim = this.claims.find((c) => c.id === id && !c.deleted_at);
    if (!claim) return null;
    return JSON.parse(JSON.stringify(claim));
  }

  /**
   * Aggregates financial overview KPIs for hospital claims.
   */
  public getOverviewKPIs(): ClaimOverviewKPIs {
    const activeClaims = this.claims.filter((c) => !c.deleted_at);

    let submittedAmount = 0;
    let approvedAmount = 0;
    let collectedAmount = 0;
    let outstandingBalance = 0;

    let submittedCount = 0;
    let underReviewCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const c of activeClaims) {
      submittedAmount = addMoney(submittedAmount, c.total_amount);

      if (['approved', 'partially_approved', 'partially_paid', 'paid'].includes(c.status)) {
        approvedAmount = addMoney(approvedAmount, c.approved_amount);
        collectedAmount = addMoney(collectedAmount, c.paid_amount);
        outstandingBalance = addMoney(outstandingBalance, c.outstanding_balance);
        approvedCount++;
      }

      if (c.status === 'submitted') submittedCount++;
      if (c.status === 'under_review') underReviewCount++;
      if (c.status === 'rejected') rejectedCount++;
    }

    return {
      total_claims_count: activeClaims.length,
      submitted_claims_count: submittedCount,
      under_review_count: underReviewCount,
      approved_claims_count: approvedCount,
      total_submitted_amount: submittedAmount,
      total_approved_amount: approvedAmount,
      total_reimbursement_collected: collectedAmount,
      total_outstanding_balance: outstandingBalance,
      rejected_claims_count: rejectedCount,
    };
  }

  /**
   * Resets the store for clean testing.
   */
  public resetForTesting(): void {
    this.claims = JSON.parse(JSON.stringify(initialClaimsData));
  }
}

export const claimsStore = new ClaimsPrototypeStore();
