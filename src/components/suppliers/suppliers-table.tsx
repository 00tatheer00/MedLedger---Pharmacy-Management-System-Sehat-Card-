'use client';

/**
 * MedLedger — Suppliers Directory Table Component
 * Upgraded with Export CSV, Quick Filters, and in-table Edit & Delete actions.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Search,
  Plus,
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Filter,
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
import { Dialog } from '@/components/ui/dialog';
import { PaginatedSuppliersResponse, SupplierWithStats } from '@/modules/suppliers/types';
import { deleteSupplierAction } from '@/modules/suppliers/actions';
import { formatPKR } from '@/lib/decimal';
import { ExportCsvButton, CsvColumn } from '@/lib/csv-helper';
import { toast } from '@/components/feedback/toast';

interface SuppliersTableProps {
  initialData: PaginatedSuppliersResponse;
  currentSearch?: string;
  currentStatus?: string;
}

const SUPPLIER_CSV_COLUMNS: CsvColumn<SupplierWithStats>[] = [
  { header: 'Supplier Name', accessor: (s) => s.name },
  { header: 'Contact Person', accessor: (s) => s.contact_person || 'N/A' },
  { header: 'Phone', accessor: (s) => s.phone || 'N/A' },
  { header: 'Email', accessor: (s) => s.email || 'N/A' },
  { header: 'Address', accessor: (s) => s.address || 'N/A' },
  { header: 'NTN Number', accessor: (s) => s.ntn_number || 'N/A' },
  { header: 'Total Orders', accessor: (s) => s.total_orders_count },
  { header: 'Outstanding Balance (PKR)', accessor: (s) => s.outstanding_balance_pkr },
  { header: 'Status', accessor: (s) => (s.is_active ? 'Active' : 'Inactive') },
];

export function SuppliersTable({
  initialData,
  currentSearch = '',
  currentStatus = 'all',
}: SuppliersTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const applyFilters = (
    search: string = searchTerm,
    status: string = selectedStatus,
    page: number = 1,
  ) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status !== 'all') params.set('status', status);
    params.set('page', String(page));
    router.push(`/suppliers?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm, selectedStatus, 1);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;
    setIsDeleting(true);
    try {
      const res = await deleteSupplierAction(deletingSupplier.id);
      if (res.success) {
        toast.success(`Supplier "${deletingSupplier.name}" removed.`);
        setDeletingSupplier(null);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete supplier');
      }
    } catch {
      toast.error('An unexpected error occurred during supplier deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Card */}
      <Card className="border border-slate-200/90 shadow-sm overflow-hidden bg-white">
        <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600" />
        <CardContent className="p-4 space-y-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between"
          >
            <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search suppliers by name, contact, NTN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 w-full bg-slate-50/70 border-slate-200 focus:bg-white text-sm"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  applyFilters(searchTerm, e.target.value, 1);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <Button type="submit" variant="secondary" className="h-10 px-4 cursor-pointer">
                Search
              </Button>
            </div>

            {/* Actions: CSV Export & New Supplier */}
            <div className="flex items-center gap-2 shrink-0">
              <ExportCsvButton
                filename="medledger-suppliers-directory"
                data={initialData.suppliers}
                columns={SUPPLIER_CSV_COLUMNS}
                label="Export CSV"
              />

              <Link
                href="/suppliers/new"
                className={buttonVariants({
                  variant: 'primary',
                  className:
                    'h-10 gap-2 shrink-0 shadow-sm bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all',
                })}
              >
                <Plus className="w-4 h-4" />
                Add Supplier
              </Link>
            </div>
          </form>

          {/* Quick Filter Status Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1 uppercase tracking-wider">
              <Filter className="w-3 h-3" /> Quick:
            </span>
            {[
              { label: 'All', value: 'all' },
              { label: 'Active Suppliers', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ].map((chip) => {
              const isActive = selectedStatus === chip.value;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(chip.value);
                    applyFilters(searchTerm, chip.value, 1);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="border border-slate-200/90 shadow-sm overflow-hidden bg-white">
        <CardHeader className="py-3 px-4 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60">
              <Building2 className="w-4 h-4 text-teal-600" />
            </div>
            <CardTitle className="text-sm font-semibold text-text-primary">
              Distributor Directory ({initialData.totalRecords})
            </CardTitle>
          </div>
          <span className="text-xs text-text-muted font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
            Page {initialData.currentPage} of {initialData.totalPages || 1}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {initialData.suppliers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">No suppliers found</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
                {searchTerm
                  ? `No distributors matching "${searchTerm}". Try another search term.`
                  : 'Get started by registering your first pharmaceutical vendor.'}
              </p>
              <Link
                href="/suppliers/new"
                className={buttonVariants({ variant: 'primary', size: 'sm', className: 'gap-2' })}
              >
                <Plus className="w-4 h-4" />
                Add Supplier
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Company / Distributor
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Contact Person
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      NTN Number
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">
                      Orders
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                      Payable Balance
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">
                      Status
                    </TableHead>
                    <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.suppliers.map((sup) => (
                    <TableRow
                      key={sup.id}
                      className="hover:bg-teal-50/30 transition-colors duration-150 group"
                    >
                      <TableCell>
                        <Link
                          href={`/suppliers/${sup.id}`}
                          className="font-semibold text-text-primary group-hover:text-teal-700 transition-colors block text-sm"
                        >
                          {sup.name}
                        </Link>
                        {sup.address && (
                          <span className="text-xs text-text-muted line-clamp-1 mt-0.5">
                            {sup.address}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-text-secondary space-y-0.5">
                        <div className="font-semibold text-text-primary">
                          {sup.contact_person || '—'}
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                          {sup.phone && (
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-text-muted" />
                              {sup.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-mono text-text-secondary">
                        {sup.ntn_number || (
                          <span className="text-text-muted italic">Unrecorded</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs text-text-primary font-medium">
                        {sup.total_orders_count}
                      </TableCell>

                      <TableCell className="text-right font-semibold text-sm text-text-primary">
                        <span
                          className={
                            sup.outstanding_balance_pkr > 0
                              ? 'text-amber-700 font-bold'
                              : 'text-emerald-700'
                          }
                        >
                          {formatPKR(sup.outstanding_balance_pkr)}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        {sup.is_active ? (
                          <Badge variant="success" className="gap-1 text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="muted" className="gap-1 text-xs">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Details */}
                          <Link
                            href={`/suppliers/${sup.id}`}
                            className={buttonVariants({
                              variant: 'ghost',
                              size: 'sm',
                              className:
                                'h-8 px-2 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 font-medium',
                            })}
                            title="View Distributor Details"
                          >
                            Details
                          </Link>

                          {/* Edit Link */}
                          <Link
                            href={`/suppliers/${sup.id}/edit`}
                            className={buttonVariants({
                              variant: 'ghost',
                              size: 'sm',
                              className:
                                'h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50',
                            })}
                            title="Edit Supplier"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingSupplier(sup)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {initialData.totalPages > 1 && (
            <div className="py-3 px-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-text-muted">
              <span>
                Showing {(initialData.currentPage - 1) * initialData.pageSize + 1}–
                {Math.min(initialData.currentPage * initialData.pageSize, initialData.totalRecords)}{' '}
                of {initialData.totalRecords} suppliers
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs bg-white"
                  disabled={initialData.currentPage <= 1}
                  onClick={() =>
                    applyFilters(searchTerm, selectedStatus, initialData.currentPage - 1)
                  }
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>
                <div className="px-2.5 font-semibold text-text-primary">
                  {initialData.currentPage} / {initialData.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs bg-white"
                  disabled={initialData.currentPage >= initialData.totalPages}
                  onClick={() =>
                    applyFilters(searchTerm, selectedStatus, initialData.currentPage + 1)
                  }
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Supplier Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingSupplier)}
        onClose={() => setDeletingSupplier(null)}
        title="Delete Supplier from Directory"
        description="Are you sure you want to remove this pharmaceutical distributor? Outstanding balances and past purchase order records will be preserved."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingSupplier(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        }
      >
        {deletingSupplier && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1 text-xs">
            <div className="font-semibold text-text-primary text-sm">{deletingSupplier.name}</div>
            <div className="text-text-muted">
              Contact: {deletingSupplier.contact_person || 'Unspecified'} • Phone:{' '}
              {deletingSupplier.phone || 'N/A'}
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              NTN: {deletingSupplier.ntn_number || 'N/A'} • Orders:{' '}
              {deletingSupplier.total_orders_count}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
