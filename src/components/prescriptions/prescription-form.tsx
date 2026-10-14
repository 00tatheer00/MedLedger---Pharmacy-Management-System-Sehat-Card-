'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft, Plus, Trash2, ShieldAlert, CheckCircle2, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { createPrescriptionSchema } from '@/modules/prescriptions/validation';
import { createPrescriptionAction } from '@/modules/prescriptions/actions';
import { PrescriptionMedicineSummary } from '@/modules/prescriptions/types';
import { PatientWithRelations } from '@/modules/patients/types';

interface PrescriptionFormProps {
  patients: PatientWithRelations[];
  medicines: PrescriptionMedicineSummary[];
  preselectedPatientId?: string;
}

interface ItemRow {
  medicine_id: string;
  prescribed_quantity: number;
  dosage_instructions: string;
  notes: string;
}

function generatePrescriptionSuggestion(): string {
  const year = new Date().getFullYear();
  const suffix = 1000 + (Date.now() % 9000);
  return `RX-${year}-${suffix}`;
}

export function PrescriptionTranscriptionForm({
  patients,
  medicines,
  preselectedPatientId,
}: PrescriptionFormProps) {
  const router = useRouter();

  const [prescriptionNumber, setPrescriptionNumber] = useState(generatePrescriptionSuggestion);
  const [selectedPatientId, setSelectedPatientId] = useState(
    preselectedPatientId || patients[0]?.id || '',
  );
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('');
  const [prescriberName, setPrescriberName] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const handleSuggestPrescriptionNumber = () => {
    setPrescriptionNumber(generatePrescriptionSuggestion());
    if (errors.prescription_number) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.prescription_number;
        return copy;
      });
    }
  };

  const [items, setItems] = useState<ItemRow[]>([
    {
      medicine_id: medicines[0]?.id || '',
      prescribed_quantity: 1,
      dosage_instructions: '',
      notes: '',
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine active admissions for currently selected patient
  const currentPatient = patients.find((p) => p.id === selectedPatientId);
  const patientAdmissions = currentPatient?.admissions || [];

  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId);
    const p = patients.find((pat) => pat.id === patientId);
    if (p?.activeAdmission) {
      setSelectedAdmissionId(p.activeAdmission.id);
    } else {
      setSelectedAdmissionId('');
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        medicine_id: medicines[0]?.id || '',
        prescribed_quantity: 1,
        dosage_instructions: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: string | number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const payload = {
      prescription_number: prescriptionNumber.trim(),
      patient_id: selectedPatientId,
      admission_id: selectedAdmissionId || null,
      prescriber_name: prescriberName.trim(),
      prescription_date: prescriptionDate,
      notes: notes.trim() || null,
      items: items.map((it) => ({
        medicine_id: it.medicine_id,
        prescribed_quantity: Number(it.prescribed_quantity),
        dosage_instructions: it.dosage_instructions.trim() || null,
        notes: it.notes.trim() || null,
      })),
    };

    const validation = createPrescriptionSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPrescriptionAction(validation.data);

      if (!res.success) {
        setServerError(res.error.message);
        setIsSubmitting(false);
        return;
      }

      router.push(`/prescriptions/${res.data.id}?created=true`);
    } catch {
      setServerError('An unexpected error occurred while recording the prescription.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/prescriptions"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors focus-ring rounded"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Prescription Queue
        </Link>
      </div>

      {/* Hospital Paper Prescription Warning Notice */}
      <div className="rounded-xl border border-warning/40 bg-warning-light p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Paper Prescription Transcription Interface</p>
          <p className="leading-relaxed">
            This module transcribes physician orders from handwritten prescription slips at DHQ
            Hospital Kohat.
            <strong>
              {' '}
              Manual entry does not verify handwriting authenticity, legality, or clinical
              correctness.
            </strong>{' '}
            Stock deduction is not performed here; stock allocation takes place exclusively at the
            dispensing counter.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-light flex items-center justify-center text-primary">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Transcribe Paper Prescription
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Record physician order line items, patient affiliation, and dosage instructions
              </p>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-5">
            {serverError && (
              <Alert variant="critical" title="Submission Failed" description={serverError} />
            )}

            {/* Header Form Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Prescription Identifier */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="rx_number"
                    className="block text-xs font-semibold text-text-primary"
                  >
                    Prescription Number <span className="text-danger">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestPrescriptionNumber}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    Auto-generate
                  </button>
                </div>
                <Input
                  id="rx_number"
                  placeholder="e.g. RX-2026-0881"
                  value={prescriptionNumber}
                  onChange={(e) => setPrescriptionNumber(e.target.value)}
                  className="font-mono text-xs uppercase"
                  required
                />
                {errors.prescription_number && (
                  <p className="text-[11px] text-danger">{errors.prescription_number}</p>
                )}
              </div>

              {/* Prescription Date */}
              <div className="space-y-1">
                <label htmlFor="rx_date" className="block text-xs font-semibold text-text-primary">
                  Prescription Date <span className="text-danger">*</span>
                </label>
                <Input
                  id="rx_date"
                  type="date"
                  value={prescriptionDate}
                  onChange={(e) => setPrescriptionDate(e.target.value)}
                  className="text-xs"
                  required
                />
                {errors.prescription_date && (
                  <p className="text-[11px] text-danger">{errors.prescription_date}</p>
                )}
              </div>

              {/* Prescriber Doctor Name */}
              <div className="space-y-1">
                <label
                  htmlFor="prescriber_name"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Prescribing Physician <span className="text-danger">*</span>
                </label>
                <Input
                  id="prescriber_name"
                  placeholder="e.g. Dr. Asad Qureshi"
                  value={prescriberName}
                  onChange={(e) => setPrescriberName(e.target.value)}
                  className="text-xs"
                  required
                />
                {errors.prescriber_name && (
                  <p className="text-[11px] text-danger">{errors.prescriber_name}</p>
                )}
              </div>
            </div>

            {/* Patient & Care Setting Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-page-bg/80 border border-border">
              {/* Patient Selector */}
              <div className="space-y-1">
                <label
                  htmlFor="patient_select"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Associated Patient <span className="text-danger">*</span>
                </label>
                <select
                  id="patient_select"
                  value={selectedPatientId}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  className="w-full h-9.5 rounded-md border border-border bg-card-bg px-2.5 py-1.5 text-xs text-text-primary focus-ring"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.mr_number} — {p.full_name} ({p.gender})
                    </option>
                  ))}
                </select>
                {errors.patient_id && (
                  <p className="text-[11px] text-danger">{errors.patient_id}</p>
                )}
              </div>

              {/* Admission / Care Setting Selector */}
              <div className="space-y-1">
                <label
                  htmlFor="admission_select"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Care Setting / Hospital Admission
                </label>
                <select
                  id="admission_select"
                  value={selectedAdmissionId}
                  onChange={(e) => setSelectedAdmissionId(e.target.value)}
                  className="w-full h-9.5 rounded-md border border-border bg-card-bg px-2.5 py-1.5 text-xs text-text-primary focus-ring"
                >
                  <option value="">Outpatient / Dispensary Walk-in (No Admission)</option>
                  {patientAdmissions.map((adm) => (
                    <option key={adm.id} value={adm.id}>
                      {adm.admission_number} — {adm.ward}{' '}
                      {adm.bed_number ? `(${adm.bed_number})` : ''} [{adm.status}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prescribed Medicine Line Items Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <Pill className="h-4 w-4 text-primary" />
                    Prescribed Medicine Line Items
                  </h4>
                  <p className="text-[11px] text-text-secondary">
                    Record each medicine item exactly as transcribed from the physician paper order.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Medicine
                </Button>
              </div>

              {errors.items && <p className="text-xs text-danger font-medium">{errors.items}</p>}

              <div className="space-y-2.5">
                {items.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border bg-card-bg shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                  >
                    {/* Medicine Dropdown */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-[11px] font-medium text-text-secondary">
                        Medicine #{idx + 1}
                      </label>
                      <select
                        value={row.medicine_id}
                        onChange={(e) => handleItemChange(idx, 'medicine_id', e.target.value)}
                        className="w-full h-9 rounded-md border border-border bg-card-bg px-2.5 py-1 text-xs text-text-primary focus-ring"
                        required
                      >
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.strength}) • {m.dosage_form}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Prescribed Quantity */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-medium text-text-secondary">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={row.prescribed_quantity}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'prescribed_quantity',
                            parseInt(e.target.value, 10) || 1,
                          )
                        }
                        className="h-9 text-xs"
                        required
                      />
                    </div>

                    {/* Dosage Instructions */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[11px] font-medium text-text-secondary">
                        Dosage Instructions
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. 1 tab TDS × 5 days after food"
                        value={row.dosage_instructions}
                        onChange={(e) =>
                          handleItemChange(idx, 'dosage_instructions', e.target.value)
                        }
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Remove Action */}
                    <div className="sm:col-span-1 flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={items.length <= 1}
                        onClick={() => handleRemoveItem(idx)}
                        className="h-9 w-9 p-0 text-text-muted hover:text-danger hover:bg-danger-light"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pharmacist Notes */}
            <div className="space-y-1 pt-1">
              <label htmlFor="rx_notes" className="block text-xs font-semibold text-text-primary">
                Pharmacist Transcription Notes (Optional)
              </label>
              <textarea
                id="rx_notes"
                rows={2}
                placeholder="e.g. Transcribed from emergency ward handwritten slip. Prescriber confirmed dose by phone."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-border bg-card-bg px-3 py-2 text-xs text-text-primary focus-ring"
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-[11px] text-text-muted">
              Prescription status will be saved as <strong>pending</strong>. Stock deduction occurs
              at dispensing.
            </span>

            <div className="flex items-center gap-2">
              <Link href="/prescriptions">
                <Button type="button" variant="outline" size="sm" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 shadow-sm min-w-36"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting ? 'Recording...' : 'Record Order'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
