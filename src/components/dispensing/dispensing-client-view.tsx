'use client';

/**
 * MedLedger — Dispensing Main Counter Client Workspace
 *
 * Combines the real-time dispensing counter, prescription selector,
 * printable receipt modal, and history audit table into a responsive tabbed view.
 */

import { useState } from 'react';
import {
  ClipboardCheck,
  History,
  FileCheck2,
  Package,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PrescriptionWithDetails } from '@/modules/prescriptions/types';
import { DispensingWithDetails, DispensingOverviewKPIs } from '@/modules/dispensing/types';
import { PatientPrescriptionsSearch } from './patient-prescriptions-search';
import { DispensingWorkspace } from './dispensing-workspace';
import { DispensingTable } from './dispensing-table';
import { DispensingReceiptDialog } from './dispensing-receipt-dialog';

interface DispensingClientViewProps {
  initialPrescriptions: PrescriptionWithDetails[];
  initialDispensingRecords: DispensingWithDetails[];
  kpis: DispensingOverviewKPIs;
}

export function DispensingClientView({
  initialPrescriptions,
  initialDispensingRecords,
  kpis,
}: DispensingClientViewProps) {
  const [activeTab, setActiveTab] = useState<'counter' | 'history'>('counter');
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithDetails | null>(
    null,
  );
  const [latestReceipt, setLatestReceipt] = useState<DispensingWithDetails | null>(null);
  const [dispensingRecords, setDispensingRecords] =
    useState<DispensingWithDetails[]>(initialDispensingRecords);

  function handleDispenseSuccess(result: DispensingWithDetails) {
    setLatestReceipt(result);
    setDispensingRecords((prev) => [result, ...prev]);
    setSelectedPrescription(null);
  }

  return (
    <div className="space-y-6">
      {/* Top Operational Big KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-card-bg rounded-2xl border-2 border-emerald-200/80 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 block">
              Dispensed Today • آج جاری کردہ
            </span>
            <span className="text-3xl sm:text-4xl font-black text-emerald-950 mt-1.5 block">
              {kpis.total_dispensed_today}
            </span>
            <span className="text-xs text-emerald-700 font-extrabold flex items-center gap-1.5 mt-1 bg-emerald-100/60 px-2.5 py-0.5 rounded-full w-fit">
              <Sparkles className="h-3.5 w-3.5" />
              {kpis.total_units_dispensed_today} units issued
            </span>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <ClipboardCheck className="h-7 w-7" strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-card-bg rounded-2xl border-2 border-primary/30 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary block">
              Pending Rx Queue • منتظر نسخے
            </span>
            <span className="text-3xl sm:text-4xl font-black text-text-primary mt-1.5 block">
              {kpis.pending_prescriptions_count}
            </span>
            <span className="text-xs text-text-secondary font-bold mt-1 block">
              Awaiting dispensary issue
            </span>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <Clock className="h-7 w-7" strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-card-bg rounded-2xl border-2 border-amber-200/80 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 block">
              Partially Dispensed • جزوی جاری
            </span>
            <span className="text-3xl sm:text-4xl font-black text-amber-950 mt-1.5 block">
              {kpis.partially_dispensed_count}
            </span>
            <span className="text-xs text-amber-800 font-bold mt-1 block">
              Remaining balance active
            </span>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <Package className="h-7 w-7" strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-card-bg rounded-2xl border-2 border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
              Reversals Recorded • واپس شدہ
            </span>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 mt-1.5 block">
              {kpis.reversed_dispensations_count}
            </span>
            <span className="text-xs text-slate-500 font-bold mt-1 block">
              Restored to warehouse
            </span>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <History className="h-7 w-7" strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex items-center gap-3 border-b-2 border-border pb-3">
        <button
          onClick={() => setActiveTab('counter')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-200 shadow-sm cursor-pointer ${
            activeTab === 'counter'
              ? 'bg-primary text-white shadow-md scale-[1.02]'
              : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg'
          }`}
        >
          <ClipboardCheck className="h-5 w-5" />
          <span>Dispensing Counter (دوائی جاری کاؤنٹر)</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-200 shadow-sm cursor-pointer ${
            activeTab === 'history'
              ? 'bg-primary text-white shadow-md scale-[1.02]'
              : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg'
          }`}
        >
          <History className="h-5 w-5" />
          <span>Dispensing History & Audit Log</span>
          <Badge variant="default" className="ml-1 text-xs font-bold">
            {dispensingRecords.length}
          </Badge>
        </button>
      </div>

      {/* Tab 1: Active Dispensing Counter */}
      {activeTab === 'counter' && (
        <div className="space-y-6">
          {selectedPrescription ? (
            <DispensingWorkspace
              prescription={selectedPrescription}
              onDispenseSuccess={handleDispenseSuccess}
              onCancelSelection={() => setSelectedPrescription(null)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Search & Queue Selector */}
              <div className="lg:col-span-5">
                <PatientPrescriptionsSearch
                  prescriptions={initialPrescriptions}
                  onSelectPrescription={(rx) => setSelectedPrescription(rx)}
                />
              </div>

              {/* Right Column: Prompt & Counter Welcome */}
              <div className="lg:col-span-7 bg-card-bg rounded-3xl border-2 border-border/80 p-8 sm:p-10 shadow-card text-center">
                <div className="max-w-md mx-auto space-y-5">
                  <div className="h-20 w-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <FileCheck2 className="h-10 w-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-text-primary tracking-tight">
                      Ready to Dispense Medicines
                    </h2>
                    <p className="text-sm font-bold text-primary mt-1" dir="rtl">
                      نسخہ منتخب کریں اور دوائی جاری کریں
                    </p>
                    <p className="text-sm text-text-secondary mt-2 leading-relaxed font-medium">
                      Select an eligible pending or partially dispensed prescription from the queue
                      on the left to open the batch allocation counter.
                    </p>
                  </div>

                  <div className="bg-page-bg p-5 rounded-2xl border-2 border-border text-left text-sm text-text-secondary space-y-3">
                    <div className="font-extrabold text-text-primary flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      Automatic Pharmacist Guarantees:
                    </div>
                    <ul className="list-disc list-inside space-y-2 text-text-secondary pl-1 font-medium text-xs sm:text-sm">
                      <li>First-Expiry-First-Out (FEFO) batches recommended automatically</li>
                      <li>Negative stock strictly prohibited at transaction boundary</li>
                      <li>Expired and quarantined stock excluded from dispensing eligibility</li>
                      <li>Double dispensing prevented via atomic idempotency keys</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Dispensing History & Audit Log */}
      {activeTab === 'history' && (
        <div>
          <DispensingTable initialRecords={dispensingRecords} />
        </div>
      )}

      {/* Printable Voucher Modal after Success */}
      <DispensingReceiptDialog
        open={Boolean(latestReceipt)}
        onClose={() => setLatestReceipt(null)}
        record={latestReceipt}
      />
    </div>
  );
}
