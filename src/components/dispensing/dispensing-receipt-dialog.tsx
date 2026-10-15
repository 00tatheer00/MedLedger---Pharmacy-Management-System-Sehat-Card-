'use client';

/**
 * MedLedger — Dispensing Receipt & Issue Voucher Dialog
 *
 * Provides printable clinical and accounting receipt for medicines dispensed
 * at DHQ Hospital Kohat central pharmacy.
 */

import { Printer, CheckCircle2 } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/decimal';
import { DispensingWithDetails } from '@/modules/dispensing/types';

interface DispensingReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  record: DispensingWithDetails | null;
}

export function DispensingReceiptDialog({ open, onClose, record }: DispensingReceiptDialogProps) {
  if (!record) return null;

  function handlePrint() {
    window.print();
  }

  const isReversed = record.status === 'reversed';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Pharmacy Dispensing Voucher"
      description="Official medicine issuance receipt for patient and clinical ward verification"
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Voucher
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-sm text-slate-800" id="printable-dispensing-receipt">
        {/* Hospital Header */}
        <div className="text-center border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            DHQ HOSPITAL KOHAT — CENTRAL PHARMACY
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Government of Khyber Pakhtunkhwa • Hospital Management System
          </p>
          <div className="mt-2 inline-flex items-center gap-2">
            <span className="font-mono font-semibold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
              {record.dispensing_number}
            </span>
            <Badge variant={isReversed ? 'danger' : 'success'}>
              {isReversed ? 'REVERSED / CANCELLED' : 'DISPENSED & VERIFIED'}
            </Badge>
          </div>
        </div>

        {/* Demographics & Clinical Context */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block">Patient Name:</span>
            <strong className="text-slate-900 text-sm">{record.patient_name}</strong>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-slate-600 font-mono">MRN: {record.mr_number}</span>
              {record.ssp_visit_no && (
                <span className="font-mono text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                  Party Code / SSP: {record.ssp_visit_no}
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-slate-500 block">Prescription Ref:</span>
            <strong className="text-slate-900 font-mono">{record.prescription_number}</strong>
            <span className="text-slate-600 block mt-0.5">
              {record.ward
                ? `${record.ward} (${record.bed_number || 'No bed assigned'})`
                : 'Outpatient (OPD)'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Dispensed By:</span>
            <span className="text-slate-800 font-medium">{record.dispensed_by_name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Date & Time:</span>
            <span className="text-slate-800 font-medium">
              {new Date(record.dispensed_at).toLocaleString('en-PK', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>

        {/* Dispensed Items Table */}
        <div>
          <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider mb-2">
            Dispensed Medicines & Batch Traceability
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Medicine</th>
                  <th className="p-2.5">Batch / Expiry</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Unit Rate</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {record.items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="p-2.5">
                      <div className="font-medium text-slate-900">{it.dispensed_medicine_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {it.strength} • {it.dosage_form}
                      </div>
                      {it.is_substitution && (
                        <span className="inline-block mt-0.5 text-[10px] text-amber-700 font-medium bg-amber-50 px-1 rounded">
                          Substitute: {it.substitution_reason}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">
                      <div>{it.batch_number}</div>
                      <div className="text-slate-500 text-[10px]">Exp: {it.expiry_date}</div>
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-900">
                      {it.quantity_dispensed}
                    </td>
                    <td className="p-2.5 text-right text-slate-600 font-mono">
                      {formatPKR(it.unit_price)}
                    </td>
                    <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                      {formatPKR(it.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="p-2.5 text-right">
                    Total Issued:
                  </td>
                  <td className="p-2.5 text-center">
                    {record.items.reduce((acc, it) => acc + it.quantity_dispensed, 0)} units
                  </td>
                  <td className="p-2.5 text-right">Gross Total:</td>
                  <td className="p-2.5 text-right font-mono text-primary text-sm">
                    {formatPKR(record.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {record.notes && (
          <div className="text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="font-semibold text-slate-700">Clinical Notes:</span>{' '}
            <span className="text-slate-600">{record.notes}</span>
          </div>
        )}

        {/* Verification & Signature Sign-off */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-dashed border-slate-300 text-xs">
          <div>
            <div className="border-b border-slate-400 pb-8 text-center" />
            <p className="text-center text-slate-600 mt-1 font-medium">
              Dispensing Pharmacist Sign & Stamp
            </p>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-8 text-center" />
            <p className="text-center text-slate-600 mt-1 font-medium">
              Recipient Signature (Nurse / Patient)
            </p>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 pt-2 flex items-center justify-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-600 inline" />
          Stock movement ledger updated atomically • MedLedger Pharmacy Core
        </div>
      </div>
    </Dialog>
  );
}
