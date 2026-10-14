/**
 * MedLedger — First-Expiry-First-Out (FEFO) Batch Recommendation Engine
 *
 * Implements FEFO allocation rules for DHQ Hospital Kohat central pharmacy.
 * Recommends the earliest-expiring non-expired eligible batch, flags manual overrides,
 * and strictly prevents selecting expired or quarantined stock.
 */

import { MedicineBatch } from '@/modules/inventory/types';
import { FEFOBatchCandidate } from './types';

export function evaluateFEFOBatches(
  batches: MedicineBatch[],
  targetMedicineId: string,
): FEFOBatchCandidate[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTime = new Date(todayStr).getTime();

  const filtered = batches.filter((b) => b.medicine_id === targetMedicineId);

  const candidates: FEFOBatchCandidate[] = filtered.map((batch) => {
    const expiryTime = new Date(batch.expiry_date).getTime();
    const daysUntilExpiry = Math.ceil((expiryTime - todayTime) / (1000 * 60 * 60 * 24));

    let isEligible = true;
    let ineligibilityReason: string | undefined;

    if (batch.status === 'quarantined') {
      isEligible = false;
      ineligibilityReason = 'Batch is quarantined due to safety or quality hold.';
    } else if (batch.status === 'expired' || batch.expiry_date <= todayStr) {
      isEligible = false;
      ineligibilityReason = `Batch expired on ${batch.expiry_date}. Dispensing prohibited.`;
    } else if (batch.quantity_on_hand <= 0) {
      isEligible = false;
      ineligibilityReason = 'Batch is depleted (0 units on-hand).';
    } else if (batch.status === 'recalled') {
      isEligible = false;
      ineligibilityReason = 'Batch has been recalled by manufacturer or DRAP.';
    }

    return {
      batch,
      is_eligible: isEligible,
      ineligibility_reason: ineligibilityReason,
      is_fefo_recommended: false,
      days_until_expiry: daysUntilExpiry,
    };
  });

  // Sort: Eligible batches first (ordered by expiry_date ASC), then ineligible batches
  const eligible = candidates
    .filter((c) => c.is_eligible)
    .sort((a, b) => {
      const cmpDate = a.batch.expiry_date.localeCompare(b.batch.expiry_date);
      if (cmpDate !== 0) return cmpDate;
      return a.batch.quantity_on_hand - b.batch.quantity_on_hand;
    });

  const ineligible = candidates.filter((c) => !c.is_eligible);

  // Mark the first eligible batch as FEFO recommended
  if (eligible.length > 0) {
    eligible[0].is_fefo_recommended = true;
  }

  return [...eligible, ...ineligible];
}

/**
 * Returns the recommended FEFO batch if an eligible batch is available.
 */
export function getRecommendedFEFOBatch(
  batches: MedicineBatch[],
  targetMedicineId: string,
): MedicineBatch | null {
  const evaluated = evaluateFEFOBatches(batches, targetMedicineId);
  const recommended = evaluated.find((c) => c.is_fefo_recommended && c.is_eligible);
  return recommended ? recommended.batch : null;
}
