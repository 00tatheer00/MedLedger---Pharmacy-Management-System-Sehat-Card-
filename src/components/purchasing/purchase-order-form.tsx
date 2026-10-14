'use client';

/**
 * MedLedger — Purchase Order Builder Component
 *
 * Allows purchasing officers to select distributors, add dynamic catalogue medicine items,
 * specify agreed unit costs, and calculate decimal-safe order totals.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Supplier } from '@/modules/suppliers/types';
import { Medicine } from '@/modules/medicines/types';
import { createPurchaseOrderAction } from '@/modules/purchasing/actions';
import { multiplyMoney, addMoney, formatPKR } from '@/lib/decimal';

interface PurchaseOrderFormProps {
  suppliers: Supplier[];
  medicines: Medicine[];
  preselectedSupplierId?: string;
}

interface FormLineItem {
  id: string;
  medicine_id: string;
  quantity_ordered: number;
  unit_price: number;
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultDeliveryDateString(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function PurchaseOrderForm({
  suppliers,
  medicines,
  preselectedSupplierId = '',
}: PurchaseOrderFormProps) {
  const router = useRouter();

  const [supplierId, setSupplierId] = useState(preselectedSupplierId || suppliers[0]?.id || '');
  const [orderDate, setOrderDate] = useState(getTodayDateString);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(getDefaultDeliveryDateString);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<FormLineItem[]>([
    {
      id: 'item-1',
      medicine_id: medicines[0]?.id || '',
      quantity_ordered: 100,
      unit_price: 25.0,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Line item handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${prev.length + 1}-${Math.floor(Math.random() * 10000)}`,
        medicine_id: medicines[0]?.id || '',
        quantity_ordered: 100,
        unit_price: 20.0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof FormLineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, [field]: value };
      }),
    );
  };

  // Grand total calculation with exact precision
  const grandTotal = items.reduce((sum, item) => {
    const lineTotal = multiplyMoney(
      Number(item.quantity_ordered) || 0,
      Number(item.unit_price) || 0,
    );
    return addMoney(sum, lineTotal);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!supplierId) {
      setServerError('Please select an authorized supplier.');
      return;
    }

    if (items.length === 0) {
      setServerError('Please add at least one medicine line item.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createPurchaseOrderAction({
        supplier_id: supplierId,
        order_date: orderDate,
        expected_delivery_date: expectedDeliveryDate || undefined,
        notes: notes || undefined,
        items: items.map((i) => ({
          medicine_id: i.medicine_id,
          quantity_ordered: Number(i.quantity_ordered),
          unit_price: Number(i.unit_price),
        })),
      });

      if (!res.success) {
        setServerError(res.error || 'Failed to create purchase order.');
        setIsSubmitting(false);
        return;
      }

      if (res.data) {
        router.push(`/purchases/${res.data.id}`);
      } else {
        router.push('/purchases');
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Create Purchase Order (PO)
          </h1>
          <p className="text-sm text-text-muted">
            Issue an official pharmaceutical procurement order to a registered vendor.
          </p>
        </div>
        <Link
          href="/purchases"
          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5' })}
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Link>
      </div>

      {serverError && (
        <Alert variant="critical" title="Validation Error" description={serverError} />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Details Card */}
        <Card className="border border-border shadow-card">
          <CardHeader className="py-4 px-6 border-b border-border bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-semibold text-text-primary">
                Order Specifications
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-text-muted">
              Select distributor and required delivery schedule.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Supplier Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Vendor / Supplier <span className="text-rose-600">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                  className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {!s.is_active ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Date */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Order Date <span className="text-rose-600">*</span>
                </label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                  className="h-10 text-sm font-mono"
                />
              </div>

              {/* Expected Delivery Date */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Expected Delivery Date
                </label>
                <Input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="h-10 text-sm font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Order Notes / Special Instructions
              </label>
              <textarea
                placeholder="e.g. Cold chain verification required. Urgent consignment for surgical ICU."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <Card className="border border-border shadow-card">
          <CardHeader className="py-4 px-6 border-b border-border bg-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-text-primary">
                Medicine Line Items ({items.length})
              </CardTitle>
              <CardDescription className="text-xs text-text-muted">
                Specify quantities and contracted purchase unit costs.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Medicine
            </Button>
          </CardHeader>

          <CardContent className="p-6 space-y-3">
            <div className="space-y-3">
              {items.map((item, index) => {
                const lineTotal = multiplyMoney(
                  Number(item.quantity_ordered) || 0,
                  Number(item.unit_price) || 0,
                );

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border bg-slate-50 grid grid-cols-12 gap-3 items-center"
                  >
                    <div className="col-span-1 text-center font-mono text-xs text-text-muted">
                      #{index + 1}
                    </div>

                    {/* Medicine Dropdown */}
                    <div className="col-span-11 md:col-span-5">
                      <select
                        value={item.medicine_id}
                        onChange={(e) => handleItemChange(item.id, 'medicine_id', e.target.value)}
                        required
                        className="w-full h-9 px-2 text-xs rounded border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                      >
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.strength}) — {m.dosage_form}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-4 md:col-span-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity_ordered}
                        onChange={(e) =>
                          handleItemChange(item.id, 'quantity_ordered', Number(e.target.value))
                        }
                        required
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    {/* Unit Cost */}
                    <div className="col-span-4 md:col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemChange(item.id, 'unit_price', Number(e.target.value))
                        }
                        required
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="col-span-3 md:col-span-2 text-right font-mono text-xs font-semibold text-text-primary">
                      {formatPKR(lineTotal)}
                    </div>

                    {/* Remove button */}
                    <div className="col-span-1 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={items.length <= 1}
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Footer */}
            <div className="pt-4 border-t border-border flex items-center justify-between text-sm">
              <span className="font-medium text-text-secondary">Estimated Order Total:</span>
              <span className="text-xl font-bold font-mono text-primary">
                {formatPKR(grandTotal)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/purchases"
            className={buttonVariants({ variant: 'outline', className: 'h-10' })}
          >
            Cancel
          </Link>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="h-10 gap-2">
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Creating Purchase Order...' : 'Submit Purchase Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}
