'use client';

/**
 * MedLedger — Dispensing Workspace Counter Interface
 *
 * Implements the interactive dispensary counter for pharmacy officers:
 * - Patient and prescription overview
 * - Item-level batch selection with FEFO recommendation indicators
 * - FEFO override reason capture
 * - Optional brand/generic substitution recording
 * - Authoritative decimal-safe calculation
 * - Review and confirm modal with atomic submission and idempotency protection
 */

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Layers,
  FileCheck,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import { formatPKR, multiplyMoney, addMoney } from '@/lib/decimal';
import { PrescriptionWithDetails } from '@/modules/prescriptions/types';
import {
  DispensingWithDetails,
  FEFOBatchCandidate,
  DispenseItemInput,
} from '@/modules/dispensing/types';
import {
  dispensePrescriptionAction,
  getEligibleBatchesForMedicineAction,
} from '@/modules/dispensing/actions';

interface DispensingWorkspaceProps {
  prescription: PrescriptionWithDetails;
  onDispenseSuccess: (result: DispensingWithDetails) => void;
  onCancelSelection: () => void;
}

interface ItemDispenseState {
  prescription_item_id: string;
  selected_batch_id: string;
  dispensed_medicine_id: string;
  dispensing_quantity: number;
  unit_price: number;
  is_substitution: boolean;
  substitution_reason: string;
  is_fefo_override: boolean;
  fefo_override_reason: string;
  notes: string;
}

