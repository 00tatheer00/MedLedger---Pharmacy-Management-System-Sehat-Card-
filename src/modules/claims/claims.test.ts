import { describe, it, expect, beforeEach } from 'vitest';
import { claimsStore } from './prototype-store';
import { dispensingStore } from '@/modules/dispensing/prototype-store';
import { inventoryStore } from '@/modules/inventory/prototype-store';
import { multiplyMoney, subtractMoney } from '@/lib/decimal';

describe('Phase 9 — Hospital Claims & Billing Module', () => {
  const actorFinance = { id: 'usr-finance-001', name: 'Ayesha Malik (Finance Staff)' };
  const actorReviewer = { id: 'usr-admin-001', name: 'Dr. Bilal Qureshi (Reviewer)' };

  beforeEach(() => {
    dispensingStore.resetForTesting();
    inventoryStore.resetForTesting();
    claimsStore.resetForTesting();
  });

  describe('1. Claim Preparation & Eligible Dispensing Items', () => {
    it('identifies eligible completed dispensing items with positive claimable quantities', () => {
      const eligible = claimsStore.getEligibleDispensingItems();
      expect(eligible.length).toBeGreaterThan(0);

      // Verify each eligible item has positive claimable quantity
      eligible.forEach((item) => {
        expect(item.claimable_quantity).toBeGreaterThan(0);
        expect(item.quantity_dispensed).toBeGreaterThanOrEqual(item.claimable_quantity);
        expect(item.dispensing_record_id).toBeDefined();
        expect(item.dispensing_item_id).toBeDefined();
        expect(item.patient_name).toBeDefined();
        expect(item.mr_number).toBeDefined();
      });
    });

    it('creates a draft claim from eligible dispensing items with full line-item traceability', () => {
      const eligible = claimsStore.getEligibleDispensingItems();
      const firstEligible = eligible[0];

      const claim = claimsStore.createClaim(
        {
          claim_period_start: '2026-10-01',
          claim_period_end: '2026-10-12',
          status: 'draft',
          notes: 'Test claim compilation for eligible items',
          items: [
            {
              dispensing_item_id: firstEligible.dispensing_item_id,
              quantity: firstEligible.claimable_quantity,
            },
          ],
        },
        actorFinance,
      );

      expect(claim).toBeDefined();
      expect(claim.status).toBe('draft');
      expect(claim.claim_number).toMatch(/^CLM-\d{8}-\d{4}$/);
      expect(claim.items).toHaveLength(1);

      const item = claim.items[0];
      expect(item.dispensing_item_id).toBe(firstEligible.dispensing_item_id);
      expect(item.dispensing_record_id).toBe(firstEligible.dispensing_record_id);
      expect(item.patient_name).toBe(firstEligible.patient_name);
      expect(item.mr_number).toBe(firstEligible.mr_number);
      expect(item.prescription_number).toBe(firstEligible.prescription_number);
      expect(item.batch_number).toBe(firstEligible.batch_number);
      expect(item.total_amount).toBe(
        multiplyMoney(firstEligible.claimable_quantity, firstEligible.unit_rate),
      );
      expect(claim.total_amount).toBe(item.total_amount);
    });

    it('rejects claim creation when end date is earlier than start date', () => {
      const eligible = claimsStore.getEligibleDispensingItems();
      expect(() =>
        claimsStore.createClaim(
          {
            claim_period_start: '2026-10-15',
            claim_period_end: '2026-10-10', // Invalid: end before start
            items: [
              {
                dispensing_item_id: eligible[0].dispensing_item_id,
                quantity: 1,
              },
            ],
          },
          actorFinance,
        ),
      ).toThrowError(/cannot be earlier than start date/i);
    });

    it('rejects claim creation without any items', () => {
      expect(() =>
        claimsStore.createClaim(
          {
            claim_period_start: '2026-10-01',
            claim_period_end: '2026-10-10',
            items: [],
          },
          actorFinance,
        ),
      ).toThrowError(/at least one eligible dispensing line item/i);
    });
  });

  describe('2. Duplicate Claim Prevention & Partial Quota Tracking', () => {
    it('prevents claiming the same dispensing item quantity twice', () => {
      const eligible = claimsStore.getEligibleDispensingItems();
      const target = eligible[0];

      // 1. Claim entire available quota
      claimsStore.createClaim(
        {
          claim_period_start: '2026-10-01',
          claim_period_end: '2026-10-10',
          items: [
            {
              dispensing_item_id: target.dispensing_item_id,
              quantity: target.claimable_quantity,
            },
          ],
        },
        actorFinance,
      );

      // 2. Attempting to claim the same item again should throw error
      expect(() =>
        claimsStore.createClaim(
          {
            claim_period_start: '2026-10-01',
            claim_period_end: '2026-10-10',
            items: [
              {
                dispensing_item_id: target.dispensing_item_id,
                quantity: 1,
              },
            ],
          },
          actorFinance,
        ),
      ).toThrowError(/not eligible for claiming or has already been fully claimed/i);
    });

    it('supports partial claims and accurately reduces remaining claimable quantity', () => {
      const eligible = claimsStore.getEligibleDispensingItems();
      // Find an item with at least 2 units
      const target = eligible.find((e) => e.claimable_quantity >= 2) || eligible[0];
      const initialClaimable = target.claimable_quantity;

      // 1. Claim partial quantity (1 unit)
      claimsStore.createClaim(
        {
          claim_period_start: '2026-10-01',
          claim_period_end: '2026-10-10',
          items: [
            {
              dispensing_item_id: target.dispensing_item_id,
              quantity: 1,
            },
          ],
        },
        actorFinance,
      );

      // 2. Check updated eligible items list
      const updatedEligible = claimsStore.getEligibleDispensingItems();
      const updatedTarget = updatedEligible.find(
        (e) => e.dispensing_item_id === target.dispensing_item_id,
      );

      if (initialClaimable > 1) {
        expect(updatedTarget).toBeDefined();
        expect(updatedTarget?.already_claimed_quantity).toBe(1);
        expect(updatedTarget?.claimable_quantity).toBe(initialClaimable - 1);
      } else {
        expect(updatedTarget).toBeUndefined();
      }
    });

    it('rejects claiming more than the remaining claimable quantity', () => {
      const eligible = claimsStore.getEligibleDispensingItems();
      const target = eligible[0];

      expect(() =>
        claimsStore.createClaim(
          {
            claim_period_start: '2026-10-01',
            claim_period_end: '2026-10-10',
            items: [
              {
                dispensing_item_id: target.dispensing_item_id,
                quantity: target.claimable_quantity + 5, // Exceeds claimable
              },
            ],
          },
          actorFinance,
        ),
      ).toThrowError(/exceeds the remaining claimable quantity/i);
    });
  });

  describe('3. Invariant: Claims DO NOT Deduct Stock or Alter Inventory', () => {
    it('verifies creating and approving a claim has zero effect on medicine stock movements', () => {
      const initialSnapshot = inventoryStore.snapshot();

      const eligible = claimsStore.getEligibleDispensingItems();
      const target = eligible[0];

      // 1. Create claim
      const claim = claimsStore.createClaim(
        {
          claim_period_start: '2026-10-01',
          claim_period_end: '2026-10-10',
          status: 'submitted',
          items: [
            {
              dispensing_item_id: target.dispensing_item_id,
              quantity: target.claimable_quantity,
            },
          ],
        },
        actorFinance,
      );

      // 2. Approve claim
      claimsStore.reviewClaim(
        {
          claim_id: claim.id,
          action: 'approved',
          approved_amount: claim.total_amount,
          comments: 'Full reimbursement approved by hospital committee',
        },
        actorReviewer,
      );

      // 3. Verify INVARIANT: No stock movements were created!
      const currentSnapshot = inventoryStore.snapshot();
      expect(currentSnapshot.movements.length).toBe(initialSnapshot.movements.length);

      // 4. Verify INVARIANT: Batch quantities and inventory are completely unchanged!
      expect(currentSnapshot.batches).toEqual(initialSnapshot.batches);
    });
  });

  describe('4. Claim Lifecycle & Status Transitions', () => {
    it('handles draft -> submitted -> approved -> paid lifecycle successfully', () => {
      const eligible = claimsStore.getEligibleDispensingItems();
      const target = eligible[0];

      // 1. Create Draft
      const claim = claimsStore.createClaim(
        {
          claim_period_start: '2026-10-01',
          claim_period_end: '2026-10-10',
          status: 'draft',
          items: [
            {
              dispensing_item_id: target.dispensing_item_id,
              quantity: target.claimable_quantity,
            },
          ],
        },
        actorFinance,
      );
      expect(claim.status).toBe('draft');

      // 2. Submit Claim
      const submitted = claimsStore.submitClaim(claim.id, actorFinance);
      expect(submitted.status).toBe('submitted');
      expect(submitted.submitted_by).toBe(actorFinance.id);
      expect(submitted.submitted_at).toBeDefined();

      // 3. Approve Claim
      const approved = claimsStore.reviewClaim(
        {
          claim_id: claim.id,
          action: 'approved',
          approved_amount: claim.total_amount,
          comments: 'Approved without objections',
        },
        actorReviewer,
      );
      expect(approved.status).toBe('approved');
      expect(approved.approved_amount).toBe(claim.total_amount);
      expect(approved.outstanding_balance).toBe(claim.total_amount);
      expect(approved.approvals).toHaveLength(1);

      // 4. Record Full Payment
      const payment = claimsStore.recordPayment(
        {
          claim_id: claim.id,
          payment_date: '2026-10-13',
          amount: claim.total_amount,
          payment_method: 'Bank Transfer (DHQ Treasury)',
          reference_number: 'NBP-TX-100293',
          notes: 'Full payment received',
        },
        actorFinance,
      );
      expect(payment).toBeDefined();
      expect(payment.amount).toBe(claim.total_amount);

      const reloaded = claimsStore.getClaimById(claim.id);
      expect(reloaded?.status).toBe('paid');
      expect(reloaded?.paid_amount).toBe(claim.total_amount);
      expect(reloaded?.outstanding_balance).toBe(0);
    });

    it('rejects invalid status transitions (e.g. reviewing draft, submitting approved claim)', () => {
      const eligible = claimsStore.getEligibleDispensingItems();
      const target = eligible[0];

      const draft = claimsStore.createClaim(
        {
          claim_period_start: '2026-10-01',
          claim_period_end: '2026-10-10',
          status: 'draft',
          items: [{ dispensing_item_id: target.dispensing_item_id, quantity: 1 }],
        },
        actorFinance,
      );

      // Cannot review a draft claim directly
      expect(() =>
        claimsStore.reviewClaim(
          {
            claim_id: draft.id,
            action: 'approved',
            approved_amount: 100,
            comments: 'Direct approval should fail',
          },
          actorReviewer,
        ),
      ).toThrowError(/claim must be submitted or under review/i);

      // Submit to move to submitted
      claimsStore.submitClaim(draft.id, actorFinance);

      // Cannot submit an already submitted claim
      expect(() => claimsStore.submitClaim(draft.id, actorFinance)).toThrowError(
        /only draft or returned claims can be submitted/i,
      );
    });

    it('handles return for correction and re-submission', () => {
      const eligible = claimsStore.getEligibleDispensingItems();
      const target = eligible[0];

      const claim = claimsStore.createClaim(
        {
          claim_period_start: '2026-10-01',
          claim_period_end: '2026-10-10',
          status: 'submitted',
          items: [{ dispensing_item_id: target.dispensing_item_id, quantity: 1 }],
        },
        actorFinance,
      );

      // Reviewer returns claim for correction
      const returned = claimsStore.reviewClaim(
        {
          claim_id: claim.id,
          action: 'returned',
          approved_amount: 0,
          comments: 'Please verify inpatient admission order date before approval',
        },
        actorReviewer,
      );
      expect(returned.status).toBe('returned');
      expect(returned.approved_amount).toBe(0);

      // Finance staff resubmits after clarification
      const resubmitted = claimsStore.submitClaim(claim.id, actorFinance);
      expect(resubmitted.status).toBe('submitted');
    });

    it('requires mandatory comments when rejecting or returning a claim', () => {
      const eligible = claimsStore.getEligibleDispensingItems();
      const target = eligible[0];

      const claim = claimsStore.createClaim(
        {
          claim_period_start: '2026-10-01',
          claim_period_end: '2026-10-10',
          status: 'submitted',
          items: [{ dispensing_item_id: target.dispensing_item_id, quantity: 1 }],
        },
        actorFinance,
      );

      expect(() =>
        claimsStore.reviewClaim(
          {
            claim_id: claim.id,
            action: 'rejected',
            approved_amount: 0,
            comments: '   ', // Blank comments
          },
          actorReviewer,
        ),
      ).toThrowError(/comments are mandatory/i);
    });
  });

  describe('5. Financial Calculations & Payment Ledger', () => {
    it('accurately tracks partial payments and updates claim status to partially_paid', () => {
      const claim = claimsStore.getClaimById('clm-001-kohat');
      expect(claim).toBeDefined();
      expect(claim?.status).toBe('partially_paid');
      expect(claim?.approved_amount).toBe(1840.0);
      expect(claim?.paid_amount).toBe(1000.0);
      expect(claim?.outstanding_balance).toBe(840.0);

      // Record a second partial payment of PKR 400
      claimsStore.recordPayment(
        {
          claim_id: claim!.id,
          payment_date: '2026-10-13',
          amount: 400.0,
          payment_method: 'Cheque',
          reference_number: 'CHQ-89021',
        },
        actorFinance,
      );

      const updated = claimsStore.getClaimById(claim!.id);
      expect(updated?.status).toBe('partially_paid');
      expect(updated?.paid_amount).toBe(1400.0);
      expect(updated?.outstanding_balance).toBe(440.0);

      // Pay the remaining 440 to achieve 'paid' status
      claimsStore.recordPayment(
        {
          claim_id: claim!.id,
          payment_date: '2026-10-13',
          amount: 440.0,
          payment_method: 'Cheque',
          reference_number: 'CHQ-89022',
        },
        actorFinance,
      );

      const fullyPaid = claimsStore.getClaimById(claim!.id);
      expect(fullyPaid?.status).toBe('paid');
      expect(fullyPaid?.paid_amount).toBe(1840.0);
      expect(fullyPaid?.outstanding_balance).toBe(0);
    });

    it('prevents over-payment beyond the approved balance', () => {
      const claim = claimsStore.getClaimById('clm-001-kohat');
      const outstanding = claim!.outstanding_balance; // 840

      expect(() =>
        claimsStore.recordPayment(
          {
            claim_id: claim!.id,
            payment_date: '2026-10-13',
            amount: outstanding + 100, // 940 > 840
            payment_method: 'Bank Transfer',
          },
          actorFinance,
        ),
      ).toThrowError(/exceeds outstanding balance/i);
    });

    it('prevents payment recording on unapproved claims', () => {
      const underReviewClaim = claimsStore.getClaimById('clm-002-kohat');
      expect(underReviewClaim?.status).toBe('under_review');

      expect(() =>
        claimsStore.recordPayment(
          {
            claim_id: underReviewClaim!.id,
            payment_date: '2026-10-13',
            amount: 500,
            payment_method: 'Bank Transfer',
          },
          actorFinance,
        ),
      ).toThrowError(/claim must be approved, partially approved, or partially paid/i);
    });

    it('calculates aggregated overview KPIs accurately', () => {
      const kpis = claimsStore.getOverviewKPIs();
      expect(kpis.total_claims_count).toBeGreaterThan(0);
      expect(kpis.total_submitted_amount).toBeGreaterThan(0);
      expect(kpis.total_approved_amount).toBeGreaterThanOrEqual(kpis.total_reimbursement_collected);
      expect(kpis.total_outstanding_balance).toBe(
        subtractMoney(kpis.total_approved_amount, kpis.total_reimbursement_collected),
      );
    });
  });
});
