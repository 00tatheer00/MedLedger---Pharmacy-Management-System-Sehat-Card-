'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { createPatientSchema } from '@/modules/patients/validation';
import { createPatientAction } from '@/modules/patients/actions';
import { Gender } from '@/modules/patients/types';

export function PatientRegistrationForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    mr_number: '',
    full_name: '',
    father_name: '',
    cnic: '',
    date_of_birth: '',
    gender: 'male' as Gender,
    phone: '',
    address: '',
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

    // Client-side schema validation
    const result = createPatientSchema.safeParse(formData);
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
      const res = await createPatientAction(result.data);

      if (!res.success) {
        setServerError(res.error.message);
        setIsSubmitting(false);
        return;
      }

      // Success -> navigate to patient detail
      router.push(`/patients/${res.data.id}?registered=true`);
    } catch {
      setServerError('An unexpected error occurred while saving the patient record.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors focus-ring rounded"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Patient Directory
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-light flex items-center justify-center text-primary">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Register New Patient
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                DHQ Hospital Kohat Pharmacy Clinical Intake
              </p>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-5">
            {serverError && (
              <Alert variant="critical" title="Registration Failed" description={serverError} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Medical Record Number (MRN) */}
              <div className="space-y-1 sm:col-span-1">
                <label
                  htmlFor="mr_number"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Medical Record Number (MRN) <span className="text-danger">*</span>
                </label>
                <Input
                  id="mr_number"
                  name="mr_number"
                  type="text"
                  placeholder="e.g. MRN-2026-00106"
                  value={formData.mr_number}
                  onChange={handleChange}
                  error={Boolean(errors.mr_number)}
                  required
                  className="font-mono text-xs uppercase"
                />
                {errors.mr_number ? (
                  <p className="text-[11px] text-danger">{errors.mr_number}</p>
                ) : (
                  <p className="text-[11px] text-text-muted">
                    Unique hospital/pharmacy record identifier.
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-1 sm:col-span-1">
                <label htmlFor="gender" className="block text-xs font-semibold text-text-primary">
                  Gender <span className="text-danger">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full h-9.5 rounded-md border border-border bg-card-bg px-3 py-1.5 text-xs text-text-primary focus-ring transition-colors"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-[11px] text-danger">{errors.gender}</p>}
              </div>

              {/* Full Name */}
              <div className="space-y-1 sm:col-span-2">
                <label
                  htmlFor="full_name"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Patient Full Name <span className="text-danger">*</span>
                </label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="e.g. Muhammad Tariq Khan"
                  value={formData.full_name}
                  onChange={handleChange}
                  error={Boolean(errors.full_name)}
                  required
                  className="text-xs"
                />
                {errors.full_name && <p className="text-[11px] text-danger">{errors.full_name}</p>}
              </div>

              {/* Father / Guardian Name */}
              <div className="space-y-1 sm:col-span-2">
                <label
                  htmlFor="father_name"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Father / Husband / Guardian Name
                </label>
                <Input
                  id="father_name"
                  name="father_name"
                  type="text"
                  placeholder="e.g. Sher Zaman Khan"
                  value={formData.father_name}
                  onChange={handleChange}
                  error={Boolean(errors.father_name)}
                  className="text-xs"
                />
                {errors.father_name && (
                  <p className="text-[11px] text-danger">{errors.father_name}</p>
                )}
              </div>

              {/* CNIC (Optional) */}
              <div className="space-y-1 sm:col-span-1">
                <label htmlFor="cnic" className="block text-xs font-semibold text-text-primary">
                  CNIC (Optional)
                </label>
                <Input
                  id="cnic"
                  name="cnic"
                  type="text"
                  placeholder="14301-0000000-0"
                  value={formData.cnic}
                  onChange={handleChange}
                  error={Boolean(errors.cnic)}
                  className="font-mono text-xs"
                />
                {errors.cnic ? (
                  <p className="text-[11px] text-danger">{errors.cnic}</p>
                ) : (
                  <p className="text-[11px] text-text-muted">
                    13 digits with hyphens. Optional for minors/walk-ins.
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1 sm:col-span-1">
                <label
                  htmlFor="date_of_birth"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Date of Birth (Optional)
                </label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  error={Boolean(errors.date_of_birth)}
                  className="text-xs"
                />
                {errors.date_of_birth && (
                  <p className="text-[11px] text-danger">{errors.date_of_birth}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1 sm:col-span-1">
                <label htmlFor="phone" className="block text-xs font-semibold text-text-primary">
                  Contact Phone Number (Optional)
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+92-333-1234567"
                  value={formData.phone}
                  onChange={handleChange}
                  error={Boolean(errors.phone)}
                  className="text-xs"
                />
                {errors.phone && <p className="text-[11px] text-danger">{errors.phone}</p>}
              </div>

              {/* Address */}
              <div className="space-y-1 sm:col-span-1">
                <label htmlFor="address" className="block text-xs font-semibold text-text-primary">
                  Residential Address / Locality
                </label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="e.g. Mohallah Jungle Khel, Kohat"
                  value={formData.address}
                  onChange={handleChange}
                  error={Boolean(errors.address)}
                  className="text-xs"
                />
                {errors.address && <p className="text-[11px] text-danger">{errors.address}</p>}
              </div>
            </div>

            <div className="rounded-lg bg-page-bg p-3 border border-border text-xs text-text-secondary flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                Patient records are protected by server-side authorization and Row Level Security.
                Creating this profile establishes a master index for linking hospital admissions and
                paper prescriptions.
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
            <Link href="/patients">
              <Button type="button" variant="outline" size="sm" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="min-w-28"
            >
              {isSubmitting ? 'Saving...' : 'Save Patient'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
