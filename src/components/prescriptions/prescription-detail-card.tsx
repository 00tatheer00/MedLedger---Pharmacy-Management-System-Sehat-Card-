'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  User,
  BedDouble,
  Clock,
  Printer,
  XCircle,
  ArrowLeft,
  Pill,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { PrescriptionWithDetails } from '@/modules/prescriptions/types';
import { cancelPrescriptionAction } from '@/modules/prescriptions/actions';

interface PrescriptionDetailCardProps {
  prescription: PrescriptionWithDetails;
}

export function PrescriptionDetailCard({ prescription }: PrescriptionDetailCardProps) {
  const router = useRouter();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancelPrescription = async () => {
    setIsCancelling(true);
    setCancelError(null);

    try {
      const res = await cancelPrescriptionAction(
        prescription.id,
        cancelReason || 'Cancelled by pharmacist',
      );

      if (!res.success) {
        setCancelError(res.error.message);
        setIsCancelling(false);
        return;
      }

      setIsCancelling(false);
      setShowCancelDialog(false);
      router.refresh();
    } catch {
      setCancelError('Failed to cancel prescription.');
      setIsCancelling(false);
    }
  };

  const isPending = prescription.status === 'pending';

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/prescriptions"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors focus-ring rounded"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Prescription Queue
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Order
          </Button>

          {isPending && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="text-xs gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <FileText className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold font-mono text-text-primary tracking-tight">
                    {prescription.prescription_number}
                  </h1>
                  <Badge
                    variant={
                      prescription.status === 'fully_dispensed'
                        ? 'success'
                        : prescription.status === 'pending'
                          ? 'info'
                          : prescription.status === 'cancelled'
                            ? 'danger'
                            : 'warning'
                    }
                    size="md"
                    className="capitalize font-semibold"
                  >
                    {prescription.status.replace('_', ' ')}
                  </Badge>
                  {prescription.admission ? (
                    <Badge variant="warning" size="md">
                      Inpatient • {prescription.admission.ward}
                    </Badge>
                  ) : (
                    <Badge variant="muted" size="md">
                      Outpatient / Walk-in
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-text-secondary">
                  Prescribing Physician:{' '}
                  <strong className="text-text-primary">{prescription.prescriber_name}</strong> •
                  Date: {prescription.prescription_date}
                </p>
              </div>
            </div>
          </div>

          {/* Affiliation Badges */}
          <div className="mt-5 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <Link
              href={`/patients/${prescription.patient_id}`}
              className="p-3 rounded-lg bg-page-bg/80 border border-border/60 hover:border-primary transition-colors focus-ring"
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase font-medium">Patient</span>
                  <span className="font-semibold text-text-primary">
                    {prescription.patient.full_name}
                  </span>
                  <span className="font-mono text-[11px] text-primary">
                    {prescription.patient.mr_number}
                  </span>
                </div>
              </div>
            </Link>

            <div className="p-3 rounded-lg bg-page-bg/80 border border-border/60">
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase font-medium">
                    Hospital Care Setting
                  </span>
                  {prescription.admission ? (
                    <>
                      <span className="font-semibold text-text-primary">
                        {prescription.admission.ward}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        {prescription.admission.admission_number}
                        {prescription.admission.bed_number
                          ? ` • ${prescription.admission.bed_number}`
                          : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-text-primary">Outpatient Dispensary</span>
                      <span className="text-[11px] text-text-muted">
                        No inpatient ward admission
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-page-bg/80 border border-border/60">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase font-medium">
                    Order Log
                  </span>
                  <span className="font-semibold text-text-primary">
                    Transcribed {new Date(prescription.created_at).toLocaleDateString('en-GB')}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Total {prescription.items.length} prescribed items
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Invariant Notice Banner */}
      <div className="rounded-xl border border-info/30 bg-info-light p-3.5 text-xs text-text-primary flex items-start gap-2.5">
        <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-primary">Inventory Integrity Invariant</p>
          <p className="text-text-secondary leading-relaxed">
            Prescription transcription registers clinician orders only.{' '}
            <strong>Zero inventory units have been deducted</strong> (dispensed quantity = 0). Stock
            allocation, batch selection (FEFO), and physical deduction are reserved strictly for the
            counter dispensing workflow.
          </p>
        </div>
      </div>

      {/* Prescribed Medicine Line Items */}
      <Card>
        <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            Prescribed Medicine Line Items ({prescription.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Medicine & Strength</TableHead>
                <TableHead>Generic & Category</TableHead>
                <TableHead>Dosage Instructions</TableHead>
                <TableHead className="text-center">Prescribed Qty</TableHead>
                <TableHead className="text-center">Dispensed Qty</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescription.items.map((it, idx) => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono text-xs text-text-muted">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-text-primary">
                        {it.medicine.name} ({it.medicine.strength})
                      </span>
                      <span className="text-[11px] text-text-muted">{it.medicine.dosage_form}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="text-text-primary">{it.medicine.generic_name}</span>
                      <span className="text-[11px] text-text-muted">{it.medicine.category}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    {it.dosage_instructions || (
                      <span className="italic text-text-muted">Standard protocol</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs text-text-primary">
                    {it.prescribed_quantity}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-text-muted">
                    {it.dispensed_quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        it.status === 'fully_dispensed'
                          ? 'success'
                          : it.status === 'pending'
                            ? 'info'
                            : 'default'
                      }
                      size="sm"
                      className="capitalize"
                    >
                      {it.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transcription Notes */}
      {prescription.notes && (
        <Card>
          <CardHeader className="px-4 py-2.5 border-b border-border">
            <CardTitle className="text-xs font-bold text-text-primary">
              Transcription Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs text-text-secondary leading-relaxed">
            {prescription.notes}
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="Cancel Prescription Order"
        description={`Are you sure you want to cancel order ${prescription.prescription_number}? This action cannot be undone.`}
      >
        <div className="space-y-3 pt-2">
          {cancelError && (
            <Alert variant="critical" title="Cancellation Failed" description={cancelError} />
          )}

          <div className="space-y-1">
            <label htmlFor="cancel_reason" className="text-xs font-semibold text-text-primary">
              Cancellation Reason
            </label>
            <Input
              id="cancel_reason"
              placeholder="e.g. Doctor changed medication, patient discharged, duplicate order"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelling}
            >
              Keep Order
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isCancelling}
              onClick={handleCancelPrescription}
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
