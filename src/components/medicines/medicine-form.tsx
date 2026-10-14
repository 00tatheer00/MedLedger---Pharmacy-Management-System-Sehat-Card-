'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pill, ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import {
  createMedicineSchema,
  DOSAGE_FORMS,
  UNITS_OF_MEASURE,
  THERAPEUTIC_CATEGORIES,
} from '@/modules/medicines/validation';
import { createMedicineAction } from '@/modules/medicines/actions';

export function MedicineRegistrationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    item_code: '',
    name: '',
    generic_name: '',
    dosage_form: 'Tablet',
    strength: '',
    unit_of_measure: 'Tablet',
    category: 'Antibiotics & Antimicrobials',
    min_threshold: '20',
    is_active: true,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const payload = {
      ...formData,
      item_code: formData.item_code.trim() || undefined,
      min_threshold: parseInt(formData.min_threshold, 10) || 0,
    };

    const validation = createMedicineSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || 'general';
        errors[fieldName] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createMedicineAction(validation.data);
      if (!result.success) {
        setGeneralError(result.error.message);
        setIsSubmitting(false);
        return;
      }

      router.push(`/medicines/${result.data.id}`);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/medicines"
          className="inline-flex items-center text-xs font-medium text-text-secondary hover:text-text-primary gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Medicines Catalogue
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Register Catalogue Medicine</CardTitle>
                <p className="text-xs text-text-muted mt-0.5">
                  Add a pharmaceutical product to the central DHQ Hospital Kohat dispensary master
                  registry.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {generalError && (
              <Alert variant="critical" title="Registration Failed" description={generalError} />
            )}

            {/* Catalogue Honesty Notice */}
            <div className="rounded-lg p-3 bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold">Catalogue Integrity Standard:</span> Ensure brand
                name, active generic salt (API), dosage form, and strength precisely match the
                hospital dispensary stock. Duplicate brand and strength combinations will be
                rejected.
              </div>
            </div>

            {/* Product Identification Section */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                1. Product Identification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Brand / Proprietary Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Augmentin 625mg"
                    className={fieldErrors.name ? 'border-rose-400' : ''}
                  />
                  {fieldErrors.name && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Generic Name (API Salt) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    name="generic_name"
                    value={formData.generic_name}
                    onChange={handleChange}
                    placeholder="e.g. Amoxicillin + Clavulanic Acid"
                    className={fieldErrors.generic_name ? 'border-rose-400' : ''}
                  />
                  {fieldErrors.generic_name && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.generic_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Item Code / SKU (Optional)
                  </label>
                  <Input
                    name="item_code"
                    value={formData.item_code}
                    onChange={handleChange}
                    placeholder="e.g. MED-AUG-625"
                    className={fieldErrors.item_code ? 'border-rose-400' : ''}
                  />
                  {fieldErrors.item_code && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.item_code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Therapeutic Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  >
                    {THERAPEUTIC_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.category}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Formulation & Strength */}
            <div className="border-t border-border/60 pt-5">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                2. Formulation & Packaging
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Dosage Form <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="dosage_form"
                    value={formData.dosage_form}
                    onChange={handleChange}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  >
                    {DOSAGE_FORMS.map((form) => (
                      <option key={form} value={form}>
                        {form}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.dosage_form && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.dosage_form}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Strength / Concentration <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    name="strength"
                    value={formData.strength}
                    onChange={handleChange}
                    placeholder="e.g. 500mg, 1g, 250mg/5ml"
                    className={fieldErrors.strength ? 'border-rose-400' : ''}
                  />
                  {fieldErrors.strength && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.strength}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Unit of Measure <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="unit_of_measure"
                    value={formData.unit_of_measure}
                    onChange={handleChange}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  >
                    {UNITS_OF_MEASURE.map((uom) => (
                      <option key={uom} value={uom}>
                        {uom}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.unit_of_measure && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.unit_of_measure}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory Alerts & Status */}
            <div className="border-t border-border/60 pt-5">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                3. Surveillance Threshold & Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Minimum Stock Alert Threshold (Units) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    name="min_threshold"
                    value={formData.min_threshold}
                    onChange={handleChange}
                    placeholder="20"
                    className={fieldErrors.min_threshold ? 'border-rose-400' : ''}
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Triggers a dispensary reorder alert when available stock drops to or below this
                    count.
                  </p>
                  {fieldErrors.min_threshold && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.min_threshold}
                    </p>
                  )}
                </div>

                <div className="flex items-center pt-6">
                  <label className="relative flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                    />
                    <span className="text-xs font-medium text-text-primary">
                      Active for Prescription Intake & Ordering
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/60 bg-surface-muted/20 py-4 px-6 flex items-center justify-between">
            <Link
              href="/medicines"
              className="text-xs text-text-muted hover:text-text-primary font-medium"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? 'Registering...' : 'Save & Register Medicine'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
