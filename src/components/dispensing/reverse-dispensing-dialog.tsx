'use client';

/**
 * MedLedger — Reverse Dispensing Dialog
 *
 * Implements authorized compensating reversals with stock restoration,
 * audit reason capture, and prevention of double-reversal.
 */

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { reverseDispensingAction } from '@/modules/dispensing/actions';
import { DispensingWithDetails } from '@/modules/dispensing/types';

interface ReverseDispensingDialogProps {
  open: boolean;
  onClose: () => void;
  record: DispensingWithDetails | null;
  onReversalSuccess?: (updatedRecord: DispensingWithDetails) => void;
}

export function ReverseDispensingDialog({
  open,
  onClose,
  record,
  onReversalSuccess,
}: ReverseDispensingDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!record) return null;

  async function handleConfirmReversal() {
    if (!record) return;
    if (reason.trim().length < 5) {
      setErrorMessage('Please provide a clinical justification of at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await reverseDispensingAction({
        dispensing_record_id: record.id,
        reason: reason.trim(),
      });

      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Failed to reverse dispensing record.');
        setIsSubmitting(false);
        return;
      }

      onReversalSuccess?.(res.data);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalUnits = record.items.reduce((acc, it) => acc + it.quantity_dispensed, 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reverse Medicine Dispensing"
      description={`Compensating reversal for voucher ${record.dispensing_number}`}
      className="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmReversal}
            disabled={isSubmitting || reason.trim().length < 5}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isSubmitting ? 'Reversing...' : 'Confirm Reversal'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        <Alert
          variant="warning"
          title="Stock Ledger Compensation Warning"
          description={`Reversing this record will immediately restore ${totalUnits} units across ${record.items.length} batch(es) in the central stock ledger with an immutable audit entry.`}
        />

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Patient:</span>
            <strong className="text-slate-900">
              {record.patient_name} ({record.mr_number})
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Prescription:</span>
            <span className="font-mono text-slate-800">{record.prescription_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Items Count:</span>
            <span className="text-slate-800 font-semibold">{record.items.length} item(s)</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="reversal-reason-input"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Clinical / Administrative Reason for Reversal <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="reversal-reason-input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Patient discharged before drug administration; prescribed regimen discontinued by physician."
            className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            disabled={isSubmitting}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Minimum 5 characters required. This reason is permanently recorded in the audit trail.
          </p>
        </div>

        {errorMessage && (
          <Alert variant="critical" title="Reversal Failed" description={errorMessage} />
        )}
      </div>
    </Dialog>
  );
}
