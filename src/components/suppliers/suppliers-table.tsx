'use client';

/**
 * MedLedger — Suppliers Directory Table Component
 *
 * Displays filterable, paginated distributor records with active status badges,
 * contact details, and outstanding balances.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Search,
  Plus,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  XCircle,
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
import { PaginatedSuppliersResponse } from '@/modules/suppliers/types';
import { formatPKR } from '@/lib/decimal';

interface SuppliersTableProps {
  initialData: PaginatedSuppliersResponse;
  currentSearch?: string;
  currentStatus?: string;
}

export function SuppliersTable({
  initialData,
  currentSearch = '',
  currentStatus = 'all',
}: SuppliersTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    params.set('page', '1');
    router.push(`/suppliers?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    params.set('page', String(newPage));
    router.push(`/suppliers?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Search, Filters & Action Button */}
      <Card className="border border-border shadow-card">
        <CardContent className="p-4">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
          >
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                <Input
                  placeholder="Search by supplier name, contact person, phone, NTN..."
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
                  params.set('page', '1');
                  router.push(`/suppliers?${params.toString()}`);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Distributors</option>
                <option value="inactive">Deactivated</option>
              </select>

              <Button type="submit" variant="secondary" className="h-10">
                Apply
              </Button>
            </div>

            <Link
              href="/suppliers/new"
              className={buttonVariants({ variant: 'primary', className: 'h-10 gap-2 shrink-0' })}
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </Link>
          </form>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card className="border border-border shadow-card overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border bg-slate-50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-text-primary">
              Registered Distributors & Vendors ({initialData.totalRecords})
            </CardTitle>
          </div>
          <span className="text-xs text-text-muted font-mono">
            Page {initialData.currentPage} of {initialData.totalPages}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {initialData.suppliers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Building2 className="w-10 h-10 text-text-muted/50 mx-auto" />
              <p className="text-base font-medium text-text-primary">No suppliers found</p>
              <p className="text-sm text-text-muted">
                {searchTerm
                  ? `No distributors matching query "${searchTerm}".`
                  : 'No suppliers registered in the directory yet.'}
              </p>
              <Link
                href="/suppliers/new"
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-2' })}
              >
                Register New Supplier
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[280px]">Distributor / Agency</TableHead>
                    <TableHead>Primary Contact</TableHead>
                    <TableHead>NTN / Tax ID</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-right">Outstanding Balance</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.suppliers.map((sup) => (
                    <TableRow
                      key={sup.id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <TableCell className="font-medium text-text-primary">
                        <Link
                          href={`/suppliers/${sup.id}`}
                          className="font-semibold text-primary hover:underline block"
                        >
                          {sup.name}
                        </Link>
                        {sup.address && (
                          <span className="text-xs text-text-muted line-clamp-1">
                            {sup.address}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary space-y-0.5">
                        <div className="font-medium text-text-primary">
                          {sup.contact_person || '—'}
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                          {sup.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3 text-text-muted" />
                              {sup.phone}
                            </span>
                          )}
                          {sup.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3 text-text-muted" />
                              {sup.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-text-secondary">
                        {sup.ntn_number || <span className="text-text-muted">Unrecorded</span>}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-text-primary">
                        {sup.total_orders_count}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm text-text-primary">
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
                        <Link
                          href={`/suppliers/${sup.id}`}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {initialData.totalPages > 1 && (
            <div className="py-3 px-4 border-t border-border bg-slate-50 flex items-center justify-between text-xs text-text-muted">
              <span>
                Showing {(initialData.currentPage - 1) * initialData.pageSize + 1}–
                {Math.min(initialData.currentPage * initialData.pageSize, initialData.totalRecords)}{' '}
                of {initialData.totalRecords} suppliers
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
