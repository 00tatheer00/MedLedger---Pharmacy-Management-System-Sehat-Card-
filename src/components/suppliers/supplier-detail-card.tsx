'use client';

/**
 * MedLedger — Supplier Detail Profile Component
 *
 * Displays distributor specifications, outstanding payable balance, order history,
 * and quick actions.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Plus,
  Edit,
  Power,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SupplierWithStats } from '@/modules/suppliers/types';
import { PurchaseOrder } from '@/modules/purchasing/types';
import { toggleSupplierStatusAction } from '@/modules/suppliers/actions';
import { formatPKR } from '@/lib/decimal';

interface SupplierDetailCardProps {
  supplier: SupplierWithStats;
  orders: PurchaseOrder[];
}

export function SupplierDetailCard({ supplier, orders }: SupplierDetailCardProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleStatus = async () => {
    if (
      !confirm(
        `Are you sure you want to ${supplier.is_active ? 'deactivate' : 'activate'} ${supplier.name}?`,
      )
    ) {
      return;
    }
    setIsToggling(true);
    await toggleSupplierStatusAction(supplier.id);
    setIsToggling(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="border border-border shadow-card">
        <CardHeader className="py-4 px-6 border-b border-border bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {supplier.name}
              </h1>
              {supplier.is_active ? (
                <Badge variant="success" className="gap-1 text-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="muted" className="gap-1 text-xs">
                  <XCircle className="w-3 h-3" />
                  Deactivated
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-text-muted">
              Supplier ID: <span className="font-mono text-text-secondary">{supplier.id}</span> •
              Registered {new Date(supplier.created_at).toLocaleDateString('en-GB')}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/purchases/new?supplier_id=${supplier.id}`}
              className={buttonVariants({ variant: 'primary', size: 'sm', className: 'gap-1.5' })}
            >
              <Plus className="w-3.5 h-3.5" />
              New Order
            </Link>
            <Link
              href={`/suppliers/${supplier.id}/edit`}
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5' })}
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </Link>
            <Button
              variant="destructive"
              size="sm"
              disabled={isToggling}
              onClick={handleToggleStatus}
              className="gap-1.5"
            >
              <Power className="w-3.5 h-3.5" />
              {supplier.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* 4 Financial & Operational KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-border bg-slate-50 hover:border-slate-300 transition-colors duration-150">
              <span className="text-xs text-text-muted font-medium block mb-1">
                Total Orders Placed
              </span>
              <span className="text-2xl font-bold font-mono text-text-primary">
                {supplier.total_orders_count}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-slate-50 hover:border-slate-300 transition-colors duration-150">
              <span className="text-xs text-text-muted font-medium block mb-1">
                Total Invoiced Value
              </span>
              <span className="text-lg font-bold font-mono text-text-primary">
                {formatPKR(supplier.total_invoiced_pkr)}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-slate-50 hover:border-slate-300 transition-colors duration-150">
              <span className="text-xs text-text-muted font-medium block mb-1">
                Total Payments Settled
              </span>
              <span className="text-lg font-bold font-mono text-emerald-700">
                {formatPKR(supplier.total_paid_pkr)}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-slate-50 hover:border-slate-300 transition-colors duration-150">
              <span className="text-xs text-text-muted font-medium block mb-1">
                Outstanding Balance
              </span>
              <span
                className={`text-lg font-bold font-mono ${
                  supplier.outstanding_balance_pkr > 0 ? 'text-amber-700' : 'text-text-primary'
                }`}
              >
                {formatPKR(supplier.outstanding_balance_pkr)}
              </span>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Contact & Communication
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">Primary Representative:</dt>
                  <dd className="font-medium text-text-primary">
                    {supplier.contact_person || '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Phone:
                  </dt>
                  <dd className="font-mono text-text-primary">{supplier.phone || '—'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email:
                  </dt>
                  <dd className="text-text-primary">{supplier.email || '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Tax & Location Specs
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> NTN / Tax ID:
                  </dt>
                  <dd className="font-mono font-medium text-text-primary">
                    {supplier.ntn_number || 'Unrecorded'}
                  </dd>
                </div>
                <div className="flex items-start justify-between">
                  <dt className="text-text-muted flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> Address:
                  </dt>
                  <dd className="text-text-primary text-right max-w-[260px]">
                    {supplier.address || '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card className="border border-border shadow-card overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border bg-slate-50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-text-primary">
              Purchase Orders Placed with {supplier.name} ({orders.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-muted">
              No purchase orders recorded for this supplier yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>PO Number</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Items Count</TableHead>
                  <TableHead className="text-right">Order Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((po) => (
                  <TableRow
                    key={po.id}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    <TableCell className="font-mono font-semibold text-primary">
                      <Link href={`/purchases/${po.id}`} className="hover:underline">
                        {po.po_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">{po.order_date}</TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {po.items.length} items
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-text-primary">
                      {formatPKR(po.total_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          po.status === 'fully_received'
                            ? 'success'
                            : po.status === 'partially_received'
                              ? 'warning'
                              : po.status === 'submitted'
                                ? 'info'
                                : 'muted'
                        }
                        className="text-xs capitalize"
                      >
                        {po.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/purchases/${po.id}`}
                        className={buttonVariants({
                          variant: 'ghost',
                          size: 'sm',
                          className: 'h-8 px-2 text-xs text-primary font-medium',
                        })}
                      >
                        View Order
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
