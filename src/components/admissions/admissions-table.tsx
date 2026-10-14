'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BedDouble, Search, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { AdmissionWithPatient } from '@/modules/admissions/types';

interface AdmissionsTableProps {
  initialAdmissions: AdmissionWithPatient[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLiveDatabase: boolean;
  currentSearch?: string;
  currentStatus?: string;
}

export function AdmissionsTable({
  initialAdmissions,
  total,
  page,
  pageSize,
  totalPages,
  isLiveDatabase,
  currentSearch = '',
  currentStatus = 'all',
}: AdmissionsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [statusFilter, setStatusFilter] = useState(currentStatus);

  const applyFilters = (term: string, status: string, pageNum = 1) => {
    const query = new URLSearchParams();
    if (term.trim()) query.set('search', term.trim());
    if (status !== 'all') query.set('status', status);
    query.set('page', pageNum.toString());
    router.push(`/admissions?${query.toString()}`);
  };

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    applyFilters(search, statusFilter, 1);
  };

  const handlePageChange = (newPage: number) => {
    applyFilters(search, statusFilter, newPage);
  };

  const quickChips = [
    { label: 'All Records', status: 'all' },
    { label: 'Active Admitted', status: 'admitted' },
    { label: 'Discharged', status: 'discharged' },
    { label: 'Transferred', status: 'transferred' },
  ];

  const exportData = initialAdmissions.map((adm) => ({
    'Admission #': adm.admission_number,
    'Patient Name': adm.patient?.full_name || 'N/A',
    MRN: adm.patient?.mr_number || 'N/A',
    'Ward / Department': adm.ward,
    'Bed Number': adm.bed_number || 'Unassigned',
    'Attending Doctor': adm.attending_doctor || 'Staff Physician',
    'Admission Date': adm.admission_date,
    Status: adm.status,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Hospital Inpatient Admissions
            </h2>
            <Badge variant={isLiveDatabase ? 'success' : 'info'} size="sm">
              {isLiveDatabase ? 'Live Database' : 'Prototype Demo Mode'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Active ward bed assignments, patient admission dates, and clinical discharge records.
          </p>
        </div>

        <ExportCsvButton
          data={exportData}
          filename="MedLedger_Admissions_Registry.csv"
          label="Export Admissions CSV"
          size="sm"
        />
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border shadow-card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-teal-500 via-primary to-emerald-500" />
        <CardContent className="p-4 space-y-3">
          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type="text"
                placeholder="Search by admission number, ward, doctor, or patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by admission status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  applyFilters(search, e.target.value, 1);
                }}
                className="h-9 rounded-md border border-border bg-card-bg px-2.5 py-1 text-xs text-text-primary focus-ring"
              >
                <option value="all">All Statuses</option>
                <option value="admitted">Admitted</option>
                <option value="discharged">Discharged</option>
                <option value="transferred">Transferred</option>
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

      {/* Table Section */}
      <Card className="border border-border shadow-card overflow-hidden">
        <CardContent className="p-0">
          {initialAdmissions.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={BedDouble}
                title="No admissions found"
                description={
                  search
                    ? `No admission records match the search query "${search}".`
                    : 'No inpatient admissions have been recorded yet.'
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission #</TableHead>
                  <TableHead>Patient & MRN</TableHead>
                  <TableHead>Ward / Department</TableHead>
                  <TableHead>Bed Number</TableHead>
                  <TableHead>Attending Doctor</TableHead>
                  <TableHead>Admission Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialAdmissions.map((adm) => (
                  <TableRow key={adm.id} className="hover:bg-hover-bg/60 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {adm.admission_number}
                    </TableCell>

                    <TableCell>
                      {adm.patient ? (
                        <div className="flex flex-col">
                          <Link
                            href={`/patients/${adm.patient.id}`}
                            className="font-medium text-xs text-text-primary hover:text-primary transition-colors flex items-center gap-1"
                          >
                            <User className="h-3 w-3 text-text-muted" />
                            {adm.patient.full_name}
                          </Link>
                          <span className="font-mono text-[11px] text-text-muted">
                            {adm.patient.mr_number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">Patient unlinked</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs font-medium text-text-primary">
                      {adm.ward}
                    </TableCell>

                    <TableCell className="text-xs text-text-secondary">
                      {adm.bed_number || 'Unassigned'}
                    </TableCell>

                    <TableCell className="text-xs text-text-secondary">
                      {adm.attending_doctor || 'Staff Physician'}
                    </TableCell>

                    <TableCell className="text-xs text-text-muted">
                      {new Date(adm.admission_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>

                    <TableCell className="text-right">
                      <Badge
                        variant={adm.status === 'admitted' ? 'warning' : 'default'}
                        size="sm"
                        className="capitalize"
                      >
                        {adm.status}
                      </Badge>
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
                admission records
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
