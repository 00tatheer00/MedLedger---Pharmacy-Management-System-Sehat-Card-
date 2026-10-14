'use client';

/**
 * MedLedger — Hospital Claim Reimbursement Payment Modal Dialog
 *
 * Records reimbursement payments disbursed by DHQ Hospital against approved claims.
 * Validates against outstanding balance to prevent over-allocation.
 */

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { formatPKR } from '@/lib/decimal';
import { ClaimWithDetails } from '@/modules/claims/types';
import { recordClaimPaymentAction, getClaimByIdAction } from '@/modules/claims/actions';

interface ClaimPaymentDialogProps {
  claim: ClaimWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: ClaimWithDetails) => void;
}

export function ClaimPaymentDialog({ claim, isOpen, onClose, onSuccess }: ClaimPaymentDialogProps) {
  const [paymentDate, setPaymentDate] = useState('2026-10-13');
  const [amount, setAmount] = useState<number>(claim.outstanding_balance);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (DHQ Treasury)');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (amount > claim.outstanding_balance) {
      setError(
        `Payment amount (${formatPKR(amount)}) cannot exceed outstanding balance (${formatPKR(claim.outstanding_balance)}).`,
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        claim_id: claim.id,
        payment_date: paymentDate,
        amount,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || null,
        notes: notes.trim() || null,
      };

      const res = await recordClaimPaymentAction(payload);

      if (!res.success) {
        setError(res.error || 'Failed to record reimbursement payment');
        setLoading(false);
        return;
      }

      // Reload fresh claim details to update status and payment list
      const freshRes = await getClaimByIdAction(claim.id);
      if (freshRes.success && freshRes.data) {
        onSuccess(freshRes.data);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={`Record Reimbursement Payment — ${claim.claim_number}`}
      description={`Approved: ${formatPKR(claim.approved_amount)} • Outstanding Balance: ${formatPKR(claim.outstanding_balance)}`}
      className="max-w-lg"
    >
      {error && (
        <Alert
          variant="critical"
          title="Payment Recording Error"
          description={error}
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="payment-date-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Payment Date *
            </label>
            <Input
              id="payment-date-input"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="bg-slate-50 border-slate-200 text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="payment-amount-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Amount Received (PKR) *
            </label>
            <Input
              id="payment-amount-input"
              type="number"
              step="0.01"
              min="0.01"
              max={claim.outstanding_balance}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="bg-slate-50 border-slate-200 text-sm font-bold text-emerald-700"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="payment-method-select"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Payment Method *
          </label>
          <select
            id="payment-method-select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            required
          >
            <option value="Bank Transfer (DHQ Treasury)">Bank Transfer (DHQ Treasury)</option>
            <option value="Treasury Cheque">Treasury Cheque (National Bank of Pakistan)</option>
            <option value="District Treasury Voucher">District Treasury Voucher</option>
            <option value="Cash Voucher">Cash Voucher</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="payment-ref-input"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Cheque / Reference Number
          </label>
          <Input
            id="payment-ref-input"
            type="text"
            placeholder="e.g. NBP-KOH-TX-849102"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            className="bg-slate-50 border-slate-200 text-sm font-mono"
          />
        </div>

        <div>
          <label
            htmlFor="payment-notes-input"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Payment Notes (Optional)
          </label>
          <textarea
            id="payment-notes-input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Full settlement released by Medical Superintendent treasury sanction."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
