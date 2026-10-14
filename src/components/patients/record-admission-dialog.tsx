'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { BedDouble } from 'lucide-react';
import { createAdmissionSchema } from '@/modules/admissions/validation';
import { createAdmissionAction } from '@/modules/admissions/actions';
import { PatientWithRelations } from '@/modules/patients/types';

interface RecordAdmissionDialogProps {
  patient: PatientWithRelations;
  open: boolean;
  onClose: () => void;
}

const standardWards = [
  'Male Medical Ward',
  'Female Medical Ward',
  'Male Surgical Ward',
  'Female Surgical Ward',
  'Intensive Care Unit (ICU)',
  'Coronary Care Unit (CCU)',
  'Pediatrics Ward',
  'Gynecology & Obstetrics',
  'Orthopedic Ward',
  'Emergency Observation',
];

function generateAdmissionSuggestion(): string {
  const year = new Date().getFullYear();
  const suffix = 1000 + (Date.now() % 9000);
  return `ADM-${year}-${suffix}`;
}

export function RecordAdmissionDialog({ patient, open, onClose }: RecordAdmissionDialogProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    patient_id: patient.id,
    admission_number: '',
    admission_date: new Date().toISOString().slice(0, 16),
    ward: 'Male Medical Ward',
    bed_number: '',
    attending_doctor: '',
    status: 'admitted' as const,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuggestAdmissionNumber = () => {
    setFormData((prev) => ({
      ...prev,
      admission_number: generateAdmissionSuggestion(),
    }));
    if (errors.admission_number) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.admission_number;
        return copy;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const formattedPayload = {
      ...formData,
      admission_date: new Date(formData.admission_date).toISOString(),
    };

    const result = createAdmissionSchema.safeParse(formattedPayload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString();
        if (field) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdmissionAction(result.data);

      if (!res.success) {
        setServerError(res.error.message);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onClose();
      router.refresh();
    } catch {
      setServerError('An unexpected error occurred while recording admission.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record Hospital Admission"
      description={`Admit patient ${patient.full_name} (${patient.mr_number}) to an inpatient ward.`}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {serverError && (
          <Alert variant="critical" title="Admission Failed" description={serverError} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="admission_number" className="text-xs font-semibold text-text-primary">
                Admission Number <span className="text-danger">*</span>
              </label>
              <button
                type="button"
                onClick={handleSuggestAdmissionNumber}
                className="text-[10px] text-primary hover:underline font-medium"
              >
                Auto-generate
              </button>
            </div>
            <Input
              id="admission_number"
              name="admission_number"
              placeholder="e.g. ADM-2026-0412"
              value={formData.admission_number}
              onChange={handleChange}
              error={Boolean(errors.admission_number)}
              className="font-mono text-xs uppercase"
              required
            />
            {errors.admission_number && (
              <p className="text-[11px] text-danger">{errors.admission_number}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="admission_date" className="text-xs font-semibold text-text-primary">
              Admission Date & Time <span className="text-danger">*</span>
            </label>
            <Input
              id="admission_date"
              name="admission_date"
              type="datetime-local"
              value={formData.admission_date}
              onChange={handleChange}
              error={Boolean(errors.admission_date)}
              className="text-xs"
              required
            />
            {errors.admission_date && (
              <p className="text-[11px] text-danger">{errors.admission_date}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="ward" className="text-xs font-semibold text-text-primary">
            Hospital Ward / Department <span className="text-danger">*</span>
          </label>
          <select
            id="ward"
            name="ward"
            value={formData.ward}
            onChange={handleChange}
            className="w-full h-9.5 rounded-md border border-border bg-card-bg px-3 py-1.5 text-xs text-text-primary focus-ring"
            required
          >
            {standardWards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          {errors.ward && <p className="text-[11px] text-danger">{errors.ward}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="bed_number" className="text-xs font-semibold text-text-primary">
              Bed Number (Optional)
            </label>
            <Input
              id="bed_number"
              name="bed_number"
              placeholder="e.g. Bed 14"
              value={formData.bed_number}
              onChange={handleChange}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="attending_doctor" className="text-xs font-semibold text-text-primary">
              Attending Physician
            </label>
            <Input
              id="attending_doctor"
              name="attending_doctor"
              placeholder="e.g. Dr. Asad Qureshi"
              value={formData.attending_doctor}
              onChange={handleChange}
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="gap-1.5"
          >
            <BedDouble className="h-3.5 w-3.5" />
            {isSubmitting ? 'Recording...' : 'Admit Patient'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
