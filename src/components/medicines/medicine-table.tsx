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
  Trash2,
  Filter,
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
import { Dialog } from '@/components/ui/dialog';
import { MedicineWithStockSummary, PaginatedMedicinesResult } from '@/modules/medicines/types';
import { deleteMedicineAction } from '@/modules/medicines/actions';
import { EditMedicineDialog } from './edit-medicine-dialog';
import { ExportCsvButton, CsvColumn } from '@/lib/csv-helper';
import { toast } from '@/components/feedback/toast';

interface MedicineTableProps {
  initialData: PaginatedMedicinesResult;
  currentSearch?: string;
  currentCategory?: string;
  currentStockStatus?: string;
}

const MEDICINE_CSV_COLUMNS: CsvColumn<MedicineWithStockSummary>[] = [
  { header: 'Item Code', accessor: (m) => m.item_code || '' },
  { header: 'Medicine Name', accessor: (m) => m.name },
  { header: 'Generic Name (API)', accessor: (m) => m.generic_name },
  { header: 'Category', accessor: (m) => m.category },
  { header: 'Dosage Form', accessor: (m) => m.dosage_form },
  { header: 'Strength', accessor: (m) => m.strength },
  { header: 'Unit of Measure', accessor: (m) => m.unit_of_measure },
  { header: 'Available Stock', accessor: (m) => m.available_stock },
  { header: 'Min Threshold', accessor: (m) => m.min_threshold },
  { header: 'Stock Status', accessor: (m) => m.stock_status },
  { header: 'Earliest Expiry', accessor: (m) => m.earliest_expiry || 'N/A' },
];

