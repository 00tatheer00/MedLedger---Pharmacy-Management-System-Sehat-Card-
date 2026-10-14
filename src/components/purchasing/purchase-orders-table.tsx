'use client';

/**
 * MedLedger — Purchase Orders Directory Table Component
 *
 * Displays filterable, paginated PO records with supplier links, status badges,
 * fulfillment progress, and action buttons.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PaginatedPurchaseOrdersResponse, PurchaseOrderStatus } from '@/modules/purchasing/types';
import { formatPKR } from '@/lib/decimal';
import { ExportCsvButton } from '@/lib/csv-helper';

interface PurchaseOrdersTableProps {
  initialData: PaginatedPurchaseOrdersResponse;
  currentSearch?: string;
  currentStatus?: string;
}

export function PurchaseOrdersTable({
  initialData,
  currentSearch = '',
  currentStatus = 'all',
}: PurchaseOrdersTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const applyFilters = (term: string, status: string, page = 1) => {
    const params = new URLSearchParams();
    if (term.trim()) params.set('search', term.trim());
    if (status !== 'all') params.set('status', status);
    params.set('tab', 'orders');
    params.set('page', String(page));
    router.push(`/purchases?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm, selectedStatus, 1);
  };

  const handlePageChange = (newPage: number) => {
    applyFilters(searchTerm, selectedStatus, newPage);
  };

  const quickChips = [
    { label: 'All Orders', status: 'all' },
    { label: 'Submitted', status: 'submitted' },
    { label: 'Partially Received', status: 'partially_received' },
    { label: 'Fully Received', status: 'fully_received' },
    { label: 'Cancelled', status: 'cancelled' },
  ];

  const exportData = initialData.orders.map((po) => {
    const totalOrdered = po.items.reduce((sum, i) => sum + i.quantity_ordered, 0);
    const totalReceived = po.items.reduce((sum, i) => sum + i.quantity_received, 0);
    const pct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

    return {
      'PO Number': po.po_number,
      Supplier: po.supplier?.name || 'Unknown Supplier',
      'Order Date': po.order_date,
      'Expected Delivery': po.expected_delivery_date || '—',
      'Items Count': po.items.length,
      'Total Ordered': totalOrdered,
      'Total Received': totalReceived,
      'Fulfillment Pct': `${pct}%`,
      'Order Total (PKR)': formatPKR(po.total_amount),
      Status: po.status,
    };
  });

  const renderStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'fully_received':
        return (
          <Badge variant="success" className="gap-1 text-xs">
            <CheckCircle2 className="w-3 h-3" />
            Fully Received
          </Badge>
        );
      case 'partially_received':
        return (
          <Badge variant="warning" className="gap-1 text-xs">
            <AlertTriangle className="w-3 h-3" />
            Partially Received
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="info" className="gap-1 text-xs">
            <Clock className="w-3 h-3" />
            Submitted
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="muted" className="gap-1 text-xs">
            <FileText className="w-3 h-3" />
            Draft
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="danger" className="gap-1 text-xs">
            Cancelled
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="border border-border shadow-card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-teal-500 via-primary to-emerald-500" />
        <CardContent className="p-4 space-y-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
          >
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                <Input
                  placeholder="Search by PO number, supplier, or medicine item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  applyFilters(searchTerm, e.target.value, 1);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Order Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="partially_received">Partially Received</option>
                <option value="fully_received">Fully Received</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <Button type="submit" variant="secondary" className="h-10">
                Apply
              </Button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ExportCsvButton
                data={exportData}
                filename="MedLedger_Purchase_Orders.csv"
                label="Export Orders CSV"
                size="sm"
              />

              <Link
                href="/purchases/new"
                className={buttonVariants({ variant: 'primary', className: 'h-10 gap-2 shrink-0' })}
              >
                <Plus className="w-4 h-4" />
                Create Purchase Order
              </Link>
            </div>
          </form>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider shrink-0 mr-1">
              Quick Filter:
            </span>
            {quickChips.map((chip) => {
              const active = selectedStatus === chip.status;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(chip.status);
                    applyFilters(searchTerm, chip.status, 1);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-teal-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* PO Table */}
      <Card className="border border-border shadow-card overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border bg-slate-50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-text-primary">
              Purchase Orders Registry ({initialData.totalRecords})
            </CardTitle>
          </div>
          <span className="text-xs text-text-muted font-mono">
            Page {initialData.currentPage} of {initialData.totalPages}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {initialData.orders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ShoppingCart className="w-10 h-10 text-text-muted/50 mx-auto" />
              <p className="text-base font-medium text-text-primary">No purchase orders found</p>
              <p className="text-sm text-text-muted">
                {searchTerm
                  ? `No purchase orders matching "${searchTerm}".`
                  : 'No purchase orders have been created yet.'}
              </p>
              <Link
                href="/purchases/new"
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-2' })}
              >
                Create New Order
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[140px]">PO Number</TableHead>
                    <TableHead>Distributor / Supplier</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Delivery Expected</TableHead>
                    <TableHead className="text-center">Fulfillment</TableHead>
                    <TableHead className="text-right">Order Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.orders.map((po) => {
                    const totalOrdered = po.items.reduce((sum, i) => sum + i.quantity_ordered, 0);
                    const totalReceived = po.items.reduce((sum, i) => sum + i.quantity_received, 0);
                    const pct =
                      totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

                    return (
                      <TableRow
                        key={po.id}
                        className="hover:bg-slate-50 transition-colors duration-150"
                      >
                        <TableCell className="font-mono font-semibold text-primary">
                          <Link href={`/purchases/${po.id}`} className="hover:underline">
                            {po.po_number}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-text-primary">
                          {po.supplier ? (
                            <Link
                              href={`/suppliers/${po.supplier.id}`}
                              className="text-text-primary hover:text-primary hover:underline"
                            >
                              {po.supplier.name}
                            </Link>
                          ) : (
                            'Unknown Supplier'
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-text-secondary">
                          {po.order_date}
                        </TableCell>
                        <TableCell className="text-xs text-text-muted font-mono">
                          {po.expected_delivery_date || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-mono font-medium text-text-secondary">
                              {totalReceived} / {totalOrdered} ({pct}%)
                            </span>
                            <div className="w-20 bg-surface-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct >= 100
                                    ? 'bg-emerald-600'
                                    : pct > 0
                                      ? 'bg-amber-500'
                                      : 'bg-transparent'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-text-primary text-sm">
                          {formatPKR(po.total_amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderStatusBadge(po.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/purchases/${po.id}`}
                            className={buttonVariants({
                              variant: 'ghost',
                              size: 'sm',
                              className:
                                'h-8 px-2.5 text-xs text-primary hover:text-primary-dark font-medium gap-1',
                            })}
                          >
                            Details
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {initialData.totalPages > 1 && (
            <div className="py-3 px-4 border-t border-border bg-slate-50 flex items-center justify-between text-xs text-text-muted">
              <span>
                Showing {(initialData.currentPage - 1) * initialData.pageSize + 1}–
                {Math.min(initialData.currentPage * initialData.pageSize, initialData.totalRecords)}{' '}
                of {initialData.totalRecords} purchase orders
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={initialData.currentPage <= 1}
                  onClick={() => handlePageChange(initialData.currentPage - 1)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <div className="px-2 font-medium text-text-primary">
                  {initialData.currentPage} / {initialData.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={initialData.currentPage >= initialData.totalPages}
                  onClick={() => handlePageChange(initialData.currentPage + 1)}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
