'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Search, Plus, ChevronLeft, ChevronRight, User, ArrowRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ExportCsvButton } from '@/lib/csv-helper';
import { PrescriptionWithDetails } from '@/modules/prescriptions/types';

interface PrescriptionTableProps {
  initialPrescriptions: PrescriptionWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLiveDatabase: boolean;
  currentSearch?: string;
  currentStatus?: string;
}

export function PrescriptionTable({
  initialPrescriptions,
  total,
  page,
  pageSize,
  totalPages,
  isLiveDatabase,
  currentSearch = '',
  currentStatus = 'all',
}: PrescriptionTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [statusFilter, setStatusFilter] = useState(currentStatus);

  const applyFilters = (term: string, status: string, pageNum = 1) => {
    const query = new URLSearchParams();
    if (term.trim()) query.set('search', term.trim());
    if (status !== 'all') query.set('status', status);
    query.set('page', pageNum.toString());
    router.push(`/prescriptions?${query.toString()}`);
  };

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    applyFilters(search, statusFilter, 1);
  };

  const handlePageChange = (newPage: number) => {
    applyFilters(search, statusFilter, newPage);
  };

  const quickChips = [
    { label: 'All Orders', status: 'all' },
    { label: 'Pending Dispense', status: 'pending' },
    { label: 'Partially Dispensed', status: 'partially_dispensed' },
    { label: 'Fully Dispensed', status: 'fully_dispensed' },
    { label: 'Cancelled', status: 'cancelled' },
  ];

  const exportData = initialPrescriptions.map((rx) => ({
    'Prescription Number': rx.prescription_number,
    'Patient Name': rx.patient.full_name,
    MRN: rx.patient.mr_number,
    'Care Setting': rx.admission ? `Inpatient (${rx.admission.ward})` : 'Outpatient',
    'Prescribing Doctor': rx.prescriber_name,
    'Prescription Date': rx.prescription_date,
    'Prescribed Medicines': rx.items.map((i) => i.medicine.name).join('; '),
    'Total Units Prescribed': rx.items.reduce((acc, it) => acc + it.prescribed_quantity, 0),
    Status: rx.status,
  }));

  return (
    <div className="space-y-4">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Prescription Intake Queue
            </h2>
            <Badge variant={isLiveDatabase ? 'success' : 'info'} size="sm">
              {isLiveDatabase ? 'Live Database' : 'Prototype Demo Mode'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Handwritten paper prescriptions transcribed into clinical orders awaiting dispensing
            verification.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ExportCsvButton
            data={exportData}
            filename="MedLedger_Prescriptions_Queue.csv"
            label="Export CSV"
            size="sm"
          />
          <Link
            href="/prescriptions/new"
            className={buttonVariants({
              variant: 'primary',
              size: 'sm',
              className: 'gap-1.5 shadow-sm',
            })}
          >
            <Plus className="h-4 w-4" />
            Transcribe Paper Prescription
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border shadow-card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500" />
        <CardContent className="p-4 space-y-3">
          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type="text"
                placeholder="Search by Rx number, doctor, patient name, MRN, or medicine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by prescription status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  applyFilters(search, e.target.value, 1);
                }}
                className="h-9 rounded-md border border-border bg-card-bg px-2.5 py-1 text-xs text-text-primary focus-ring"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Dispensing</option>
                <option value="partially_dispensed">Partially Dispensed</option>
                <option value="fully_dispensed">Fully Dispensed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs">
                Apply
              </Button>
            </div>
          </form>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider shrink-0 mr-1">
              Quick Filter:
            </span>
            {quickChips.map((chip) => {
              const active = statusFilter === chip.status;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setStatusFilter(chip.status);
                    applyFilters(search, chip.status, 1);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-primary text-white shadow-xs font-semibold'
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

      {/* Table Section */}
      <Card className="border border-border shadow-card overflow-hidden">
        <CardContent className="p-0">
          {initialPrescriptions.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={FileText}
                title="No prescriptions found"
                description={
                  search
                    ? `No prescription records match the query "${search}".`
                    : 'No paper prescriptions have been transcribed yet.'
                }
                action={
                  <Link href="/prescriptions/new">
                    <Button variant="primary" size="sm" className="gap-1.5 mt-2">
                      <Plus className="h-4 w-4" />
                      Transcribe First Prescription
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Rx Number</TableHead>
                  <TableHead>Patient & MRN</TableHead>
                  <TableHead>Care Setting</TableHead>
                  <TableHead>Prescribing Physician</TableHead>
                  <TableHead>Prescription Date</TableHead>
                  <TableHead>Prescribed Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialPrescriptions.map((rx) => (
                  <TableRow key={rx.id} className="hover:bg-hover-bg/60 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      <Link
                        href={`/prescriptions/${rx.id}`}
                        className="hover:underline focus-ring rounded"
                      >
                        {rx.prescription_number}
                      </Link>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/patients/${rx.patient_id}`}
                          className="font-medium text-xs text-text-primary hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <User className="h-3 w-3 text-text-muted" />
                          {rx.patient.full_name}
                        </Link>
                        <span className="font-mono text-[11px] text-text-muted">
                          {rx.patient.mr_number}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      {rx.admission ? (
                        <div className="flex flex-col">
                          <Badge variant="warning" size="sm" className="w-fit">
                            Inpatient
                          </Badge>
                          <span className="text-[11px] text-text-secondary mt-0.5">
                            {rx.admission.ward}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="muted" size="sm">
                          Outpatient
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs font-medium text-text-primary">
                      {rx.prescriber_name}
                    </TableCell>

                    <TableCell className="text-xs text-text-secondary">
                      {rx.prescription_date}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex flex-col gap-0.5 max-w-56">
                        <span
                          className="font-medium text-text-primary truncate"
                          title={rx.items.map((i) => i.medicine.name).join(', ')}
                        >
                          {rx.items[0]?.medicine.name || 'Unspecified Medicine'}
                          {rx.items.length > 1 && ` +${rx.items.length - 1} more`}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {rx.items.reduce((acc, it) => acc + it.prescribed_quantity, 0)} total
                          units
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          rx.status === 'fully_dispensed'
                            ? 'success'
                            : rx.status === 'pending'
                              ? 'info'
                              : rx.status === 'cancelled'
                                ? 'danger'
                                : 'warning'
                        }
                        size="sm"
                        className="capitalize"
                      >
                        {rx.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Link href={`/prescriptions/${rx.id}`}>
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1">
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-text-secondary">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
                prescription orders
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="h-8 px-2 text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="px-2 font-medium text-text-primary">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="h-8 px-2 text-xs gap-1"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
