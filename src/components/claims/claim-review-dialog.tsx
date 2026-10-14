'use client';

/**
 * MedLedger — Hospital Claim Review & Approval Modal Dialog
 *
 * Provides hospital administrators and finance reviewers with the interface to
 * approve, partially approve, reject, or return claims for correction with mandatory audit comments.
 */

import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { formatPKR } from '@/lib/decimal';
import { ClaimWithDetails, ClaimApprovalAction, ClaimItemStatus } from '@/modules/claims/types';
import { reviewClaimAction } from '@/modules/claims/actions';

interface ClaimReviewDialogProps {
  claim: ClaimWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: ClaimWithDetails) => void;
}

export function ClaimReviewDialog({ claim, isOpen, onClose, onSuccess }: ClaimReviewDialogProps) {
  const [action, setAction] = useState<ClaimApprovalAction>('approved');
  const [approvedAmount, setApprovedAmount] = useState<number>(claim.total_amount);
  const [comments, setComments] = useState('');
  const [itemStatuses, setItemStatuses] = useState<Map<string, ClaimItemStatus>>(
    new Map(claim.items.map((it) => [it.id, 'approved'])),
  );
  const [itemReasons] = useState<Map<string, string>>(new Map());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleActionChange(newAction: ClaimApprovalAction) {
    setAction(newAction);
    if (newAction === 'approved') {
      setApprovedAmount(claim.total_amount);
      const nextMap = new Map<string, ClaimItemStatus>();
      claim.items.forEach((it) => nextMap.set(it.id, 'approved'));
      setItemStatuses(nextMap);
    } else if (newAction === 'rejected' || newAction === 'returned') {
      setApprovedAmount(0);
      const nextMap = new Map<string, ClaimItemStatus>();
      claim.items.forEach((it) => nextMap.set(it.id, 'rejected'));
      setItemStatuses(nextMap);
    } else if (newAction === 'partially_approved') {
      setApprovedAmount(Math.round(claim.total_amount * 0.8 * 100) / 100);
    }
  }

  function toggleItemStatus(itemId: string) {
    const current = itemStatuses.get(itemId) || 'approved';
    const nextStatus: ClaimItemStatus = current === 'approved' ? 'rejected' : 'approved';
    const nextMap = new Map(itemStatuses);
    nextMap.set(itemId, nextStatus);
    setItemStatuses(nextMap);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (['rejected', 'returned', 'partially_approved'].includes(action) && !comments.trim()) {
      setError('Comments or clinical/administrative reasons are mandatory for this action.');
      return;
    }

    if (action === 'approved' && approvedAmount > claim.total_amount) {
      setError(
        `Approved amount cannot exceed the submitted total (${formatPKR(claim.total_amount)}).`,
      );
      return;
    }

    setLoading(true);

    try {
      const itemReviews = claim.items.map((it) => ({
        claim_item_id: it.id,
        status: itemStatuses.get(it.id) || 'approved',
        rejection_reason:
          itemReasons.get(it.id) || (itemStatuses.get(it.id) === 'rejected' ? comments : null),
      }));

      const payload = {
        claim_id: claim.id,
        action,
        approved_amount: approvedAmount,
        comments: comments.trim(),
        item_reviews: itemReviews,
      };

      const res = await reviewClaimAction(payload);

      if (!res.success || !res.data) {
        setError(res.error || 'Failed to submit review decision');
        setLoading(false);
        return;
      }

      onSuccess(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={`Review Reimbursement Claim — ${claim.claim_number}`}
      description={`Billing Period: ${claim.claim_period_start} → ${claim.claim_period_end} • Submitted: ${formatPKR(claim.total_amount)}`}
      className="max-w-2xl"
    >
      {error && (
        <Alert variant="critical" title="Review Error" description={error} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Action Choice Buttons */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Review Decision *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleActionChange('approved')}
              className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all ${
                action === 'approved'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Approve Full
            </button>

            <button
              type="button"
              onClick={() => handleActionChange('partially_approved')}
              className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all ${
                action === 'partially_approved'
                  ? 'bg-teal-50 border-teal-500 text-teal-700 ring-2 ring-teal-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Partial Approve
            </button>

            <button
              type="button"
              onClick={() => handleActionChange('returned')}
              className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all ${
                action === 'returned'
                  ? 'bg-orange-50 border-orange-500 text-orange-700 ring-2 ring-orange-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-orange-600" />
              Return to Staff
            </button>

            <button
              type="button"
              onClick={() => handleActionChange('rejected')}
              className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all ${
                action === 'rejected'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              Reject Claim
            </button>
          </div>
        </div>

        {/* Approved Amount Field */}
        {action !== 'rejected' && action !== 'returned' && (
          <div>
            <label
              htmlFor="approved-amount-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Approved Reimbursement Amount (PKR) *
            </label>
            <Input
              id="approved-amount-input"
              type="number"
              step="0.01"
              min="0"
              max={claim.total_amount}
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(parseFloat(e.target.value) || 0)}
              className="bg-slate-50 border-slate-200 text-sm font-semibold"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Submitted total: {formatPKR(claim.total_amount)}
            </p>
          </div>
        )}

        {/* Comments Field */}
        <div>
          <label
            htmlFor="review-comments"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Comments / Administrative Justification{' '}
            {['rejected', 'returned', 'partially_approved'].includes(action) ? '*' : '(Optional)'}
          </label>
          <textarea
            id="review-comments"
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="e.g. Inpatient surgical ICU records verified. Full disbursement authorized."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            required={['rejected', 'returned', 'partially_approved'].includes(action)}
          />
        </div>

        {/* Line-Item Review (For partial approvals) */}
        {action === 'partially_approved' && (
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">
              Item-Level Decision Details
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {claim.items.map((it) => {
                const isApproved = itemStatuses.get(it.id) === 'approved';
                return (
                  <div
                    key={it.id}
                    className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {it.medicine_name} ({it.strength}) • Qty: {it.quantity}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {it.patient_name} ({it.mr_number}) • {formatPKR(it.total_amount)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleItemStatus(it.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {isApproved ? 'Approved' : 'Rejected'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className={
              action === 'rejected'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          >
            {loading ? 'Recording...' : 'Confirm Decision'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
