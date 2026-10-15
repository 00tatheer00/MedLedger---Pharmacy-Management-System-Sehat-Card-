'use client';

/**
 * MedLedger — Patient & Prescription Dispensing Lookup
 *
 * Allows pharmacy counter staff to quickly look up eligible prescriptions
 * by MR Number, patient name, or prescription number.
 */

import { useState } from 'react';
import { Search, FileText, User, Bed, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PrescriptionWithDetails } from '@/modules/prescriptions/types';

interface PatientPrescriptionsSearchProps {
  prescriptions: PrescriptionWithDetails[];
  onSelectPrescription: (rx: PrescriptionWithDetails) => void;
  selectedPrescriptionId?: string | null;
}

export function PatientPrescriptionsSearch({
  prescriptions,
  onSelectPrescription,
  selectedPrescriptionId,
}: PatientPrescriptionsSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only pending or partially dispensed prescriptions
  const activeEligible = prescriptions.filter(
    (rx) => rx.status === 'pending' || rx.status === 'partially_dispensed',
  );

  const filtered = activeEligible.filter((rx) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      rx.prescription_number.toLowerCase().includes(term) ||
      rx.patient.full_name.toLowerCase().includes(term) ||
      rx.patient.mr_number.toLowerCase().includes(term) ||
      (rx.admission?.ward && rx.admission.ward.toLowerCase().includes(term)) ||
      (rx.admission?.ssp_visit_no && rx.admission.ssp_visit_no.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          Lookup Patient Prescription Queue
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Search by MR Number, Patient Name, Prescription Slip #, or SSP Visit # (Sehat Card).
        </p>
      </div>

      <div className="relative">
        <Input
          type="search"
          placeholder="e.g. MRN-2026-00101, Tariq Mehmood, RX-2026-0041, or SSP # 37634827..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-xs pl-3 pr-8 py-2"
        />
      </div>

      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg">
            <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">No eligible prescriptions found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Only pending or partially dispensed orders are available for dispensing.
            </p>
          </div>
        ) : (
          filtered.map((rx) => {
            const isSelected = selectedPrescriptionId === rx.id;
            const remainingCount = rx.items.filter(
              (it) => it.prescribed_quantity > it.dispensed_quantity,
            ).length;

            return (
              <div
                key={rx.id}
                className={`p-3 rounded-lg border text-xs transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {rx.patient.full_name}
                      <span className="font-mono text-slate-500 font-normal">
                        ({rx.patient.mr_number})
                      </span>
                      {rx.admission?.ssp_visit_no && (
                        <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          SSP #{rx.admission.ssp_visit_no}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="font-mono font-semibold text-primary">
                        {rx.prescription_number}
                      </span>
                      <span>•</span>
                      <span>{rx.prescription_date}</span>
                      {rx.admission ? (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700">
                            <Bed className="h-3 w-3 text-slate-400" />
                            {rx.admission.ward}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="text-slate-600">Outpatient (OPD)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    <Badge variant={rx.status === 'pending' ? 'default' : 'warning'}>
                      {rx.status === 'pending' ? 'Pending Dispense' : 'Partially Dispensed'}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {remainingCount} item(s) outstanding
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                    Prescribed by: {rx.prescriber_name}
                  </span>
                  <Button
                    size="sm"
                    variant={isSelected ? 'primary' : 'outline'}
                    onClick={() => onSelectPrescription(rx)}
                    className="h-7 text-xs gap-1.5"
                  >
                    {isSelected ? 'Active Selection' : 'Dispense Prescription'}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
