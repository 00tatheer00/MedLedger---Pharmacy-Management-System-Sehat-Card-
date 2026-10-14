'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { MedicineWithStockSummary } from '@/modules/medicines/types';
import { updateMedicineAction } from '@/modules/medicines/actions';
import {
  updateMedicineSchema,
  THERAPEUTIC_CATEGORIES,
  DOSAGE_FORMS,
  UNITS_OF_MEASURE,
} from '@/modules/medicines/validation';

interface EditMedicineDialogProps {
  medicine: MedicineWithStockSummary;
}

export function EditMedicineDialog({ medicine }: EditMedicineDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: medicine.name,
    generic_name: medicine.generic_name,
    item_code: medicine.item_code || '',
    category: medicine.category,
    dosage_form: medicine.dosage_form,
    strength: medicine.strength,
    unit_of_measure: medicine.unit_of_measure,
    min_threshold: medicine.min_threshold.toString(),
    is_active: medicine.is_active,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      ...formData,
      item_code: formData.item_code.trim() || undefined,
      min_threshold: parseInt(formData.min_threshold, 10) || 0,
    };

    const validation = updateMedicineSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateMedicineAction(medicine.id, validation.data);
      if (!result.success) {
        setError(result.error.message);
        setIsSubmitting(false);
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update medicine');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs h-8"
        onClick={() => setIsOpen(true)}
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit Details
      </Button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Edit Catalogue Item: ${medicine.name}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="critical" title="Update Error" description={error} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium text-text-primary mb-1">Brand Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-text-primary mb-1">
                Generic Name (API) *
              </label>
              <Input
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-text-primary mb-1">Dosage Form *</label>
              <select
                value={formData.dosage_form}
                onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                className="w-full h-9 px-2.5 text-xs rounded-lg border border-border bg-white text-text-primary"
              >
                {DOSAGE_FORMS.map((form) => (
                  <option key={form} value={form}>
                    {form}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-text-primary mb-1">Strength *</label>
              <Input
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-text-primary mb-1">
                Therapeutic Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 px-2.5 text-xs rounded-lg border border-border bg-white text-text-primary"
              >
                {THERAPEUTIC_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-text-primary mb-1">Unit of Measure</label>
              <select
                value={formData.unit_of_measure}
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                className="w-full h-9 px-2.5 text-xs rounded-lg border border-border bg-white text-text-primary"
              >
                {UNITS_OF_MEASURE.map((uom) => (
                  <option key={uom} value={uom}>
                    {uom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-text-primary mb-1">Item Code / SKU</label>
              <Input
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-text-primary mb-1">
                Min Alert Threshold
              </label>
              <Input
                type="number"
                min="0"
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary"
              />
              <span className="font-medium text-text-primary">Catalogue Item is Active</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
