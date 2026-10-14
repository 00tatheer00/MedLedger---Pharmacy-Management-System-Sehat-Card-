'use client';

/**
 * MedLedger — Supplier Invoices & Accounts Payable Table Component
 *
 * Provides a financial ledger view of supplier claims, payment tracking,
 * outstanding payables balances, and disbursement allocation actions.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Filter,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PaginatedSupplierInvoicesResponse,
  SupplierInvoiceStatus,
} from '@/modules/purchasing/types';
import { Supplier } from '@/modules/suppliers/types';
import { formatPKR } from '@/lib/decimal';
import { RecordPaymentDialog } from './record-payment-dialog';

interface SupplierInvoicesTableProps {
  initialData: PaginatedSupplierInvoicesResponse;
  suppliers: Supplier[];
  currentSearch?: string;
  currentStatus?: string;
  currentSupplierId?: string;
}

export function SupplierInvoicesTable({
  initialData,
  suppliers,
  currentSearch = '',
  currentStatus = 'all',
  currentSupplierId = '',
}: SupplierInvoicesTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [selectedSupplier, setSelectedSupplier] = useState(currentSupplierId);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [preselectedInvoiceSupplier, setPreselectedInvoiceSupplier] = useState<string>('');

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);
    if (selectedSupplier) params.set('supplierId', selectedSupplier);
    params.set('tab', 'invoices');
    params.set('page', '1');
    router.push(`/purchases?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);
    if (selectedSupplier) params.set('supplierId', selectedSupplier);
    params.set('tab', 'invoices');
    params.set('page', String(newPage));
    router.push(`/purchases?${params.toString()}`);
  };

  const handleOpenPaymentForSupplier = (supplierId: string) => {
    setPreselectedInvoiceSupplier(supplierId);
    setIsPaymentDialogOpen(true);
  };

  // Status badge helper
  const getStatusBadge = (status: SupplierInvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            Partially Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Pending Due
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            Disputed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Card */}
      <Card className="border border-border shadow-card">
        <CardContent className="p-4">
          <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
              <Input
                placeholder="Search by invoice number, PO, GRN, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <select
                aria-label="Filter by invoice status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 px-3 text-sm rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-teal-primary"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Fully Paid</option>
                <option value="disputed">Disputed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                aria-label="Filter by supplier"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="h-10 px-3 text-sm rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-teal-primary max-w-[200px]"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <Button type="submit" variant="secondary" className="h-10">
                <Filter className="w-4 h-4 mr-1.5" />
                Filter
              </Button>

              <Button
                type="button"
                className="h-10 bg-teal-primary hover:bg-teal-primary/90 text-white whitespace-nowrap"
                onClick={() => {
                  setPreselectedInvoiceSupplier('');
                  setIsPaymentDialogOpen(true);
                }}
              >
                <DollarSign className="w-4 h-4 mr-1.5" />
                Record Payment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Invoices Ledger Table */}
      <Card className="border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">
                  Invoice #
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">
                  Supplier
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">
                  Date / Due
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">
                  References
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                  Total (PKR)
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                  Paid (PKR)
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                  Outstanding (PKR)
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-text-muted">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30 text-navy-deep" />
                    <p className="font-medium text-foreground">No supplier invoices found</p>
                    <p className="text-sm mt-1">
                      Invoices are automatically generated when receiving goods consignments or
                      created directly.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                initialData.invoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    <TableCell className="font-mono font-medium text-navy-deep">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/suppliers/${inv.supplier_id}`}
                        className="font-medium text-teal-dark hover:underline"
                      >
                        {inv.supplier_name || 'Supplier'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-text-muted">
                      <div>{inv.invoice_date}</div>
                      <div className="text-xs text-text-muted">Due: {inv.due_date}</div>
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {inv.po_number && (
                        <div>
                          PO:{' '}
                          <Link
                            href={`/purchases/${inv.purchase_order_id}`}
                            className="font-mono text-teal-dark hover:underline"
                          >
                            {inv.po_number}
                          </Link>
                        </div>
                      )}
                      {inv.grn_number && (
                        <div className="font-mono text-text-muted">GRN: {inv.grn_number}</div>
                      )}
                      {!inv.po_number && !inv.grn_number && 'Direct'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-navy-deep">
                      {formatPKR(inv.total_amount)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-700">
                      {formatPKR(inv.paid_amount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <span
                        className={inv.outstanding_balance > 0 ? 'text-rose-600' : 'text-slate-500'}
                      >
                        {formatPKR(inv.outstanding_balance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-right">
                      {inv.outstanding_balance > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-teal-primary hover:bg-teal-primary/10"
                          onClick={() => handleOpenPaymentForSupplier(inv.supplier_id)}
                        >
                          Disburse
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">Settled</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination footer */}
        {initialData.totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50/50 border-t border-border flex items-center justify-between text-sm">
            <span className="text-text-muted">
              Showing {(initialData.currentPage - 1) * initialData.pageSize + 1} to{' '}
              {Math.min(initialData.currentPage * initialData.pageSize, initialData.totalRecords)}{' '}
              of {initialData.totalRecords} invoices
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={initialData.currentPage <= 1}
                onClick={() => handlePageChange(initialData.currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={initialData.currentPage >= initialData.totalPages}
                onClick={() => handlePageChange(initialData.currentPage + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Payment Allocation Dialog Modal */}
      <RecordPaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        suppliers={suppliers}
        invoices={initialData.invoices}
        preselectedSupplierId={preselectedInvoiceSupplier}
      />
    </div>
  );
}
