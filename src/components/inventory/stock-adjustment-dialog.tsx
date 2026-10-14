'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sliders, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { MedicineBatch, AdjustmentReason } from '@/modules/inventory/types';
import { recordStockAdjustmentAction } from '@/modules/inventory/actions';
import { ADJUSTMENT_REASONS } from '@/modules/inventory/validation';

interface StockAdjustmentDialogProps {
  batch: MedicineBatch;
  medicineName?: string;
}

export function StockAdjustmentDialog({ batch, medicineName }: StockAdjustmentDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<
    'increase' | 'decrease' | 'write_off' | 'quarantine'
  >('decrease');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState<string>('count_discrepancy');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedQty = parseInt(quantity, 10) || 0;
  const currentOnHand = batch.quantity_on_hand;

  let projectedBalance = currentOnHand;
  if (adjustmentType === 'increase') {
    projectedBalance = currentOnHand + parsedQty;
  } else if (adjustmentType === 'decrease' || adjustmentType === 'write_off') {
    projectedBalance = currentOnHand - parsedQty;
  }

  const isNegative =
    (adjustmentType === 'decrease' || adjustmentType === 'write_off') && parsedQty > currentOnHand;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parsedQty <= 0) {
      setError('Adjustment quantity must be a positive integer greater than zero.');
      return;
    }

    if (isNegative) {
      setError(
        `Cannot deduct ${parsedQty} units. Batch only has ${currentOnHand} units available.`,
      );
      return;
    }

    if (!notes.trim() || notes.trim().length < 5) {
      setError('A clinical audit reason of at least 5 characters is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Deterministic idempotency key for this interaction
      const idempotencyKey = `adj-${batch.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const result = await recordStockAdjustmentAction({
        batch_id: batch.id,
        adjustment_type: adjustmentType,
        quantity: parsedQty,
        reason: reason as AdjustmentReason,
        notes: notes.trim(),
        idempotency_key: idempotencyKey,
      });

      if (!result.success) {
        setError(result.error.message);
        setIsSubmitting(false);
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Adjustment failed');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => setIsOpen(true)}
      >
        <Sliders className="w-3.5 h-3.5" />
        Adjust Stock
      </Button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Stock Adjustment — Batch ${batch.batch_number}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="critical" title="Adjustment Failed" description={error} />}

          {/* Batch Context Banner */}
          <div className="p-3 bg-surface-muted/50 rounded-lg border border-border/80 text-xs flex items-center justify-between">
            <div>
              <div className="font-semibold text-text-primary">
                {medicineName || batch.medicine?.name || 'Selected Item'}
              </div>
              <div className="text-text-muted mt-0.5">
                Batch #{batch.batch_number} • Expires: {batch.expiry_date}
              </div>
            </div>
            <div className="text-right">
              <span className="text-text-muted">Current Balance:</span>
              <div className="text-sm font-bold text-text-primary">{currentOnHand} units</div>
            </div>
          </div>

          {/* Operation Type */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-primary">Adjustment Type *</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAdjustmentType('decrease')}
                className={`p-2 rounded-lg border text-left font-medium transition-colors ${
                  adjustmentType === 'decrease'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-white text-text-secondary hover:bg-surface-muted'
                }`}
              >
                Deduct Units (Loss/Discrepancy)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('increase')}
                className={`p-2 rounded-lg border text-left font-medium transition-colors ${
                  adjustmentType === 'increase'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-white text-text-secondary hover:bg-surface-muted'
                }`}
              >
                Add Units (Surplus Count)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('write_off')}
                className={`p-2 rounded-lg border text-left font-medium transition-colors ${
                  adjustmentType === 'write_off'
                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-border bg-white text-text-secondary hover:bg-surface-muted'
                }`}
              >
                Write-Off (Expired / Broken)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('quarantine')}
                className={`p-2 rounded-lg border text-left font-medium transition-colors ${
                  adjustmentType === 'quarantine'
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-border bg-white text-text-secondary hover:bg-surface-muted'
                }`}
              >
                Quarantine Batch (Hold)
              </button>
            </div>
          </div>

          {/* Quantity & Projected Balance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Adjustment Quantity *
              </label>
              <Input
                type="number"
                min="1"
                max="10000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`h-9 text-xs ${isNegative ? 'border-rose-500 bg-rose-50/20' : ''}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Projected New Balance
              </label>
              <div
                className={`h-9 px-3 flex items-center rounded-lg border font-mono text-xs font-bold ${
                  isNegative
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-border bg-surface-muted/40 text-text-primary'
                }`}
              >
                {isNegative ? 'Prohibited (Negative)' : `${projectedBalance} units`}
              </div>
            </div>
          </div>

          {/* Reason Selector */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Authorized Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 px-2.5 text-xs rounded-lg border border-border bg-white text-text-primary capitalize"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Audit Notes */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Clinical & Audit Justification *
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detailed reason for discrepancy, damage incident, or write-off authorization..."
              className="w-full p-2 text-xs rounded-lg border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[11px] text-text-muted mt-0.5">
              Recorded immutably in the stock ledger with your pharmacist signature.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isNegative}
              className="gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : 'Commit Ledger Movement'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
