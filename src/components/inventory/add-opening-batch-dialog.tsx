'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { createOpeningBatchSchema } from '@/modules/inventory/validation';
import { createOpeningBatchAction } from '@/modules/inventory/actions';

interface AddOpeningBatchDialogProps {
  medicineId: string;
  medicineName: string;
  unitOfMeasure?: string;
}

export function AddOpeningBatchDialog({
  medicineId,
  medicineName,
  unitOfMeasure = 'Units',
}: AddOpeningBatchDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    batch_number: '',
    expiry_date: '',
    quantity: '100',
    unit_cost: '10.0',
    supplier_name: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      medicine_id: medicineId,
      batch_number: formData.batch_number.trim(),
      expiry_date: formData.expiry_date.trim(),
      quantity: parseInt(formData.quantity, 10) || 0,
      unit_cost: parseFloat(formData.unit_cost) || 0,
      supplier_name: formData.supplier_name.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    const validation = createOpeningBatchSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOpeningBatchAction(validation.data);
      if (!result.success) {
        setError(result.error.message);
        setIsSubmitting(false);
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record batch');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        className="gap-1.5 text-xs h-8"
        onClick={() => setIsOpen(true)}
      >
        <PackagePlus className="w-3.5 h-3.5" />
        Add Opening Batch
      </Button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Add Opening Batch — ${medicineName}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="critical" title="Batch Intake Failed" description={error} />}

          <p className="text-xs text-text-muted">
            Record physical stock on hand into the ledger. This initializes batch traceability and
            FEFO expiry surveillance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium text-text-primary mb-1">
                Batch / Lot Number *
              </label>
              <Input
                placeholder="e.g. B-2026-09"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                className="h-9 text-xs font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-medium text-text-primary mb-1">
                Expiry Date (YYYY-MM-DD) *
              </label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-text-primary mb-1">
                Quantity on Hand ({unitOfMeasure}) *
              </label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-text-primary mb-1">Unit Cost (PKR) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Source / Supplier / Distributor Name (Optional)
            </label>
            <Input
              placeholder="e.g. Allied Pharma / Central Govt Medical Store"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Verification Notes (Optional)
            </label>
            <Input
              placeholder="Physical count verified during opening stock audit..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : 'Record Batch Intake'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
