'use client';

/**
 * MedLedger — Supplier Registration / Edit Form Component
 *
 * Captures pharmaceutical distributor demographics and contact specifications
 * with Zod validation. Tax identifiers (NTN) and regulatory numbers are optional.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Save, ArrowLeft } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { createSupplierAction, updateSupplierAction } from '@/modules/suppliers/actions';
import { SupplierWithStats } from '@/modules/suppliers/types';

interface SupplierFormProps {
  initialSupplier?: SupplierWithStats;
  isEditing?: boolean;
}

export function SupplierForm({ initialSupplier, isEditing = false }: SupplierFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: initialSupplier?.name || '',
    contact_person: initialSupplier?.contact_person || '',
    phone: initialSupplier?.phone || '',
    email: initialSupplier?.email || '',
    address: initialSupplier?.address || '',
    ntn_number: initialSupplier?.ntn_number || '',
    is_active: initialSupplier?.is_active ?? true,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);
    setFieldErrors({});

    try {
      if (isEditing && initialSupplier) {
        const res = await updateSupplierAction(initialSupplier.id, formData);
        if (!res.success) {
          setServerError(res.error || 'Failed to update supplier.');
          if (res.fieldErrors) setFieldErrors(res.fieldErrors);
          setIsSubmitting(false);
          return;
        }
        router.push(`/suppliers/${initialSupplier.id}`);
      } else {
        const res = await createSupplierAction(formData);
        if (!res.success) {
          setServerError(res.error || 'Failed to create supplier.');
          if (res.fieldErrors) setFieldErrors(res.fieldErrors);
          setIsSubmitting(false);
          return;
        }
        if (res.data) {
          router.push(`/suppliers/${res.data.id}`);
        } else {
          router.push('/suppliers');
        }
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Back link */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            {isEditing ? 'Edit Supplier Details' : 'Register New Distributor / Vendor'}
          </h1>
          <p className="text-sm text-text-muted">
            {isEditing
              ? `Updating distributor profile for ${initialSupplier?.name}.`
              : 'Add an authorized pharmaceutical distributor to the MedLedger procurement registry.'}
          </p>
        </div>
        <Link
          href={isEditing && initialSupplier ? `/suppliers/${initialSupplier.id}` : '/suppliers'}
          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5' })}
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Link>
      </div>

      {serverError && (
        <Alert variant="critical" title="Operation Failed" description={serverError} />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="py-4 px-6 border-b border-border/60 bg-surface-muted/30">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-semibold text-text-primary">
                Distributor Demographics
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-text-muted">
              Enter official pharmaceutical vendor information. Tax numbers are optional.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* Supplier Name */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Distributor / Business Name <span className="text-rose-600">*</span>
              </label>
              <Input
                placeholder="e.g. Kohat Pharma Distributors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-10 text-sm"
              />
              {fieldErrors.name && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.name[0]}</p>
              )}
            </div>

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Primary Contact Person (Optional)
                </label>
                <Input
                  placeholder="e.g. Mohammad Irfan"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="h-10 text-sm"
                />
                {fieldErrors.contact_person && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.contact_person[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Phone Number (Optional)
                </label>
                <Input
                  placeholder="e.g. 0922-512345 or 0300-1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-10 text-sm"
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.phone[0]}</p>
                )}
              </div>
            </div>

            {/* Email & NTN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Email Address (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="e.g. orders@distributor.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 text-sm"
                />
                {fieldErrors.email && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.email[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  National Tax Number / NTN (Optional)
                </label>
                <Input
                  placeholder="e.g. 2837491-4"
                  value={formData.ntn_number}
                  onChange={(e) => setFormData({ ...formData, ntn_number: e.target.value })}
                  className="h-10 text-sm font-mono"
                />
                {fieldErrors.ntn_number && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.ntn_number[0]}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Office / Warehouse Address (Optional)
              </label>
              <textarea
                placeholder="e.g. Plot 14, Bannu Road Industrial Area, Kohat, Khyber Pakhtunkhwa"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
              {fieldErrors.address && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.address[0]}</p>
              )}
            </div>

            {/* Active Status (if editing) */}
            {isEditing && (
              <div className="pt-2 border-t border-border/60 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-text-primary">
                  Active Distributor (Available for new Purchase Orders)
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit button bar */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={isEditing && initialSupplier ? `/suppliers/${initialSupplier.id}` : '/suppliers'}
            className={buttonVariants({ variant: 'outline', className: 'h-10' })}
          >
            Cancel
          </Link>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="h-10 gap-2">
            <Save className="w-4 h-4" />
            {isSubmitting
              ? isEditing
                ? 'Updating...'
                : 'Saving...'
              : isEditing
                ? 'Save Changes'
                : 'Register Supplier'}
          </Button>
        </div>
      </form>
    </div>
  );
}
