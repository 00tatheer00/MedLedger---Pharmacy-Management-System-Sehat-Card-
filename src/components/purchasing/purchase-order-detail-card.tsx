'use client';

/**
 * MedLedger — Purchase Order Detail Profile Component
 *
 * Displays line item fulfillment progress, related Goods Receipt Notes,
 * supplier contact cards, and triggers the goods receiving modal.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { PackageCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
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
import { PurchaseOrder, GoodsReceipt, SupplierInvoice } from '@/modules/purchasing/types';
import { GoodsReceivingDialog } from './goods-receiving-dialog';
import { formatPKR } from '@/lib/decimal';

interface PurchaseOrderDetailCardProps {
  order: PurchaseOrder;
  receipts: GoodsReceipt[];
  invoices: SupplierInvoice[];
}

export function PurchaseOrderDetailCard({
  order,
  receipts,
  invoices,
}: PurchaseOrderDetailCardProps) {
  const [receivingModalOpen, setReceivingModalOpen] = useState(false);

  const totalOrdered = order.items.reduce((sum, i) => sum + i.quantity_ordered, 0);
  const totalReceived = order.items.reduce((sum, i) => sum + i.quantity_received, 0);
  const fulfillmentPct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
  const canReceive = order.status !== 'fully_received' && order.status !== 'cancelled';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/purchases"
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-8 px-2' })}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold font-mono text-text-primary tracking-tight">
              {order.po_number}
            </h1>
            <Badge
              variant={
                order.status === 'fully_received'
                  ? 'success'
                  : order.status === 'partially_received'
                    ? 'warning'
                    : order.status === 'submitted'
                      ? 'info'
                      : 'muted'
              }
              className="capitalize text-xs"
            >
              {order.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Order Date: <span className="font-mono text-text-secondary">{order.order_date}</span> •
            Created by {order.created_by_name || 'Staff'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canReceive && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setReceivingModalOpen(true)}
              className="gap-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              Receive Consignment
            </Button>
          )}
        </div>
      </div>

      {/* KPI & Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-white shadow-2xs">
          <span className="text-xs text-text-muted font-medium block mb-1">
            Contracted Order Total
          </span>
          <span className="text-xl font-bold font-mono text-text-primary">
            {formatPKR(order.total_amount)}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-white shadow-2xs">
          <span className="text-xs text-text-muted font-medium block mb-1">Fulfillment Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-text-primary">{fulfillmentPct}%</span>
            <span className="text-xs text-text-muted">
              ({totalReceived} / {totalOrdered} units)
            </span>
          </div>
          <div className="w-full bg-surface-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                fulfillmentPct >= 100
                  ? 'bg-emerald-600'
                  : fulfillmentPct > 0
                    ? 'bg-amber-500'
                    : 'bg-transparent'
              }`}
              style={{ width: `${Math.min(100, fulfillmentPct)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-white shadow-2xs">
          <span className="text-xs text-text-muted font-medium block mb-1">
            Distributor / Vendor
          </span>
          {order.supplier ? (
            <Link
              href={`/suppliers/${order.supplier.id}`}
              className="text-sm font-semibold text-primary hover:underline line-clamp-1 block"
            >
              {order.supplier.name}
            </Link>
          ) : (
            <span className="text-sm font-medium text-text-primary">Unlinked Vendor</span>
          )}
          <span className="text-xs text-text-muted block mt-0.5">
            Phone: {order.supplier?.phone || '—'}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-white shadow-2xs">
          <span className="text-xs text-text-muted font-medium block mb-1">Expected Delivery</span>
          <span className="text-sm font-mono font-medium text-text-primary">
            {order.expected_delivery_date || 'No scheduled date'}
          </span>
          <span className="text-xs text-text-muted block mt-0.5">
            Status: {order.status === 'fully_received' ? 'Completed' : 'Pending Receipt'}
          </span>
        </div>
      </div>

      {order.notes && (
        <Card className="border border-border/80 bg-surface-muted/20 shadow-2xs">
          <CardContent className="p-3 text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Order Instructions: </span>
            {order.notes}
          </CardContent>
        </Card>
      )}

      {/* Line Items Table */}
      <Card className="border border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface-muted/30">
          <CardTitle className="text-sm font-semibold text-text-primary">
            Contracted Line Items ({order.items.length})
          </CardTitle>
          <CardDescription className="text-xs text-text-muted">
            Tracking ordered quantities against physically received units.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted/20">
                <TableHead>Medicine Item</TableHead>
                <TableHead>Specs / Form</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-center">Ordered</TableHead>
                <TableHead className="text-center">Received</TableHead>
                <TableHead className="text-center">Outstanding</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => {
                const remaining = item.quantity_ordered - item.quantity_received;
                const isComplete = item.quantity_received >= item.quantity_ordered;

                return (
                  <TableRow key={item.id} className="hover:bg-surface-muted/30">
                    <TableCell className="font-medium text-text-primary">
                      <Link
                        href={`/medicines/${item.medicine_id}`}
                        className="text-primary hover:underline font-semibold block"
                      >
                        {item.medicine_name}
                      </Link>
                      <span className="text-xs text-text-muted">{item.generic_name}</span>
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">
                      {item.strength} • <span className="capitalize">{item.dosage_form}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-text-secondary">
                      {formatPKR(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-center font-mono font-medium text-xs">
                      {item.quantity_ordered}
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-xs text-emerald-700">
                      {item.quantity_received}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {isComplete ? (
                        <span className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Fulfilled
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold">{remaining}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-xs text-text-primary">
                      {formatPKR(item.total_price)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Related Goods Receipts (GRN) */}
      <Card className="border border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface-muted/30">
          <CardTitle className="text-sm font-semibold text-text-primary">
            Goods Receipt Notes Recorded Against this Order ({receipts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {receipts.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-muted">
              Zero goods receipts recorded yet. Use the &quot;Receive Consignment&quot; button above
              once stock arrives.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted/20">
                  <TableHead>GRN Number</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Challan / Ref</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead className="text-center">Items Received</TableHead>
                  <TableHead className="text-right">Accepted Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((grn) => {
                  const grnTotalCost = grn.items.reduce((sum, i) => sum + i.total_cost, 0);
                  const totalAccepted = grn.items.reduce((sum, i) => sum + i.quantity_accepted, 0);

                  return (
                    <TableRow key={grn.id}>
                      <TableCell className="font-mono font-semibold text-primary">
                        {grn.grn_number}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {grn.received_date}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-text-muted">
                        {grn.delivery_challan_number || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {grn.received_by_name || 'Staff'}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {totalAccepted} units across {grn.items.length} lots
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-xs text-text-primary">
                        {formatPKR(grnTotalCost)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Related Supplier Invoices */}
      {invoices.length > 0 && (
        <Card className="border border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface-muted/30">
            <CardTitle className="text-sm font-semibold text-text-primary">
              Supplier Invoices & Payables Linked to this Order ({invoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted/20">
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date / Due</TableHead>
                  <TableHead className="text-right">Total (PKR)</TableHead>
                  <TableHead className="text-right">Paid (PKR)</TableHead>
                  <TableHead className="text-right">Outstanding (PKR)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono font-semibold text-primary">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">
                      {inv.invoice_date} (Due: {inv.due_date})
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatPKR(inv.total_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-700">
                      {formatPKR(inv.paid_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-xs text-rose-600">
                      {formatPKR(inv.outstanding_balance)}
                    </TableCell>
                    <TableCell className="text-center text-xs capitalize">
                      {inv.status.replace('_', ' ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Receiving Modal Dialog */}
      {canReceive && (
        <GoodsReceivingDialog
          order={order}
          open={receivingModalOpen}
          onOpenChange={setReceivingModalOpen}
        />
      )}
    </div>
  );
}
