/**
 * MedLedger — Inventory Surveillance & Alert Calculations
 *
 * Implements threshold rules for low-stock, out-of-stock, and FEFO expiry
 * tracking based on approved DHQ Hospital Kohat configuration defaults.
 */

import { Medicine } from '@/modules/medicines/types';
import { MedicineBatch, InventoryAlert } from './types';

export interface AlertThresholdConfig {
  defaultMinThreshold: number;
  expiryWarningDays: number;
  criticalExpiryDays: number;
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholdConfig = {
  defaultMinThreshold: 20,
  expiryWarningDays: 60,
  criticalExpiryDays: 30,
};

/**
 * Calculates days remaining until the given expiry date.
 * Returns negative numbers if already expired.
 */
export function calculateDaysUntilExpiry(
  expiryDateStr: string,
  referenceDate = new Date(),
): number {
  const expiry = new Date(expiryDateStr);
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - ref.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates medicine and batch inventory to produce actionable alerts.
 */
export function generateInventoryAlerts(
  medicines: Medicine[],
  batches: MedicineBatch[],
  config: AlertThresholdConfig = DEFAULT_ALERT_THRESHOLDS,
  referenceDate = new Date(),
): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];

  // Group available batches by medicine
  const batchesByMedicine = new Map<string, MedicineBatch[]>();
  batches.forEach((b) => {
    const list = batchesByMedicine.get(b.medicine_id) || [];
    list.push(b);
    batchesByMedicine.set(b.medicine_id, list);
  });

  // 1. Medicine Level Alerts (Stock Out & Low Stock)
  medicines
    .filter((m) => m.is_active && !m.deleted_at)
    .forEach((med) => {
      const medBatches = batchesByMedicine.get(med.id) || [];
      const availableStock = medBatches
        .filter((b) => b.status === 'available')
        .reduce((sum, b) => sum + b.quantity_on_hand, 0);

      const threshold = med.min_threshold ?? config.defaultMinThreshold;

      if (availableStock === 0) {
        alerts.push({
          id: `alert-out-${med.id}`,
          type: 'out_of_stock',
          severity: 'critical',
          medicine_id: med.id,
          medicine_name: med.name,
          strength: med.strength,
          dosage_form: med.dosage_form,
          current_quantity: 0,
          threshold,
          message: `${med.name} (${med.strength}) is completely out of stock. Dispensary balance is 0.`,
        });
      } else if (availableStock <= threshold) {
        alerts.push({
          id: `alert-low-${med.id}`,
          type: 'low_stock',
          severity: 'warning',
          medicine_id: med.id,
          medicine_name: med.name,
          strength: med.strength,
          dosage_form: med.dosage_form,
          current_quantity: availableStock,
          threshold,
          message: `${med.name} (${med.strength}) stock is low: ${availableStock} ${med.unit_of_measure} remaining (threshold: ${threshold}).`,
        });
      }
    });

  // 2. Batch Level Alerts (Expiry & Quarantine)
  batches.forEach((batch) => {
    if (batch.quantity_on_hand <= 0) return;

    const med = medicines.find((m) => m.id === batch.medicine_id);
    const medName = med ? med.name : 'Unknown Medicine';
    const strength = med ? med.strength : '';
    const dosageForm = med ? med.dosage_form : '';

    if (batch.status === 'quarantined') {
      alerts.push({
        id: `alert-quarantine-${batch.id}`,
        type: 'quarantined',
        severity: 'critical',
        medicine_id: batch.medicine_id,
        medicine_name: medName,
        strength,
        dosage_form: dosageForm,
        batch_id: batch.id,
        batch_number: batch.batch_number,
        current_quantity: batch.quantity_on_hand,
        expiry_date: batch.expiry_date,
        message: `Batch ${batch.batch_number} of ${medName} is quarantined (${batch.quantity_on_hand} units). Blocked from dispensing.`,
      });
      return;
    }

    const daysRemaining = calculateDaysUntilExpiry(batch.expiry_date, referenceDate);

    if (daysRemaining <= 0) {
      alerts.push({
        id: `alert-expired-${batch.id}`,
        type: 'expired',
        severity: 'critical',
        medicine_id: batch.medicine_id,
        medicine_name: medName,
        strength,
        dosage_form: dosageForm,
        batch_id: batch.id,
        batch_number: batch.batch_number,
        current_quantity: batch.quantity_on_hand,
        expiry_date: batch.expiry_date,
        days_until_expiry: daysRemaining,
        message: `Batch ${batch.batch_number} of ${medName} expired on ${batch.expiry_date} (${batch.quantity_on_hand} units). Requires write-off.`,
      });
    } else if (daysRemaining <= config.criticalExpiryDays) {
      alerts.push({
        id: `alert-crit-expiry-${batch.id}`,
        type: 'near_expiry',
        severity: 'warning',
        medicine_id: batch.medicine_id,
        medicine_name: medName,
        strength,
        dosage_form: dosageForm,
        batch_id: batch.id,
        batch_number: batch.batch_number,
        current_quantity: batch.quantity_on_hand,
        expiry_date: batch.expiry_date,
        days_until_expiry: daysRemaining,
        message: `Batch ${batch.batch_number} of ${medName} expires in ${daysRemaining} days (${batch.expiry_date}). Prioritize FEFO dispensing.`,
      });
    } else if (daysRemaining <= config.expiryWarningDays) {
      alerts.push({
        id: `alert-warn-expiry-${batch.id}`,
        type: 'near_expiry',
        severity: 'info',
        medicine_id: batch.medicine_id,
        medicine_name: medName,
        strength,
        dosage_form: dosageForm,
        batch_id: batch.id,
        batch_number: batch.batch_number,
        current_quantity: batch.quantity_on_hand,
        expiry_date: batch.expiry_date,
        days_until_expiry: daysRemaining,
        message: `Batch ${batch.batch_number} of ${medName} expires in ${daysRemaining} days (${batch.expiry_date}).`,
      });
    }
  });

  // Sort: critical first, then warning, then info
  const severityWeight: Record<string, number> = {
    critical: 3,
    warning: 2,
    info: 1,
  };

  return alerts.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
}
