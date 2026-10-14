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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    params.set('tab', 'orders');
    params.set('page', '1');
    router.push(`/purchases?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    params.set('tab', 'orders');
    params.set('page', String(newPage));
    router.push(`/purchases?${params.toString()}`);
  };

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
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-4">
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
                  const params = new URLSearchParams();
                  if (searchTerm.trim()) params.set('search', searchTerm.trim());
                  if (e.target.value !== 'all') params.set('status', e.target.value);
                  params.set('tab', 'orders');
                  params.set('page', '1');
                  router.push(`/purchases?${params.toString()}`);
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

            <Link
              href="/purchases/new"
              className={buttonVariants({ variant: 'primary', className: 'h-10 gap-2 shrink-0' })}
            >
              <Plus className="w-4 h-4" />
              Create Purchase Order
            </Link>
          </form>
        </CardContent>
      </Card>

      {/* PO Table */}
      <Card className="border border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface-muted/30 flex flex-row items-center justify-between">
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
                  <TableRow className="bg-surface-muted/20">
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
                      <TableRow key={po.id} className="hover:bg-surface-muted/30 transition-colors">
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
            <div className="py-3 px-4 border-t border-border/60 bg-surface-muted/10 flex items-center justify-between text-xs text-text-muted">
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