function generateIdempotencyKey(): string {
  return `disp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function DispensingWorkspace({
  prescription,
  onDispenseSuccess,
  onCancelSelection,
}: DispensingWorkspaceProps) {
  // Outstanding prescription items
  const eligibleItems = prescription.items.filter(
    (it) => it.prescribed_quantity > it.dispensed_quantity,
  );

  // Per-item batch cache: [medicineId]: FEFOBatchCandidate[]
  const [batchesByMed, setBatchesByMed] = useState<Record<string, FEFOBatchCandidate[]>>({});
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Form line state
  const [lineStates, setLineStates] = useState<Record<string, ItemDispenseState>>({});
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Fetch batches for each prescribed medicine
  useEffect(() => {
    let isMounted = true;
    async function loadBatches() {
      setLoadingBatches(true);
      const cache: Record<string, FEFOBatchCandidate[]> = {};
      const initialStates: Record<string, ItemDispenseState> = {};
      const itemsToLoad = prescription.items.filter(
        (it) => it.prescribed_quantity > it.dispensed_quantity,
      );

      for (const item of itemsToLoad) {
        try {
          const res = await getEligibleBatchesForMedicineAction(item.medicine_id);
          if (res.success && res.data) {
            cache[item.medicine_id] = res.data;

            // Pick recommended FEFO batch by default
            const recommended = res.data.find((b) => b.is_fefo_recommended && b.is_eligible);
            const remainingQty = item.prescribed_quantity - item.dispensed_quantity;
            const defaultBatchId = recommended ? recommended.batch.id : res.data[0]?.batch.id || '';
            const defaultQty = recommended
              ? Math.min(remainingQty, recommended.batch.quantity_on_hand)
              : 1;

            initialStates[item.id] = {
              prescription_item_id: item.id,
              selected_batch_id: defaultBatchId,
              dispensed_medicine_id: item.medicine_id,
              dispensing_quantity: defaultQty,
              unit_price: recommended ? recommended.batch.unit_cost : 0,
              is_substitution: false,
              substitution_reason: '',
              is_fefo_override: false,
              fefo_override_reason: '',
              notes: '',
            };
          }
        } catch {
          // Keep resilience
        }
      }

      if (isMounted) {
        setBatchesByMed(cache);
        setLineStates(initialStates);
        setLoadingBatches(false);
      }
    }

    loadBatches();
    return () => {
      isMounted = false;
    };
  }, [prescription.id, prescription.items]);

  function handleBatchChange(itemId: string, batchId: string, medicineId: string) {
    const candidates = batchesByMed[medicineId] || [];
    const chosen = candidates.find((c) => c.batch.id === batchId);
    const recommended = candidates.find((c) => c.is_fefo_recommended);

    const isOverride = Boolean(recommended && chosen && chosen.batch.id !== recommended.batch.id);

    setLineStates((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: {
          ...current,
          selected_batch_id: batchId,
          unit_price: chosen ? chosen.batch.unit_cost : current.unit_price,
          is_fefo_override: isOverride,
          fefo_override_reason: isOverride ? current.fefo_override_reason : '',
        },
      };
    });
  }

  function handleQuantityChange(itemId: string, qty: number, maxAllowed: number) {
    const safeQty = Math.max(1, Math.min(qty, maxAllowed));
    setLineStates((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: {
          ...current,
          dispensing_quantity: safeQty,
        },
      };
    });
  }

  function handleSubstitutionToggle(itemId: string, enabled: boolean) {
    setLineStates((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: {
          ...current,
          is_substitution: enabled,
          substitution_reason: enabled ? current.substitution_reason : '',
        },
      };
    });
  }

  // Calculate authoritative order summary
  const lineValues = eligibleItems.map((item) => {
    const state = lineStates[item.id];
    if (!state) return 0;
    return multiplyMoney(state.dispensing_quantity, state.unit_price);
  });
  const grossTotalAmount = addMoney(...lineValues);

  // Validate all lines before opening Review modal
  function validateBeforeReview(): boolean {
    for (const item of eligibleItems) {
      const state = lineStates[item.id];
      if (!state) return false;

      const remainingAuthorized = item.prescribed_quantity - item.dispensed_quantity;
      if (state.dispensing_quantity <= 0 || state.dispensing_quantity > remainingAuthorized) {
        setErrorMessage(
          `Invalid quantity for ${item.medicine.name}. Must be between 1 and ${remainingAuthorized}.`,
        );
        return false;
      }

      const candidates = batchesByMed[state.dispensed_medicine_id] || [];
      const selected = candidates.find((c) => c.batch.id === state.selected_batch_id);
      if (!selected || !selected.is_eligible) {
        setErrorMessage(`Please select an active, non-expired batch for ${item.medicine.name}.`);
        return false;
      }

      if (state.dispensing_quantity > selected.batch.quantity_on_hand) {
        setErrorMessage(
          `Insufficient stock in batch ${selected.batch.batch_number} for ${item.medicine.name}. Requested ${state.dispensing_quantity}, available ${selected.batch.quantity_on_hand}.`,
        );
        return false;
      }

      if (state.is_fefo_override && state.fefo_override_reason.trim().length < 3) {
        setErrorMessage(
          `Please provide a FEFO override audit justification of at least 3 characters for ${item.medicine.name}.`,
        );
        return false;
      }

      if (state.is_substitution && state.substitution_reason.trim().length < 3) {
        setErrorMessage(
          `Please provide a clinical substitution justification of at least 3 characters for ${item.medicine.name}.`,
        );
        return false;
      }
    }

    setErrorMessage(null);
    return true;
  }

  function handleOpenReview() {
    if (validateBeforeReview()) {
      setIsReviewOpen(true);
    }
  }

  async function handleConfirmAtomicDispense() {
    setIsSubmitting(true);
    setErrorMessage(null);

    const itemsPayload: DispenseItemInput[] = eligibleItems.map((item) => {
      const state = lineStates[item.id];
      return {
        prescription_item_id: item.id,
        medicine_batch_id: state.selected_batch_id,
        dispensed_medicine_id: state.dispensed_medicine_id,
        quantity: state.dispensing_quantity,
        unit_price: state.unit_price,
        is_substitution: state.is_substitution,
        substitution_reason: state.substitution_reason || undefined,
        is_fefo_override: state.is_fefo_override,
        fefo_override_reason: state.fefo_override_reason || undefined,
        notes: state.notes || undefined,
      };
    });

    try {
      const res = await dispensePrescriptionAction({
        prescription_id: prescription.id,
        notes: clinicalNotes.trim() || undefined,
        items: itemsPayload,
        idempotency_key: generateIdempotencyKey(),
      });

      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Failed to complete dispensing transaction.');
        setIsSubmitting(false);
        setIsReviewOpen(false);
        return;
      }

      setIsReviewOpen(false);
      onDispenseSuccess(res.data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
      setIsReviewOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Patient & Prescription Context Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full">
                Active Dispensing Counter
              </span>
              <span className="text-xs font-mono text-slate-500">
                Slip #{prescription.prescription_number}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {prescription.patient.full_name}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              MRN: {prescription.patient.mr_number} • Prescribed on {prescription.prescription_date}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onCancelSelection}>
              Change Prescription
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block">Attending Doctor:</span>
            <span className="font-semibold text-slate-800">{prescription.prescriber_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Location:</span>
            <span className="font-semibold text-slate-800">
              {prescription.admission
                ? `${prescription.admission.ward} (${prescription.admission.bed_number || 'Bed TBA'})`
                : 'Outpatient (OPD)'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Order Status:</span>
            <Badge variant={prescription.status === 'pending' ? 'default' : 'warning'}>
              {prescription.status === 'pending' ? 'Pending Dispense' : 'Partially Dispensed'}
            </Badge>
          </div>
          <div>
            <span className="text-slate-400 block">Outstanding Medicines:</span>
            <span className="font-semibold text-slate-800">
              {eligibleItems.length} line item(s)
            </span>
          </div>
        </div>

        {prescription.notes && (
          <div className="mt-3 p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs text-amber-900 flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Transcribed Prescriber Instructions:</strong>{' '}
              {prescription.notes}
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <Alert variant="critical" title="Dispensing Validation Error" description={errorMessage} />
      )}

      {/* Items Dispensing Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Batch Selection & Quantity Allocation
          </h2>
          <span className="text-xs text-slate-500">
            Enforces FEFO (First Expiry, First Out) & Non-Negative Inventory
          </span>
        </div>

        {loadingBatches ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            Querying available batches and verifying FEFO expiry ordering...
          </div>
        ) : (
          eligibleItems.map((item) => {
            const state = lineStates[item.id];
            const remainingAuthorized = item.prescribed_quantity - item.dispensed_quantity;
            const candidates = batchesByMed[state?.dispensed_medicine_id || item.medicine_id] || [];
            const selectedCandidate = candidates.find(
              (c) => c.batch.id === state?.selected_batch_id,
            );
            const lineTotal = state
              ? multiplyMoney(state.dispensing_quantity, state.unit_price)
              : 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.medicine.name}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{item.medicine.generic_name}</span>
                      <span>•</span>
                      <span>
                        {item.medicine.strength} • {item.medicine.dosage_form}
                      </span>
                    </div>
                    {item.dosage_instructions && (
                      <div className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded mt-1.5 inline-block">
                        Dosage: {item.dosage_instructions}
                      </div>
                    )}
                  </div>

                  {/* Quantity Breakdown Badges */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Prescribed
                      </span>
                      <strong className="text-slate-800">{item.prescribed_quantity}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Prev. Dispensed
                      </span>
                      <span className="text-slate-600 font-medium">{item.dispensed_quantity}</span>
                    </div>
                    <div className="text-right bg-primary/5 px-2 py-1 rounded border border-primary/20">
                      <span className="text-[10px] text-primary block uppercase font-bold">
                        Remaining Auth
                      </span>
                      <strong className="text-primary text-sm">{remainingAuthorized}</strong>
                    </div>
                  </div>
                </div>

                {/* Batch Selector & Allocation Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Batch Selection (md: 7 cols) */}
                  <div className="md:col-span-7 space-y-2">
                    <label
                      htmlFor={`batch-select-${item.id}`}
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Select Available Batch (FEFO Prioritized){' '}
                      <span className="text-rose-500">*</span>
                    </label>

                    <select
                      id={`batch-select-${item.id}`}
                      value={state?.selected_batch_id || ''}
                      onChange={(e) => handleBatchChange(item.id, e.target.value, item.medicine_id)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {candidates.length === 0 ? (
                        <option value="" disabled>
                          No active batches available in warehouse
                        </option>
                      ) : (
                        candidates.map((c) => (
                          <option key={c.batch.id} value={c.batch.id} disabled={!c.is_eligible}>
                            {c.batch.batch_number} • Exp: {c.batch.expiry_date} • Stock:{' '}
                            {c.batch.quantity_on_hand}
                            {c.is_fefo_recommended ? ' ★ [FEFO RECOMMENDED]' : ''}
                            {!c.is_eligible ? ` (${c.ineligibility_reason})` : ''}
                          </option>
                        ))
                      )}
                    </select>

                    {/* FEFO Recommendation Indicator */}
                    {selectedCandidate?.is_fefo_recommended && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                          Optimal batch: Earliest expiring stock selected in compliance with FEFO
                          rules.
                        </span>
                      </div>
                    )}

                    {/* FEFO Override Warning and Audit Reason Capture */}
                    {state?.is_fefo_override && (
                      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-300 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span>FEFO Selection Override Flagged</span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          You have selected a batch other than the earliest-expiring batch. Hospital
                          audit policy requires documenting the justification.
                        </p>
                        <Input
                          placeholder="Reason for selecting later batch (e.g. Ward packaging preference, physical location hold)..."
                          value={state.fefo_override_reason}
                          onChange={(e) =>
                            setLineStates((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], fefo_override_reason: e.target.value },
                            }))
                          }
                          className="text-xs bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Quantity Input (md: 3 cols) */}
                  <div className="md:col-span-3 space-y-1">
                    <label
                      htmlFor={`qty-input-${item.id}`}
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Dispense Quantity <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`qty-input-${item.id}`}
                        type="number"
                        min={1}
                        max={Math.min(
                          remainingAuthorized,
                          selectedCandidate?.batch.quantity_on_hand || remainingAuthorized,
                        )}
                        value={state?.dispensing_quantity || 1}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.id,
                            Number(e.target.value),
                            Math.min(
                              remainingAuthorized,
                              selectedCandidate?.batch.quantity_on_hand || remainingAuthorized,
                            ),
                          )
                        }
                        className="text-xs font-bold text-slate-900"
                      />
                      <span className="text-xs text-slate-500 font-medium">units</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Max:{' '}
                      {Math.min(
                        remainingAuthorized,
                        selectedCandidate?.batch.quantity_on_hand || remainingAuthorized,
                      )}{' '}
                      units
                    </span>
                  </div>

                  {/* Line Valuation (md: 2 cols) */}
                  <div className="md:col-span-2 text-right space-y-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                      Line Total
                    </span>
                    <strong className="text-sm font-mono text-slate-900 block">
                      {formatPKR(lineTotal)}
                    </strong>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      @{formatPKR(state?.unit_price || 0)}/unit
                    </span>
                  </div>
                </div>

                {/* Optional Substitution Accordion */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(state?.is_substitution)}
                      onChange={(e) => handleSubstitutionToggle(item.id, e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span>Dispense Equivalent Medicine (Generic / Brand Substitution)</span>
                  </label>
                </div>

                {state?.is_substitution && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>Authorized Clinical Substitution Record</span>
                    </div>
                    <Input
                      placeholder="Mandatory clinical substitution rationale (e.g. Prescribed brand stock-out; approved generic equivalent dispensed)..."
                      value={state.substitution_reason}
                      onChange={(e) =>
                        setLineStates((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], substitution_reason: e.target.value },
                        }))
                      }
                      className="text-xs bg-white"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Counter Action & Summary Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 block">Gross Dispensing Value:</span>
          <span className="text-2xl font-bold font-mono text-slate-900">
            {formatPKR(grossTotalAmount)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {eligibleItems.length} medicine(s) scheduled for atomic stock deduction
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancelSelection}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleOpenReview}
            disabled={loadingBatches || eligibleItems.length === 0}
            className="gap-2"
          >
            <FileCheck className="h-5 w-5" />
            Review & Finalize Dispensing
          </Button>
        </div>
      </div>

      {/* Review & Final Confirmation Modal */}
      <Dialog
        open={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Confirm Medicine Dispensing"
        description="Verify all batch lot allocations before executing atomic inventory deduction"
        className="max-w-2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
              disabled={isSubmitting}
            >
              Back to Edit
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmAtomicDispense}
              disabled={isSubmitting}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {isSubmitting ? 'Deducting Inventory & Saving...' : 'Confirm & Atomic Dispense'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-800">
          <Alert
            variant="warning"
            title="Atomic Stock Movement Confirmation"
            description="Upon confirmation, MedLedger will immediately deduct stock from the central inventory ledger and update the prescription status in a single atomic database transaction."
          />

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 text-sm mb-1">
              Patient: {prescription.patient.full_name} ({prescription.patient.mr_number})
            </div>
            <div className="text-slate-600 font-mono">
              Slip: {prescription.prescription_number} • Attending: {prescription.prescriber_name}
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-semibold text-slate-700">
                <tr>
                  <th className="p-2">Medicine</th>
                  <th className="p-2">Batch #</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Unit Rate</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {eligibleItems.map((item) => {
                  const state = lineStates[item.id];
                  const candidates =
                    batchesByMed[state?.dispensed_medicine_id || item.medicine_id] || [];
                  const chosen = candidates.find((c) => c.batch.id === state?.selected_batch_id);
                  const total = state
                    ? multiplyMoney(state.dispensing_quantity, state.unit_price)
                    : 0;

                  return (
                    <tr key={item.id}>
                      <td className="p-2">
                        <strong className="text-slate-900">{item.medicine.name}</strong>
                        {state?.is_fefo_override && (
                          <div className="text-[10px] text-amber-700 font-medium">
                            FEFO Override: {state.fefo_override_reason}
                          </div>
                        )}
                        {state?.is_substitution && (
                          <div className="text-[10px] text-primary font-medium">
                            Substitute: {state.substitution_reason}
                          </div>
                        )}
                      </td>
                      <td className="p-2 font-mono">{chosen?.batch.batch_number || 'N/A'}</td>
                      <td className="p-2 text-center font-bold">{state?.dispensing_quantity}</td>
                      <td className="p-2 text-right font-mono text-slate-600">
                        {formatPKR(state?.unit_price || 0)}
                      </td>
                      <td className="p-2 text-right font-mono font-semibold text-slate-900">
                        {formatPKR(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="p-2 text-right">
                    Total Value:
                  </td>
                  <td className="p-2 text-right font-mono text-primary text-sm">
                    {formatPKR(grossTotalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispensing Notes (Optional)
            </label>
            <Input
              placeholder="e.g. Handed over to floor nurse Dr. Asad for Bed 14..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
