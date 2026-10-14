'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  UserPlus,
  FileText,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Phone,
} from 'lucide-react';
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
import { PatientWithRelations } from '@/modules/patients/types';

interface PatientTableProps {
  initialPatients: PatientWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLiveDatabase: boolean;
  currentSearch?: string;
  currentGender?: string;
  currentAdmissionStatus?: string;
}

export function PatientTable({
  initialPatients,
  total,
  page,
  pageSize,
  totalPages,
  isLiveDatabase,
  currentSearch = '',
  currentGender = 'all',
  currentAdmissionStatus = 'all',
}: PatientTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [genderFilter, setGenderFilter] = useState(currentGender);
  const [statusFilter, setStatusFilter] = useState(currentAdmissionStatus);

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (genderFilter !== 'all') query.set('gender', genderFilter);
    if (statusFilter !== 'all') query.set('status', statusFilter);
    query.set('page', '1');
    router.push(`/patients?${query.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (genderFilter !== 'all') query.set('gender', genderFilter);
    if (statusFilter !== 'all') query.set('status', statusFilter);
    query.set('page', newPage.toString());
    router.push(`/patients?${query.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Patient Master Directory
            </h2>
            <Badge variant={isLiveDatabase ? 'success' : 'info'} size="sm">
              {isLiveDatabase ? 'Live Database' : 'Prototype Demo Mode'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Registered pharmacy clinical profiles, inpatient admissions, and paper prescription
            history.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/patients/new"
            className={buttonVariants({
              variant: 'primary',
              size: 'sm',
              className: 'gap-1.5 shadow-sm',
            })}
          >
            <UserPlus className="h-4 w-4" />
            Register Patient
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 bg-card-bg border-border">
        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="text"
              placeholder="Search by MR number, name, phone, or CNIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by gender"
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                const query = new URLSearchParams();
                if (search.trim()) query.set('search', search.trim());
                if (e.target.value !== 'all') query.set('gender', e.target.value);
                if (statusFilter !== 'all') query.set('status', statusFilter);
                query.set('page', '1');
                router.push(`/patients?${query.toString()}`);
              }}
              className="h-9 rounded-md border border-border bg-card-bg px-2.5 py-1 text-xs text-text-primary focus-ring"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <select
              aria-label="Filter by hospital status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                const query = new URLSearchParams();
                if (search.trim()) query.set('search', search.trim());
                if (genderFilter !== 'all') query.set('gender', genderFilter);
                if (e.target.value !== 'all') query.set('status', e.target.value);
                query.set('page', '1');
                router.push(`/patients?${query.toString()}`);
              }}
              className="h-9 rounded-md border border-border bg-card-bg px-2.5 py-1 text-xs text-text-primary focus-ring"
            >
              <option value="all">All Care Types</option>
              <option value="admitted">Admitted (Inpatient)</option>
              <option value="outpatient">Outpatient / Walk-in</option>
            </select>

            <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs">
              Apply
            </Button>
          </div>
        </form>
      </Card>

      {/* Table Section */}
      <Card>
        <CardContent className="p-0">
          {initialPatients.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Search}
                title="No patients found"
                description={
                  search
                    ? `No patient records match the search query "${search}". Try searching by another identifier.`
                    : 'No patients have been registered yet in the clinical master index.'
                }
                action={
                  <Link href="/patients/new">
                    <Button variant="primary" size="sm" className="gap-1.5 mt-2">
                      <UserPlus className="h-4 w-4" />
                      Register New Patient
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">MR Number</TableHead>
                  <TableHead>Patient & Father Name</TableHead>
                  <TableHead>Gender & DOB</TableHead>
                  <TableHead>CNIC / Phone</TableHead>
                  <TableHead>Hospital Care Status</TableHead>
                  <TableHead className="text-center">Prescriptions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialPatients.map((patient) => {
                  const isAdmitted = Boolean(patient.activeAdmission);

                  return (
                    <TableRow key={patient.id} className="hover:bg-hover-bg/60 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="hover:underline focus-ring rounded"
                        >
                          {patient.mr_number}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <Link
                            href={`/patients/${patient.id}`}
                            className="font-medium text-xs text-text-primary hover:text-primary transition-colors"
                          >
                            {patient.full_name}
                          </Link>
                          {patient.father_name && (
                            <span className="text-[11px] text-text-muted">
                              s/o, d/o {patient.father_name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="capitalize text-text-primary">{patient.gender}</span>
                          {patient.date_of_birth ? (
                            <span className="text-[11px] text-text-muted">
                              {patient.date_of_birth}
                            </span>
                          ) : (
                            <span className="text-[11px] text-text-muted">DOB unrecorded</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs">
                          {patient.cnic ? (
                            <span className="font-mono text-[11px] text-text-secondary">
                              {patient.cnic}
                            </span>
                          ) : (
                            <span className="text-[11px] text-text-muted italic">No CNIC</span>
                          )}
                          {patient.phone && (
                            <span className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-text-secondary" />
                              {patient.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {isAdmitted ? (
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="warning" size="sm" className="w-fit gap-1">
                              <BedDouble className="h-3 w-3" />
                              Inpatient
                            </Badge>
                            <span className="text-[11px] text-text-secondary font-medium">
                              {patient.activeAdmission?.ward}
                              {patient.activeAdmission?.bed_number &&
                                ` • ${patient.activeAdmission.bed_number}`}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="muted" size="sm" className="w-fit">
                            Outpatient / Walk-in
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="default" size="sm">
                          {patient.prescriptionCount || 0} orders
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/patients/${patient.id}`}
                            className={buttonVariants({
                              variant: 'outline',
                              size: 'sm',
                              className: 'h-7 px-2.5 text-xs',
                            })}
                          >
                            View Record
                          </Link>
                          <Link
                            href={`/prescriptions/new?patientId=${patient.id}`}
                            className={buttonVariants({
                              variant: 'secondary',
                              size: 'sm',
                              className: 'h-7 px-2 text-xs gap-1',
                            })}
                            title="Transcribe prescription"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Rx
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-text-secondary">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
                patient records
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
