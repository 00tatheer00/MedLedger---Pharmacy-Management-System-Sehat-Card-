'use client';

/**
 * MedLedger — Hospital Claim Preparation Form
 *
 * Compiles eligible dispensing line items into a formal hospital reimbursement claim
 * with date periods, calculated PKR totals, and draft or immediate submission options.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { formatPKR, multiplyMoney, addMoney } from '@/lib/decimal';
import { createClaimAction } from '@/modules/claims/actions';
import { EligibleDispensingPicker, SelectedClaimItem } from './eligible-dispensing-picker';

export function ClaimCreationForm() {
  const router = useRouter();

  // Form states
  const [periodStart, setPeriodStart] = useState('2026-10-01');
  const [periodEnd, setPeriodEnd] = useState('2026-10-13');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedClaimItem[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Computed summary
  const distinctPatients = new Set(selectedItems.map((s) => s.item.patient_id));
  const totalAmount = selectedItems.reduce((acc, s) => {
    const lineTotal = multiplyMoney(s.quantity, s.unit_rate);
    return addMoney(acc, lineTotal);
  }, 0);

  async function handleCreate(submitImmediately: boolean) {
    setError(null);
    setSuccessMessage(null);

    if (selectedItems.length === 0) {
      setError('Please select at least one eligible dispensing line item to create a claim.');
      return;
    }

    if (periodEnd < periodStart) {
      setError('Claim period end date cannot be earlier than start date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        claim_period_start: periodStart,
        claim_period_end: periodEnd,
        status: submitImmediately ? ('submitted' as const) : ('draft' as const),
        notes: notes.trim() || null,
        items: selectedItems.map((s) => ({
          dispensing_item_id: s.dispensing_item_id,
          quantity: s.quantity,
          unit_rate: s.unit_rate,
        })),
      };

      const res = await createClaimAction(payload);

      if (!res.success || !res.data) {
        setError(res.error || 'Failed to create claim');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        `Claim ${res.data.claim_number} created successfully ${
          submitImmediately ? 'and submitted for review' : 'as draft'
        }.`,
      );

      setTimeout(() => {
        router.push(`/claims/${res.data!.id}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/claims"
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Claims Queue
        </Link>
      </div>

      {error && <Alert variant="critical" title="Claim Preparation Error" description={error} />}

      {successMessage && <Alert variant="success" title="Success" description={successMessage} />}

      {/* 1. Header Period & Notes Configuration */}
      <Card className="p-6 border-slate-200 bg-white shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">1. Claim Period & Notes</h2>
          <p className="text-xs text-slate-500">
            Define the billing cycle window and administrative notes for DHQ Hospital
            administration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="claim-start-date"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Billing Period Start Date *
            </label>
            <Input
              id="claim-start-date"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="bg-slate-50 border-slate-200 text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="claim-end-date"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Billing Period End Date *
            </label>
            <Input
              id="claim-end-date"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="bg-slate-50 border-slate-200 text-sm"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="claim-notes"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Hospital Submission Notes (Optional)
            </label>
            <textarea
              id="claim-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. October batch for Emergency Trauma & Inpatient Medical Ward reimbursement."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </Card>

      {/* 2. Item Selector */}
      <Card className="p-6 border-slate-200 bg-white shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              2. Select Eligible Dispensing Records
            </h2>
            <p className="text-xs text-slate-500">
              Only completed, unreversed dispensing items with remaining claimable quotas appear
              here.
            </p>
          </div>
        </div>

        <EligibleDispensingPicker onSelectionChange={setSelectedItems} />
      </Card>

      {/* 3. Summary & Submission Actions */}
      <Card className="p-6 border-slate-200 bg-slate-900 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Compiled Claim Summary
            </div>
            <div className="flex items-center gap-6 mt-2">
              <div>
                <span className="text-xs text-slate-400 block">Selected Items</span>
                <span className="text-xl font-bold text-white">{selectedItems.length}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Patients</span>
                <span className="text-xl font-bold text-white">{distinctPatients.size}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Submitted Amount</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {formatPKR(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || selectedItems.length === 0}
              onClick={() => handleCreate(false)}
              className="flex-1 md:flex-none border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Save as Draft
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || selectedItems.length === 0}
              onClick={() => handleCreate(true)}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Submit Claim for Review
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
