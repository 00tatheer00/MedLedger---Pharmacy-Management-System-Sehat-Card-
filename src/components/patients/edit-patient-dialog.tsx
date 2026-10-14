'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { updatePatientSchema } from '@/modules/patients/validation';
import { updatePatientAction } from '@/modules/patients/actions';
import { PatientWithRelations, Gender } from '@/modules/patients/types';

interface EditPatientDialogProps {
  patient: PatientWithRelations;
  open: boolean;
  onClose: () => void;
}

export function EditPatientDialog({ patient, open, onClose }: EditPatientDialogProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: patient.full_name,
    father_name: patient.father_name || '',
    cnic: patient.cnic || '',
    date_of_birth: patient.date_of_birth || '',
    gender: patient.gender as Gender,
    phone: patient.phone || '',
    address: patient.address || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
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

    const result = updatePatientSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString();
        if (field) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updatePatientAction(patient.id, result.data);

      if (!res.success) {
        setServerError(res.error.message);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onClose();
      router.refresh();
    } catch {
      setServerError('An unexpected error occurred while updating the patient.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Edit Patient: ${patient.mr_number}`}
      description="Update demographic details for this patient record. MR number cannot be altered."
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {serverError && (
          <Alert variant="critical" title="Update Failed" description={serverError} />
        )}

        <div className="space-y-1">
          <label htmlFor="edit_full_name" className="text-xs font-semibold text-text-primary">
            Full Name <span className="text-danger">*</span>
          </label>
          <Input
            id="edit_full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            error={Boolean(errors.full_name)}
            className="text-xs"
            required
          />
          {errors.full_name && <p className="text-[11px] text-danger">{errors.full_name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="edit_gender" className="text-xs font-semibold text-text-primary">
              Gender
            </label>
            <select
              id="edit_gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full h-9 rounded-md border border-border bg-card-bg px-2.5 py-1 text-xs text-text-primary focus-ring"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="edit_dob" className="text-xs font-semibold text-text-primary">
              Date of Birth
            </label>
            <Input
              id="edit_dob"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit_father_name" className="text-xs font-semibold text-text-primary">
            Father / Guardian Name
          </label>
          <Input
            id="edit_father_name"
            name="father_name"
            value={formData.father_name}
            onChange={handleChange}
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="edit_cnic" className="text-xs font-semibold text-text-primary">
              CNIC
            </label>
            <Input
              id="edit_cnic"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              placeholder="14301-0000000-0"
              className="font-mono text-xs"
            />
            {errors.cnic && <p className="text-[11px] text-danger">{errors.cnic}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="edit_phone" className="text-xs font-semibold text-text-primary">
              Phone
            </label>
            <Input
              id="edit_phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit_address" className="text-xs font-semibold text-text-primary">
            Address
          </label>
          <Input
            id="edit_address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="text-xs"
          />
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
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