const POPULAR_CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Antibiotics', value: 'Antibiotics & Antimicrobials' },
  { label: 'Diabetes', value: 'Diabetes & Endocrine' },
  { label: 'Cardiovascular', value: 'Cardiovascular & Antihypertensives' },
  { label: 'Analgesics', value: 'Analgesics & Anti-inflammatory' },
  { label: 'Gastrointestinal', value: 'Gastrointestinal' },
];

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
  const [deleteTarget, setDeleteTarget] = useState<MedicineWithStockSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const applyFilters = (
    search: string = searchTerm,
    category: string = selectedCategory,
    status: string = selectedStockStatus,
    page: number = 1,
  ) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (category) params.set('category', category);
    if (status && status !== 'all') params.set('stock_status', status);
    params.set('page', String(page));
    router.push(`/medicines?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm, selectedCategory, selectedStockStatus, 1);
  };

  const handleCategoryPill = (catValue: string) => {
    setSelectedCategory(catValue);
    applyFilters(searchTerm, catValue, selectedStockStatus, 1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteMedicineAction(deleteTarget.id);
      if (res.success) {
        toast.success(`"${deleteTarget.name}" deleted from catalogue.`);
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(res.error.message || 'Failed to delete medicine');
      }
    } catch {
      toast.error('An unexpected error occurred during deletion.');
    } finally {
      setIsDeleting(false);
    }
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
            Expired ({available})
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Top Action Bar with Gradient Edge */}
      <Card className="border border-slate-200/90 shadow-sm overflow-hidden bg-white hover:border-slate-300 transition-all">
        <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600" />
        <CardContent className="p-4 space-y-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between"
          >
            <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  type="text"
                  placeholder="Search brand, generic name, or item code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 w-full bg-slate-50/70 border-slate-200 focus:bg-white text-sm"
                />
              </div>

              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  applyFilters(searchTerm, e.target.value, selectedStockStatus, 1);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="Antibiotics & Antimicrobials">Antibiotics & Antimicrobials</option>
                <option value="Analgesics & Anti-inflammatory">
                  Analgesics & Anti-inflammatory
                </option>
                <option value="Cardiovascular & Antihypertensives">
                  Cardiovascular & Antihypertensives
                </option>
                <option value="Diabetes & Endocrine">Diabetes & Endocrine</option>
                <option value="Gastrointestinal">Gastrointestinal</option>
              </select>

              {/* Stock Filter */}
              <select
                value={selectedStockStatus}
                onChange={(e) => {
                  setSelectedStockStatus(e.target.value);
                  applyFilters(searchTerm, selectedCategory, e.target.value, 1);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock Only</option>
                <option value="low_stock">Low Stock Alerts</option>
                <option value="out_of_stock">Out of Stock Only</option>
              </select>

              <Button type="submit" variant="secondary" className="h-10 px-4 cursor-pointer">
                Apply
              </Button>
            </div>

            {/* Actions: CSV Export & Add Medicine */}
            <div className="flex items-center gap-2 shrink-0">
              <ExportCsvButton
                filename="medledger-medicines-catalogue"
                data={initialData.medicines}
                columns={MEDICINE_CSV_COLUMNS}
                label="Export CSV"
              />

              <Link
                href="/medicines/new"
                className={buttonVariants({
                  variant: 'primary',
                  className:
                    'h-10 gap-2 shrink-0 shadow-sm bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all',
                })}
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </Link>
            </div>
          </form>

          {/* Quick Filter Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1 uppercase tracking-wider">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {POPULAR_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.value;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => handleCategoryPill(cat.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Catalogue Table */}
      <Card className="border border-slate-200/90 shadow-sm overflow-hidden bg-white">
        <CardHeader className="py-3 px-4 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60">
              <Pill className="w-4 h-4 text-teal-600" />
            </div>
            <CardTitle className="text-sm font-semibold text-text-primary">
              Registered Catalogue Items ({initialData.totalRecords})
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
              Page {initialData.currentPage} of {initialData.totalPages}
            </span>
          </div>
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
                  <TableRow className="bg-slate-50/80">
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
                    <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.medicines.map((med) => (
                    <TableRow
                      key={med.id}
                      className="hover:bg-teal-50/30 transition-colors duration-150 group"
                    >
                      <TableCell className="font-mono text-xs text-text-secondary font-medium">
                        {med.item_code || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-text-primary text-sm group-hover:text-teal-700 transition-colors">
                          {med.name}
                        </div>
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
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {med.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStockStatusBadge(med.stock_status, med.available_stock)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm text-text-primary">
                        <span
                          className={
                            med.available_stock <= med.min_threshold
                              ? 'text-amber-600 font-bold'
                              : 'text-slate-900'
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
                        <div className="flex items-center justify-end gap-1">
                          {/* Details Link */}
                          <Link
                            href={`/medicines/${med.id}`}
                            className={buttonVariants({
                              variant: 'ghost',
                              size: 'sm',
                              className:
                                'h-8 px-2 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 font-medium',
                            })}
                            title="View full details"
                          >
                            Details
                          </Link>

                          {/* In-table Edit Dialog */}
                          <EditMedicineDialog medicine={med} />

                          {/* Delete Action Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(med)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete medicine"
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
                of {initialData.totalRecords} medicines
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs bg-white"
                  disabled={initialData.currentPage <= 1}
                  onClick={() =>
                    applyFilters(
                      searchTerm,
                      selectedCategory,
                      selectedStockStatus,
                      initialData.currentPage - 1,
                    )
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
                    applyFilters(
                      searchTerm,
                      selectedCategory,
                      selectedStockStatus,
                      initialData.currentPage + 1,
                    )
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Medicine from Catalogue"
        description="Are you sure you want to remove this item? This action will mark it as inactive and hide it from future prescription auto-completion."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
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
        {deleteTarget && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1 text-xs">
            <div className="font-semibold text-text-primary text-sm">{deleteTarget.name}</div>
            <div className="text-text-muted">
              {deleteTarget.generic_name} • {deleteTarget.strength} • {deleteTarget.dosage_form}
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Item Code: {deleteTarget.item_code || 'N/A'} • Current Stock:{' '}
              {deleteTarget.available_stock} units
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
