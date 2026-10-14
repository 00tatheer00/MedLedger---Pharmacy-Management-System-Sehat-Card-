'use client';

/**
 * MedLedger — Goods Receiving Dialog Component (GRN)
 *
 * Implements physical goods intake against purchase orders.
 * Automatically verifies batch lot numbers, expiration dates, discrepancy rejection reasons,
 * and passes accepted units through the trusted inventory transaction mechanism.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { PurchaseOrder } from '@/modules/purchasing/types';
import { receiveGoodsAction } from '@/modules/purchasing/actions';

interface GoodsReceivingDialogProps {
  order: PurchaseOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReceivingItemState {
  purchase_order_item_id: string;
  medicine_id: string;
  medicine_name: string;
  batch_number: string;
  expiry_date: string;
  quantity_ordered: number;
  quantity_already_received: number;
  remaining_quantity: number;
  quantity_received: number;
  quantity_accepted: number;
  quantity_rejected: number;
  rejection_reason: string;
  unit_cost: number;
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultExpiryDateString(): string {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function generateGRNIdempotencyKey(orderId: string): string {
  return `grn-${orderId}-${Date.now()}`;
}

export function GoodsReceivingDialog({ order, open, onOpenChange }: GoodsReceivingDialogProps) {
  const router = useRouter();

  const [receivedDate, setReceivedDate] = useState(getTodayDateString);
  const [deliveryChallan, setDeliveryChallan] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [createInvoice, setCreateInvoice] = useState(true);
  const [notes, setNotes] = useState('');

  // Initialize line items with remaining quantities
  const [items, setItems] = useState<ReceivingItemState[]>(() => {
    return order.items
      .filter((i) => i.quantity_ordered - i.quantity_received > 0)
      .map((i) => {
        const remaining = i.quantity_ordered - i.quantity_received;
        return {
          purchase_order_item_id: i.id,
          medicine_id: i.medicine_id,
          medicine_name: i.medicine_name || 'Medicine Item',
          batch_number: '',
          expiry_date: getDefaultExpiryDateString(),
          quantity_ordered: i.quantity_ordered,
          quantity_already_received: i.quantity_received,
          remaining_quantity: remaining,
          quantity_received: remaining,
          quantity_accepted: remaining,
          quantity_rejected: 0,
          rejection_reason: '',
          unit_cost: i.unit_price,
        };
      });
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleItemFieldChange = (
    index: number,
    field: keyof ReceivingItemState,
    value: string | number,
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-balance if quantity_received changes
      if (field === 'quantity_received') {
        const delivered = Number(value) || 0;
        const accepted = Math.min(delivered, updated[index].remaining_quantity);
        updated[index].quantity_accepted = accepted;
        updated[index].quantity_rejected = Math.max(0, delivered - accepted);
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Validation
    for (const item of items) {
      if (item.quantity_accepted > 0) {
        if (!item.batch_number.trim()) {
          setServerError(`Please enter a batch number for ${item.medicine_name}.`);
          return;
        }
        if (!item.expiry_date || item.expiry_date <= getTodayDateString()) {
          setServerError(
            `Expiry date for ${item.medicine_name} must be a future date (cannot receive expired medicine).`,
          );
          return;
        }
      }
      if (item.quantity_accepted > item.remaining_quantity) {
        setServerError(
          `Accepted quantity (${item.quantity_accepted}) for ${item.medicine_name} exceeds outstanding order quantity (${item.remaining_quantity}).`,
        );
        return;
      }
      if (item.quantity_accepted + item.quantity_rejected !== item.quantity_received) {
        setServerError(
          `For ${item.medicine_name}, accepted (${item.quantity_accepted}) + rejected (${item.quantity_rejected}) must equal delivered (${item.quantity_received}).`,
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = generateGRNIdempotencyKey(order.id);
      const res = await receiveGoodsAction({
        purchase_order_id: order.id,
        supplier_id: order.supplier_id,
        received_date: receivedDate,
        delivery_challan_number: deliveryChallan.trim() || undefined,
        supplier_invoice_ref: invoiceRef.trim() || undefined,
        create_invoice: createInvoice,
        notes: notes.trim() || undefined,
        idempotency_key: idempotencyKey,
        items: items.map((i) => ({
          purchase_order_item_id: i.purchase_order_item_id,
          medicine_id: i.medicine_id,
          batch_number: i.batch_number.trim().toUpperCase(),
          expiry_date: i.expiry_date,
          quantity_received: Number(i.quantity_received),
          quantity_accepted: Number(i.quantity_accepted),
          quantity_rejected: Number(i.quantity_rejected),
          rejection_reason: i.rejection_reason.trim() || undefined,
          unit_cost: Number(i.unit_cost),
        })),
      });

      if (!res.success) {
        setServerError(res.error || 'Failed to record goods receipt.');
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
      title="Goods Receipt Note (GRN) — Intake Record"
      description={`Record physical stock received against purchase order ${order.po_number}. Accepted stock will immediately register batch lots and update the stock ledger.`}
      className="max-w-4xl max-h-[90vh] overflow-y-auto"
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
        {/* Top delivery details */}
        <div className="p-4 rounded-xl border border-border bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Receipt Date <span className="text-rose-600">*</span>
            </label>
            <Input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              required
              className="h-9 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Delivery Challan # (Optional)
            </label>
            <Input
              placeholder="e.g. DC-2026-9921"
              value={deliveryChallan}
              onChange={(e) => setDeliveryChallan(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Supplier Invoice # (Optional)
            </label>
            <Input
              placeholder="e.g. INV-88124"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>
        </div>

        {/* Invoice generation checkbox */}
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            id="create_invoice"
            checked={createInvoice}
            onChange={(e) => setCreateInvoice(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="create_invoice" className="text-xs text-text-secondary cursor-pointer">
            Automatically generate a pending Supplier Invoice from this receipt (requires invoice
            reference)
          </label>
        </div>

        {/* Items breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Consignment Items Verification ({items.length})
          </h4>

          {items.map((item, idx) => (
            <div
              key={item.purchase_order_item_id}
              className="p-3 rounded-lg border border-border bg-white shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <span className="font-semibold text-sm text-text-primary">
                    {item.medicine_name}
                  </span>
                  <span className="text-xs text-text-muted ml-2">
                    (Ordered: {item.quantity_ordered} • Already Received:{' '}
                    {item.quantity_already_received} • Outstanding: {item.remaining_quantity})
                  </span>
                </div>
                <span className="text-xs font-mono text-text-secondary">
                  Unit Cost: PKR {item.unit_cost.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Batch Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    Batch / Lot # <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    placeholder="e.g. B-2026-99"
                    value={item.batch_number}
                    onChange={(e) => handleItemFieldChange(idx, 'batch_number', e.target.value)}
                    required
                    className="h-8 text-xs font-mono uppercase"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    Expiry Date <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    type="date"
                    value={item.expiry_date}
                    onChange={(e) => handleItemFieldChange(idx, 'expiry_date', e.target.value)}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>

                {/* Quantity Delivered */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    Delivered Qty
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity_received}
                    onChange={(e) =>
                      handleItemFieldChange(idx, 'quantity_received', Number(e.target.value))
                    }
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>

                {/* Quantity Accepted (Stock intake) */}
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-700 mb-1">
                    Accepted (Stock)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={item.remaining_quantity}
                    value={item.quantity_accepted}
                    onChange={(e) =>
                      handleItemFieldChange(idx, 'quantity_accepted', Number(e.target.value))
                    }
                    required
                    className="h-8 text-xs font-mono border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Quantity Rejected (Damaged/Discrepant) */}
                <div>
                  <label className="block text-[11px] font-semibold text-rose-700 mb-1">
                    Rejected Qty
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={item.quantity_rejected}
                    onChange={(e) =>
                      handleItemFieldChange(idx, 'quantity_rejected', Number(e.target.value))
                    }
                    className="h-8 text-xs font-mono border-rose-200"
                  />
                </div>
              </div>

              {/* Rejection reason (if rejected > 0) */}
              {item.quantity_rejected > 0 && (
                <div className="pt-2 border-t border-rose-100 bg-rose-50/50 p-2 rounded">
                  <label className="block text-[11px] font-semibold text-rose-800 mb-1">
                    Discrepancy / Rejection Reason <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Packaging crushed in transit, cold chain excursion, leakage..."
                    value={item.rejection_reason}
                    onChange={(e) => handleItemFieldChange(idx, 'rejection_reason', e.target.value)}
                    required
                    className="h-8 text-xs border-rose-300"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Inspection Notes / Verification Remarks
          </label>
          <textarea
            placeholder="e.g. Temperature log checked. Consignment inspected in central receiving bay."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="gap-1.5"
          >
            <PackageCheck className="w-4 h-4" />
            {isSubmitting ? 'Recording GRN...' : 'Confirm Goods Intake'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
