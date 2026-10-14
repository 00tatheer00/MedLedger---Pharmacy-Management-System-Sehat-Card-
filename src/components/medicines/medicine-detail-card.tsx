'use client';

import Link from 'next/link';
import {
  Pill,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  History,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { MedicineWithStockSummary } from '@/modules/medicines/types';
import { MedicineBatch, StockMovement } from '@/modules/inventory/types';
import { EditMedicineDialog } from './edit-medicine-dialog';
import { StockAdjustmentDialog } from '@/components/inventory/stock-adjustment-dialog';
import { AddOpeningBatchDialog } from '@/components/inventory/add-opening-batch-dialog';
import { calculateDaysUntilExpiry } from '@/modules/inventory/alerts';

interface MedicineDetailCardProps {
  medicine: MedicineWithStockSummary;
  batches: MedicineBatch[];
  movements: StockMovement[];
}

export function MedicineDetailCard({ medicine, batches, movements }: MedicineDetailCardProps) {
  const getBatchStatusBadge = (status: MedicineBatch['status'], expiryDate: string) => {
    const days = calculateDaysUntilExpiry(expiryDate);

    if (status === 'quarantined') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Quarantined
        </span>
      );
    }

    if (status === 'expired' || days <= 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          Expired
        </span>
      );
    }

    if (days <= 60) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Near Expiry ({days}d)
        </span>
      );
    }

    if (status === 'depleted') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700">
          Depleted
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Available
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/medicines"
          className="inline-flex items-center text-xs font-medium text-text-secondary hover:text-text-primary gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Medicines Catalogue
        </Link>
      </div>

      {/* Main Header & Specs Card */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="py-4 px-6 border-b border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary mt-1">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl font-bold text-text-primary">
                  {medicine.name}
                </CardTitle>
                <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-surface-muted text-text-secondary border border-border/60">
                  {medicine.category}
                </span>
                {medicine.is_active ? (
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="muted" size="sm">
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-text-secondary mt-1">
                Active Ingredient (API):{' '}
                <span className="font-semibold text-text-primary">{medicine.generic_name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <EditMedicineDialog medicine={medicine} />
            <AddOpeningBatchDialog
              medicineId={medicine.id}
              medicineName={medicine.name}
              unitOfMeasure={medicine.unit_of_measure}
            />
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-muted/30 border border-border/50 text-xs">
            <div>
              <span className="text-text-muted font-medium block">Dosage Form</span>
              <span className="font-semibold text-text-primary text-sm mt-0.5 block">
                {medicine.dosage_form}
              </span>
            </div>
            <div>
              <span className="text-text-muted font-medium block">Strength</span>
              <span className="font-semibold text-text-primary text-sm mt-0.5 block">
                {medicine.strength}
              </span>
            </div>
            <div>
              <span className="text-text-muted font-medium block">Unit of Measure</span>
              <span className="font-semibold text-text-primary text-sm mt-0.5 block">
                {medicine.unit_of_measure}
              </span>
            </div>
            <div>
              <span className="text-text-muted font-medium block">Min Reorder Threshold</span>
              <span className="font-semibold text-text-primary text-sm mt-0.5 block">
                {medicine.min_threshold} {medicine.unit_of_measure}
              </span>
            </div>
          </div>

          {/* Stock Metrics Row */}
          <div>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Inventory Balance Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 text-emerald-950">
                <span className="text-xs font-medium text-emerald-700 block">
                  Available for Dispensing
                </span>
                <span className="text-2xl font-bold font-mono mt-1 block">
                  {medicine.available_stock}
                </span>
                <span className="text-[11px] text-emerald-600 mt-0.5 block">Approved stock</span>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 text-amber-950">
                <span className="text-xs font-medium text-amber-700 block">Quarantined Stock</span>
                <span className="text-2xl font-bold font-mono mt-1 block">
                  {medicine.quarantined_stock}
                </span>
                <span className="text-[11px] text-amber-600 mt-0.5 block">Held for inspection</span>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40 text-rose-950">
                <span className="text-xs font-medium text-rose-700 block">Expired Stock</span>
                <span className="text-2xl font-bold font-mono mt-1 block">
                  {medicine.expired_stock}
                </span>
                <span className="text-[11px] text-rose-600 mt-0.5 block">
                  Pending disposal write-off
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-surface-muted/40 text-text-primary">
                <span className="text-xs font-medium text-text-muted block">
                  Total Units on Hand
                </span>
                <span className="text-2xl font-bold font-mono mt-1 block">
                  {medicine.total_stock}
                </span>
                <span className="text-[11px] text-text-muted mt-0.5 block">
                  Across {batches.length} batches
                </span>
              </div>
            </div>
          </div>

          {/* Batches Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Associated Batches ({batches.length})
                </h3>
              </div>
              <span className="text-xs text-text-muted font-medium">
                Sorted by FEFO (First-Expired, First-Out)
              </span>
            </div>

            {batches.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded-xl text-center text-text-muted text-xs">
                No active batches recorded for this medicine. Click &quot;Add Opening Batch&quot;
                above to initialize stock.
              </div>
            ) : (
              <div className="border border-border/80 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-muted/30">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        Batch #
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        Expiry Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                        Quantity on Hand
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                        Unit Cost (PKR)
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">
                        Batch Status
                      </TableHead>
                      <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id} className="hover:bg-surface-muted/30">
                        <TableCell className="font-mono text-xs font-bold text-text-primary">
                          {batch.batch_number}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-text-secondary">
                          {batch.expiry_date}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-text-primary">
                          {batch.quantity_on_hand}{' '}
                          <span className="text-[10px] text-text-muted font-normal">
                            {medicine.unit_of_measure}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-text-secondary">
                          PKR {batch.unit_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getBatchStatusBadge(batch.status, batch.expiry_date)}
                        </TableCell>
                        <TableCell className="text-right">
                          <StockAdjustmentDialog batch={batch} medicineName={medicine.name} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Stock Movements Ledger for this medicine */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Recent Stock Ledger Movements ({movements.length})
              </h3>
            </div>

            {movements.length === 0 ? (
              <div className="p-4 border border-dashed border-border rounded-xl text-center text-text-muted text-xs">
                No stock movements logged for this medicine yet.
              </div>
            ) : (
              <div className="border border-border/80 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-muted/30">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        Timestamp
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        Type
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                        Qty Change
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                        Balance
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        Audit Justification
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        Operator
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((mov) => (
                      <TableRow key={mov.id} className="hover:bg-surface-muted/30 text-xs">
                        <TableCell className="font-mono text-text-muted">
                          {new Date(mov.performed_at).toLocaleDateString()}{' '}
                          {new Date(mov.performed_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize font-medium text-text-primary">
                            {mov.movement_type.replace('_', ' ')}
                          </span>
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
                        <TableCell className="text-right font-mono text-text-secondary">
                          {mov.previous_balance ?? '—'} → {mov.new_balance ?? '—'}
                        </TableCell>
                        <TableCell
                          className="text-text-secondary max-w-[280px] truncate"
                          title={mov.reason || ''}
                        >
                          {mov.reason || '—'}
                        </TableCell>
                        <TableCell className="text-text-muted">
                          {mov.performed_by_name || mov.performed_by}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
