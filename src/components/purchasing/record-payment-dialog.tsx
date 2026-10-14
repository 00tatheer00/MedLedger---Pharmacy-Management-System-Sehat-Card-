'use client';

/**
 * MedLedger — Supplier Payment Voucher Dialog Component
 *
 * Implements multi-invoice payment allocation: allows finance officers to record
 * disbursements and allocate funds across multiple outstanding supplier invoices.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { Supplier } from '@/modules/suppliers/types';
import { SupplierInvoice } from '@/modules/purchasing/types';
import { recordSupplierPaymentAction } from '@/modules/purchasing/actions';
import { addMoney, formatPKR } from '@/lib/decimal';

interface RecordPaymentDialogProps {
  suppliers: Supplier[];
  invoices: SupplierInvoice[];
  preselectedSupplierId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function generatePaymentIdempotencyKey(supplierId: string): string {
  return `pay-${supplierId}-${Date.now()}`;
}

export function RecordPaymentDialog({
  suppliers,
  invoices,
  preselectedSupplierId = '',
  open,
  onOpenChange,
}: RecordPaymentDialogProps) {
  const router = useRouter();

  const [selectedSupplierId, setSelectedSupplierId] = useState(
    preselectedSupplierId || suppliers[0]?.id || '',
  );
  const [paymentDate, setPaymentDate] = useState(getTodayDateString);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cheque' | 'cash'>(
    'bank_transfer',
  );
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Track allocations: key is invoiceId, value is allocated PKR amount
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Invoices eligible for payment for this supplier (outstanding > 0)
  const outstandingInvoices = invoices.filter(
    (inv) => inv.supplier_id === selectedSupplierId && inv.outstanding_balance > 0,
  );

  const handleAllocationChange = (invoiceId: string, val: number) => {
    setAllocations((prev) => ({
      ...prev,
      [invoiceId]: Math.max(0, val),
    }));
  };

  const handleAllocateFull = (invoiceId: string, maxBalance: number) => {
    setAllocations((prev) => ({
      ...prev,
      [invoiceId]: maxBalance,
    }));
  };

  const totalAllocated = Object.values(allocations).reduce(
    (sum, val) => addMoney(sum, val || 0),
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (amount <= 0) {
      setServerError('Payment amount must be greater than zero.');
      return;
    }

    if (totalAllocated !== amount) {
      setServerError(
        `Total allocated across invoices (PKR ${totalAllocated.toFixed(2)}) must exactly equal the payment voucher amount (PKR ${amount.toFixed(2)}).`,
      );
      return;
    }

    const allocationItems = Object.entries(allocations)
      .filter(([, allocAmt]) => allocAmt > 0)
      .map(([invoiceId, allocAmt]) => ({
        invoice_id: invoiceId,
        amount_allocated: allocAmt,
      }));

    if (allocationItems.length === 0) {
      setServerError('Please allocate payment funds to at least one invoice.');
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = generatePaymentIdempotencyKey(selectedSupplierId);
      const res = await recordSupplierPaymentAction({
        supplier_id: selectedSupplierId,
        payment_date: paymentDate,
        amount: Number(amount),
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        idempotency_key: idempotencyKey,
        allocations: allocationItems,
      });

      if (!res.success) {
        setServerError(res.error || 'Failed to record payment voucher.');
        setIsSubmitting(false);
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title="Record Supplier Payment Voucher"
      description="Record a treasury disbursement and allocate the settlement across outstanding vendor invoices."
      className="max-w-3xl max-h-[90vh] overflow-y-auto"
    >
      {serverError && (
        <Alert
          variant="critical"
          title="Validation Block"
          description={serverError}
          className="my-2"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Top Payment Inputs */}
        <div className="p-4 rounded-xl border border-border bg-surface-muted/20 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Distributor / Payee <span className="text-rose-600">*</span>
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => {
                setSelectedSupplierId(e.target.value);
                setAllocations({});
              }}
              required
              className="w-full h-9 px-2 text-xs rounded border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Disbursement Date <span className="text-rose-600">*</span>
            </label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="h-9 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Payment Amount (PKR) <span className="text-rose-600">*</span>
            </label>
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 50000.00"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="h-9 text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Disbursement Method <span className="text-rose-600">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as 'bank_transfer' | 'cheque' | 'cash')
              }
              required
              className="w-full h-9 px-2 text-xs rounded border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            >
              <option value="bank_transfer">Online Bank Transfer</option>
              <option value="cheque">Bank Cheque</option>
              <option value="cash">Petty Cash</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Cheque Number / Bank Transaction Ref
            </label>
            <Input
              placeholder="e.g. NBP-FT-2026-9912 or Cheque # 882910"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>
        </div>

        {/* Invoices Allocation Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Allocate Across Outstanding Invoices ({outstandingInvoices.length})
            </h4>
            <span className="text-xs font-mono text-text-secondary">
              Allocated:{' '}
              <span
                className={
                  totalAllocated === amount && amount > 0
                    ? 'text-emerald-700 font-bold'
                    : 'text-amber-700 font-bold'
                }
              >
                {formatPKR(totalAllocated)}
              </span>{' '}
              / {formatPKR(amount)}
            </span>
          </div>

          {outstandingInvoices.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-border rounded-lg text-xs text-text-muted">
              No unpaid or outstanding invoices found for this distributor.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {outstandingInvoices.map((inv) => {
                const currentAlloc = allocations[inv.id] || 0;

                return (
                  <div
                    key={inv.id}
                    className="p-3 rounded-lg border border-border bg-white flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-text-primary">
                        {inv.invoice_number}
                      </div>
                      <div className="text-text-muted">
                        Dated {inv.invoice_date} • Outstanding:{' '}
                        <span className="font-semibold text-amber-700">
                          {formatPKR(inv.outstanding_balance)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAllocateFull(inv.id, inv.outstanding_balance)}
                        className="h-7 px-2 text-[11px] text-primary"
                      >
                        Max
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max={inv.outstanding_balance}
                        step="0.01"
                        placeholder="Allocated"
                        value={currentAlloc || ''}
                        onChange={(e) => handleAllocationChange(inv.id, Number(e.target.value))}
                        className="w-28 h-8 text-xs font-mono text-right"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Payment Remarks
          </label>
          <textarea
            placeholder="e.g. Settle consignment for October deliveries as per approved voucher."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Action Bar */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || amount <= 0 || totalAllocated !== amount}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Recording Voucher...' : 'Confirm Payment Voucher'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
