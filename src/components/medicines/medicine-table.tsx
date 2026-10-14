'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pill,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MedicineWithStockSummary, PaginatedMedicinesResult } from '@/modules/medicines/types';

interface MedicineTableProps {
  initialData: PaginatedMedicinesResult;
  currentSearch?: string;
  currentCategory?: string;
  currentStockStatus?: string;
}

export function MedicineTable({
  initialData,
  currentSearch = '',
  currentCategory = '',
  currentStockStatus = 'all',
}: MedicineTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [selectedStockStatus, setSelectedStockStatus] = useState(currentStockStatus);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStockStatus && selectedStockStatus !== 'all')
      params.set('stock_status', selectedStockStatus);
    params.set('page', '1');
    router.push(`/medicines?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStockStatus && selectedStockStatus !== 'all')
      params.set('stock_status', selectedStockStatus);
    params.set('page', newPage.toString());
    router.push(`/medicines?${params.toString()}`);
  };

  const getStockStatusBadge = (
    status: MedicineWithStockSummary['stock_status'],
    available: number,
  ) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            In Stock ({available})
          </span>
        );
      case 'low_stock':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Low Stock ({available})
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Out of Stock
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            Expired Only
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Search, Filters & Add Button */}
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
                  placeholder="Search by brand name, generic name, code, strength..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  const params = new URLSearchParams();
                  if (searchTerm.trim()) params.set('search', searchTerm.trim());
                  if (e.target.value) params.set('category', e.target.value);
                  if (selectedStockStatus !== 'all')
                    params.set('stock_status', selectedStockStatus);
                  params.set('page', '1');
                  router.push(`/medicines?${params.toString()}`);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Categories</option>
                <option value="Antibiotics & Antimicrobials">Antibiotics</option>
                <option value="Analgesics & Anti-inflammatory">Analgesics</option>
                <option value="Cardiovascular & Antihypertensives">Cardiovascular</option>
                <option value="Diabetes & Endocrine">Diabetes</option>
                <option value="Gastrointestinal">Gastrointestinal</option>
              </select>

              {/* Stock Filter */}
              <select
                value={selectedStockStatus}
                onChange={(e) => {
                  setSelectedStockStatus(e.target.value);
                  const params = new URLSearchParams();
                  if (searchTerm.trim()) params.set('search', searchTerm.trim());
                  if (selectedCategory) params.set('category', selectedCategory);
                  if (e.target.value !== 'all') params.set('stock_status', e.target.value);
                  params.set('page', '1');
                  router.push(`/medicines?${params.toString()}`);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock Only</option>
                <option value="low_stock">Low Stock Alerts</option>
                <option value="out_of_stock">Out of Stock Only</option>
              </select>

              <Button type="submit" variant="secondary" className="h-10">
                Apply
              </Button>
            </div>

            <Link
              href="/medicines/new"
              className={buttonVariants({ variant: 'primary', className: 'h-10 gap-2 shrink-0' })}
            >
              <Plus className="w-4 h-4" />
              Add Medicine
            </Link>
          </form>
        </CardContent>
      </Card>

      {/* Catalogue Table */}
      <Card className="border border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface-muted/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-text-primary">
              Registered Catalogue Items ({initialData.totalRecords})
            </CardTitle>
          </div>
          <span className="text-xs text-text-muted font-mono">
            Page {initialData.currentPage} of {initialData.totalPages}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {initialData.medicines.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Pill}
                title="No medicines found"
                description={
                  searchTerm
                    ? `No catalogue matches found for "${searchTerm}". Try adjusting your keywords.`
                    : 'The medicine catalogue is empty. Register your first item to begin inventory tracking.'
                }
                action={
                  <Link
                    href="/medicines/new"
                    className={buttonVariants({
                      variant: 'primary',
                      size: 'sm',
                      className: 'gap-2',
                    })}
                  >
                    <Plus className="w-4 h-4" />
                    Add Medicine
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted/20">
                    <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider">
                      Item Code
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Brand & Formulation
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Generic Name (API)
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">
                      Stock Health
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                      Available
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                      Earliest Expiry
                    </TableHead>
                    <TableHead className="w-[100px] text-xs font-semibold uppercase tracking-wider text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.medicines.map((med) => (
                    <TableRow key={med.id} className="hover:bg-surface-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs text-text-secondary">
                        {med.item_code || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-text-primary text-sm">{med.name}</div>
                        <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                          <span>{med.dosage_form}</span>
                          <span>•</span>
                          <span>{med.strength}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary font-medium">
                        {med.generic_name}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-surface-muted text-text-secondary border border-border/50">
                          {med.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStockStatusBadge(med.stock_status, med.available_stock)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm text-text-primary">
                        <span
                          className={
                            med.available_stock <= med.min_threshold
                              ? 'text-amber-600 font-bold'
                              : ''
                          }
                        >
                          {med.available_stock}
                        </span>{' '}
                        <span className="text-xs text-text-muted font-normal">
                          {med.unit_of_measure}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono text-text-secondary">
                        {med.earliest_expiry || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/medicines/${med.id}`}
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
            <div className="py-3 px-4 border-t border-border/60 bg-surface-muted/10 flex items-center justify-between text-xs text-text-muted">
              <span>
                Showing {(initialData.currentPage - 1) * initialData.pageSize + 1}–
                {Math.min(initialData.currentPage * initialData.pageSize, initialData.totalRecords)}{' '}
                of {initialData.totalRecords} medicines
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
