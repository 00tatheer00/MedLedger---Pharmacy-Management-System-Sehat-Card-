'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { History, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { StockMovement } from '@/modules/inventory/types';

interface MovementsTableProps {
  initialData: {
    movements: StockMovement[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  currentSearch?: string;
  currentType?: string;
}

export function MovementsTable({
  initialData,
  currentSearch = '',
  currentType = 'all',
}: MovementsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [movementType, setMovementType] = useState(currentType);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('tab', 'movements');
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (movementType !== 'all') params.set('movement_type', movementType);
    params.set('page', '1');
    router.push(`/inventory?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('tab', 'movements');
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (movementType !== 'all') params.set('movement_type', movementType);
    params.set('page', newPage.toString());
    router.push(`/inventory?${params.toString()}`);
  };

  const getMovementBadge = (
    type: StockMovement['movement_type'],
    refType: StockMovement['reference_type'],
  ) => {
    if (refType === 'opening_balance') {
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Opening Intake
        </span>
      );
    }
    if (refType === 'quarantine') {
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Quarantine Hold
        </span>
      );
    }
    if (refType === 'expired_write_off') {
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Expiry Write-Off
        </span>
      );
    }

    switch (type) {
      case 'receipt':
        return (
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Receipt
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            Adjustment
          </span>
        );
      case 'dispensing':
        return (
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            Dispensing
          </span>
        );
      case 'return':
        return (
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Return
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
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
                  placeholder="Search by reference, medicine, batch, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>

              <select
                value={movementType}
                onChange={(e) => {
                  setMovementType(e.target.value);
                  const params = new URLSearchParams();
                  params.set('tab', 'movements');
                  if (searchTerm.trim()) params.set('search', searchTerm.trim());
                  if (e.target.value !== 'all') params.set('movement_type', e.target.value);
                  params.set('page', '1');
                  router.push(`/inventory?${params.toString()}`);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary"
              >
                <option value="all">All Movement Categories</option>
                <option value="receipt">Stock Receipts</option>
                <option value="adjustment">Adjustments & Discrepancies</option>
                <option value="expired_write_off">Expiry Write-Offs</option>
              </select>

              <Button type="submit" variant="secondary" className="h-10">
                Apply
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Movements Table Card */}
      <Card className="border border-border shadow-card overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border bg-slate-50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-text-primary">
              Immutable Stock Ledger ({initialData.totalRecords})
            </CardTitle>
          </div>
          <span className="text-xs text-text-muted font-mono">
            Page {initialData.currentPage} of {initialData.totalPages}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {initialData.movements.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={History}
                title="No stock movements recorded"
                description={
                  searchTerm
                    ? `No movements found matching "${searchTerm}".`
                    : 'The stock movement ledger is currently empty.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider">
                      Timestamp
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider">
                      Reference
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                      Quantity
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                      Balance Change
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Medicine / Batch
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Clinical Audit Reason
                    </TableHead>
                    <TableHead className="w-[130px] text-xs font-semibold uppercase tracking-wider">
                      Operator
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.movements.map((mov) => (
                    <TableRow
                      key={mov.id}
                      className="hover:bg-slate-50 transition-colors duration-150 text-xs"
                    >
                      <TableCell className="font-mono text-text-muted whitespace-nowrap">
                        {new Date(mov.performed_at).toLocaleDateString()}{' '}
                        {new Date(mov.performed_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-text-secondary">
                        {mov.reference_id}
                      </TableCell>
                      <TableCell>
                        {getMovementBadge(mov.movement_type, mov.reference_type)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        <span
                          className={
                            mov.quantity > 0
                              ? 'text-emerald-600'
                              : mov.quantity < 0
                                ? 'text-rose-600'
                                : 'text-amber-600'
                          }
                        >
                          {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-text-secondary whitespace-nowrap">
                        {mov.previous_balance ?? '—'} → {mov.new_balance ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-text-primary">
                          {mov.medicine_name || 'Medicine'}
                        </div>
                        <div className="text-[11px] text-text-muted font-mono">
                          Batch: {mov.batch_number}
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-text-secondary max-w-[300px] truncate"
                        title={mov.reason || ''}
                      >
                        {mov.reason || '—'}
                      </TableCell>
                      <TableCell className="text-text-muted whitespace-nowrap">
                        {mov.performed_by_name || mov.performed_by}
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
                of {initialData.totalRecords} movements
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
