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
import { FastCounterWorkspace } from './fast-counter-workspace';
import { Zap } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'quick' | 'queue' | 'history'>('quick');
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
      {/* Top Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card-bg rounded-xl border-2 border-emerald-200/80 p-4 sm:p-4.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              Dispensed Today • آج جاری کردہ
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mt-1 block">
              {kpis.total_dispensed_today}
            </span>
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 mt-1 bg-emerald-100/60 px-2 py-0.5 rounded-full w-fit">
              <Sparkles className="h-3 w-3" />
              {kpis.total_units_dispensed_today} units
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            <ClipboardCheck className="h-5.5 w-5.5" strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-card-bg rounded-xl border-2 border-primary/30 p-4 sm:p-4.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
              Pending Rx Queue • منتظر نسخے
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary mt-1 block">
              {kpis.pending_prescriptions_count}
            </span>
            <span className="text-xs text-text-secondary font-medium mt-1 block">
              Awaiting dispensary issue
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            <Clock className="h-5.5 w-5.5" strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-card-bg rounded-xl border-2 border-amber-200/80 p-4 sm:p-4.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
              Partially Dispensed • جزوی جاری
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-950 mt-1 block">
              {kpis.partially_dispensed_count}
            </span>
            <span className="text-xs text-amber-800 font-medium mt-1 block">
              Remaining balance active
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            <Package className="h-5.5 w-5.5" strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-card-bg rounded-xl border-2 border-slate-200 p-4 sm:p-4.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              Reversals Recorded • واپس شدہ
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
              {kpis.reversed_dispensations_count}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">
              Restored to warehouse
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            <History className="h-5.5 w-5.5" strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Tabs (Vibrant, Thin Borders, On Hover Glow) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('quick')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold border transition-all duration-200 cursor-pointer shadow-xs ${
            activeTab === 'quick'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 hover:shadow-xs'
          }`}
        >
          <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
          <span>⚡ 1-Screen Quick Counter (فوری پرچی کاؤنٹر)</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-bold">Fastest</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold border transition-all duration-200 cursor-pointer shadow-xs ${
            activeTab === 'queue'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50/50 hover:shadow-xs'
          }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>📋 Pre-entered Rx Queue (منتظر نسخے)</span>
          <Badge variant="default" className="ml-1 text-[11px] font-bold">
            {kpis.pending_prescriptions_count}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold border transition-all duration-200 cursor-pointer shadow-xs ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white border-slate-700 shadow-md shadow-slate-900/20'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:shadow-xs'
          }`}
        >
          <History className="h-4 w-4" />
          <span>📜 Dispensing History & Bills (جاری شدہ بلز)</span>
          <Badge variant="default" className="ml-1 text-[11px] font-bold">
            {dispensingRecords.length}
          </Badge>
        </button>
      </div>

      {/* Tab 1: 1-Screen Fast Dispense Counter (Default - Easy & Instant!) */}
      {activeTab === 'quick' && <FastCounterWorkspace onDispenseSuccess={handleDispenseSuccess} />}

      {/* Tab 2: Pre-entered Prescriptions Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-5">
          {selectedPrescription ? (
            <DispensingWorkspace
              prescription={selectedPrescription}
              onDispenseSuccess={handleDispenseSuccess}
              onCancelSelection={() => setSelectedPrescription(null)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Search & Queue Selector */}
              <div className="lg:col-span-5">
                <PatientPrescriptionsSearch
                  prescriptions={initialPrescriptions}
                  onSelectPrescription={(rx) => setSelectedPrescription(rx)}
                />
              </div>

              {/* Right Column: Prompt & Counter Welcome */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-border p-6 sm:p-7 shadow-card text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="h-14 w-14 bg-teal-50 text-teal-700 border border-teal-100 rounded-xl flex items-center justify-center mx-auto shadow-xs">
                    <FileCheck2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
                      Ready to Dispense Medicines
                    </h2>
                    <p className="text-xs font-bold text-primary mt-0.5" dir="rtl">
                      نسخہ منتخب کریں اور دوائی جاری کریں
                    </p>
                    <p className="text-xs sm:text-sm text-text-secondary mt-1.5 leading-relaxed font-medium">
                      Select an eligible pending or partially dispensed prescription from the queue
                      on the left to open the batch allocation counter.
                    </p>
                  </div>

                  <div className="bg-page-bg p-4 rounded-xl border border-border text-left text-xs sm:text-sm text-text-secondary space-y-2">
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
