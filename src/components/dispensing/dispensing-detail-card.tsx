'use client';

/**
 * MedLedger — Dispensing Record Detail View Card
 *
 * Provides in-depth inspection of a completed or reversed dispensing event,
 * with batch lots, expiry dates, clinical substitutions, and financial auditability.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  RotateCcw,
  User,
  FileText,
  Calendar,
  Layers,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/decimal';
import { DispensingWithDetails } from '@/modules/dispensing/types';
import { DispensingReceiptDialog } from './dispensing-receipt-dialog';
import { ReverseDispensingDialog } from './reverse-dispensing-dialog';

interface DispensingDetailCardProps {
  initialRecord: DispensingWithDetails;
}

export function DispensingDetailCard({ initialRecord }: DispensingDetailCardProps) {
  const [record, setRecord] = useState<DispensingWithDetails>(initialRecord);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isReverseOpen, setIsReverseOpen] = useState(false);

  const isReversed = record.status === 'reversed';
  const totalUnits = record.items.reduce((acc, it) => acc + it.quantity_dispensed, 0);

  return (
    <div className="space-y-6">
      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dispensing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dispensing Counter
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReceiptOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Printer className="h-4 w-4" />
            Print Official Voucher
          </Button>

          {!isReversed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReverseOpen(true)}
              className="gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reverse Dispensation
            </Button>
          )}
        </div>
      </div>

      {/* Status Alert if Reversed */}
      {isReversed && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h3 className="font-bold text-rose-900">This Dispensing Record Has Been Reversed</h3>
            <p className="text-rose-700 mt-0.5">
              Compensating stock movement transactions were posted to the inventory ledger and all
              dispensed quantities were returned to on-hand inventory.
            </p>
            {record.notes && (
              <p className="font-mono text-slate-600 mt-1 bg-slate-50 p-1.5 rounded border border-slate-200">
                Audit Log: {record.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-primary bg-primary/10 px-2.5 py-0.5 rounded">
                {record.dispensing_number}
              </span>
              <Badge variant={isReversed ? 'danger' : 'success'}>
                {isReversed ? 'Reversed / Cancelled' : 'Completed & Stock Deducted'}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">
              Dispensation for {record.patient_name}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              MRN: {record.mr_number} • Prescription Slip #{record.prescription_number}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Gross Total Value</span>
            <span className="text-2xl font-bold font-mono text-slate-900">
              {formatPKR(record.total_amount)}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {record.items.length} line items • {totalUnits} total units
            </span>
          </div>
        </div>

        {/* Demographics & Clinical Information */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-5 text-xs">
          <div>
            <span className="text-slate-400 block flex items-center gap-1 mb-1 font-medium">
              <User className="h-3.5 w-3.5" /> Patient Demographics
            </span>
            <strong className="text-slate-900 block text-sm">{record.patient_name}</strong>
            <span className="text-slate-500 font-mono">MRN: {record.mr_number}</span>
          </div>

          <div>
            <span className="text-slate-400 block flex items-center gap-1 mb-1 font-medium">
              <FileText className="h-3.5 w-3.5" /> Care Setting
            </span>
            <strong className="text-slate-900 block text-sm">
              {record.ward ? record.ward : 'Outpatient Dispensary'}
            </strong>
            <span className="text-slate-500">
              {record.bed_number ? record.bed_number : 'Walk-in prescription'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block flex items-center gap-1 mb-1 font-medium">
              <Calendar className="h-3.5 w-3.5" /> Dispensed Timestamp
            </span>
            <strong className="text-slate-900 block text-sm">
              {new Date(record.dispensed_at).toLocaleDateString('en-PK', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </strong>
            <span className="text-slate-500">
              {new Date(record.dispensed_at).toLocaleTimeString('en-PK', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block flex items-center gap-1 mb-1 font-medium">
              <Layers className="h-3.5 w-3.5" /> Dispensing Officer
            </span>
            <strong className="text-slate-900 block text-sm">{record.dispensed_by_name}</strong>
            <span className="text-slate-500 font-mono">User: {record.dispensed_by}</span>
          </div>
        </div>

        {record.notes && (
          <div className="mt-5 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">Clinical & Handover Notes:</span>{' '}
            <span className="text-slate-600">{record.notes}</span>
          </div>
        )}
      </div>

      {/* Itemized Dispensed Medicines Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Dispensed Medicines & Batch Allocation Breakdown
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {record.items.length} items recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Medicine Formulation</th>
                <th className="p-3">Batch / Lot #</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3 text-center">Qty Dispensed</th>
                <th className="p-3 text-right">Agreed Rate</th>
                <th className="p-3 text-right">Total Amount</th>
                <th className="p-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {record.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="p-3">
                    <strong className="text-slate-900 block text-sm">
                      {item.dispensed_medicine_name}
                    </strong>
                    <span className="text-slate-500 text-[11px]">
                      {item.strength} • {item.dosage_form}
                    </span>
                    {item.is_substitution && (
                      <span className="inline-block mt-0.5 text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Substitute: {item.substitution_reason}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono font-semibold text-slate-800">
                    {item.batch_number}
                  </td>
                  <td className="p-3 font-mono text-slate-600">{item.expiry_date}</td>
                  <td className="p-3 text-center font-bold text-slate-900 text-sm">
                    {item.quantity_dispensed}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    {formatPKR(item.unit_price)}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-900 text-sm">
                    {formatPKR(item.total_price)}
                  </td>
                  <td className="p-3 text-slate-500 text-[11px]">
                    {item.is_fefo_override ? (
                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium block">
                        FEFO Override: {item.fefo_override_reason}
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium inline-block">
                        FEFO Compliant
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={3} className="p-3 text-right">
                  Cumulative Items Total:
                </td>
                <td className="p-3 text-center text-slate-900">{totalUnits} units</td>
                <td className="p-3 text-right text-slate-600">Grand Total:</td>
                <td className="p-3 text-right font-mono text-primary text-base">
                  {formatPKR(record.total_amount)}
                </td>
                <td className="p-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <DispensingReceiptDialog
        open={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        record={record}
      />

      {/* Reversal Confirmation Modal */}
      <ReverseDispensingDialog
        open={isReverseOpen}
        onClose={() => setIsReverseOpen(false)}
        record={record}
        onReversalSuccess={(updated) => setRecord(updated)}
      />
    </div>
  );
}
