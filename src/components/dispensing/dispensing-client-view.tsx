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
      {/* Top Operational KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Dispensed Today</span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
              {kpis.total_dispensed_today}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <Sparkles className="h-3 w-3" />
              {kpis.total_units_dispensed_today} units issued
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Pending Rx Queue</span>
            <span className="text-2xl font-bold font-mono text-primary mt-1 block">
              {kpis.pending_prescriptions_count}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Awaiting dispensary issue
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Partially Dispensed</span>
            <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">
              {kpis.partially_dispensed_count}
            </span>
            <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
              Remaining balance active
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Reversals Recorded</span>
            <span className="text-2xl font-bold font-mono text-slate-700 mt-1 block">
              {kpis.reversed_dispensations_count}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Restored to warehouse</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <History className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('counter')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'counter'
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          Dispensing Counter
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="h-4 w-4" />
          Dispensing History & Audit Log
          <Badge variant="default" className="ml-1 text-[10px]">
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
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
                    <FileCheck2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Ready to Dispense Medicines
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Select an eligible pending or partially dispensed prescription from the queue
                      on the left to open the batch allocation counter.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-2">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      Automatic Pharmacist Guarantees:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1 text-[11px]">
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
