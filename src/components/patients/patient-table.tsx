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
  Pencil,
  Trash2,
  Filter,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { PatientWithRelations } from '@/modules/patients/types';
import { deletePatientAction } from '@/modules/patients/actions';
import { EditPatientDialog } from './edit-patient-dialog';
import { ExportCsvButton, CsvColumn } from '@/lib/csv-helper';
import { toast } from '@/components/feedback/toast';

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

const PATIENT_CSV_COLUMNS: CsvColumn<PatientWithRelations>[] = [
  { header: 'MR Number', accessor: (p) => p.mr_number },
  { header: 'Full Name', accessor: (p) => p.full_name },
  { header: 'Father Name', accessor: (p) => p.father_name || 'N/A' },
  { header: 'CNIC', accessor: (p) => p.cnic || 'N/A' },
  { header: 'Gender', accessor: (p) => p.gender },
  { header: 'Date of Birth', accessor: (p) => p.date_of_birth || 'N/A' },
  { header: 'Phone', accessor: (p) => p.phone || 'N/A' },
  { header: 'Address', accessor: (p) => p.address || 'N/A' },
  { header: 'Admissions Count', accessor: (p) => p.admissionCount || 0 },
  { header: 'Prescriptions Count', accessor: (p) => p.prescriptionCount || 0 },
  {
    header: 'Active Status',
    accessor: (p) => (p.activeAdmission ? `Inpatient (${p.activeAdmission.ward})` : 'Outpatient'),
  },
];

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
  const [editingPatient, setEditingPatient] = useState<PatientWithRelations | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<PatientWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const applyFilters = (
    s: string = search,
    gender: string = genderFilter,
    status: string = statusFilter,
    p: number = 1,
  ) => {
    const query = new URLSearchParams();
    if (s.trim()) query.set('search', s.trim());
    if (gender !== 'all') query.set('gender', gender);
    if (status !== 'all') query.set('status', status);
    query.set('page', String(p));
    router.push(`/patients?${query.toString()}`);
  };

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    applyFilters(search, genderFilter, statusFilter, 1);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPatient) return;
    setIsDeleting(true);
    try {
      const res = await deletePatientAction(deletingPatient.id);
      if (res.success) {
        toast.success(`Patient record "${deletingPatient.full_name}" deleted.`);
        setDeletingPatient(null);
        router.refresh();
      } else {
        toast.error(res.error.message || 'Failed to delete patient record');
      }
    } catch {
      toast.error('An unexpected error occurred during patient deletion.');
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
            onSubmit={handleFilterSubmit}
            className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between"
          >
            <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  placeholder="Search by MRN, Name, or 13-digit CNIC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 w-full bg-slate-50/70 border-slate-200 focus:bg-white text-sm"
                />
              </div>

              {/* Gender Filter */}
              <select
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  applyFilters(search, e.target.value, statusFilter, 1);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              {/* Admission Status */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  applyFilters(search, genderFilter, e.target.value, 1);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">All Care Types</option>
                <option value="admitted">Inpatient (Admitted)</option>
                <option value="discharged">Outpatient / Walk-in</option>
              </select>

              <Button type="submit" variant="secondary" className="h-10 px-4 cursor-pointer">
                Filter
              </Button>
            </div>

            {/* Action Buttons: CSV Export & New Patient */}
            <div className="flex items-center gap-2 shrink-0">
              <ExportCsvButton
                filename="medledger-patients-registry"
                data={initialPatients}
                columns={PATIENT_CSV_COLUMNS}
                label="Export CSV"
              />

              <Link
                href="/patients/new"
                className={buttonVariants({
                  variant: 'primary',
                  className:
                    'h-10 gap-2 shrink-0 shadow-sm bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all',
                })}
              >
                <UserPlus className="h-4 w-4" />
                New Patient
              </Link>
            </div>
          </form>

          {/* Quick Filter Status Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1 uppercase tracking-wider">
              <Filter className="w-3 h-3" /> Quick:
            </span>
            {[
              { label: 'All', g: 'all', s: 'all' },
              { label: 'Inpatient Wards', g: 'all', s: 'admitted' },
              { label: 'Outpatient', g: 'all', s: 'discharged' },
              { label: 'Male', g: 'male', s: 'all' },
              { label: 'Female', g: 'female', s: 'all' },
            ].map((chip) => {
              const isActive = genderFilter === chip.g && statusFilter === chip.s;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setGenderFilter(chip.g);
                    setStatusFilter(chip.s);
                    applyFilters(search, chip.g, chip.s, 1);
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
            <CardTitle className="text-sm font-semibold text-text-primary">
              Registered Patients ({total})
            </CardTitle>
            <Badge variant={isLiveDatabase ? 'success' : 'info'} size="sm">
              {isLiveDatabase ? 'Live Database' : 'Prototype Demo Mode'}
            </Badge>
          </div>
          <span className="text-xs text-text-muted font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
            Page {page} of {totalPages || 1}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {initialPatients.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={UserPlus}
                title="No patients found"
                description={
                  search
                    ? `No patient records matching "${search}". Check CNIC format or spelling.`
                    : 'The patient registry is currently empty.'
                }
                action={
                  <Link
                    href="/patients/new"
                    className={buttonVariants({
                      variant: 'primary',
                      size: 'sm',
                      className: 'gap-2',
                    })}
                  >
                    <UserPlus className="h-4 w-4" />
                    Register First Patient
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider">
                      MR Number
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Patient Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Gender / DOB
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      CNIC & Contact
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Admission Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">
                      Prescriptions
                    </TableHead>
                    <TableHead className="w-[170px] text-xs font-semibold uppercase tracking-wider text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialPatients.map((patient) => {
                    const isAdmitted =
                      patient.activeAdmission && patient.activeAdmission.status === 'admitted';

                    return (
                      <TableRow
                        key={patient.id}
                        className="hover:bg-teal-50/30 transition-colors duration-150 group"
                      >
                        <TableCell className="font-mono text-xs font-bold text-teal-700">
                          {patient.mr_number}
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-text-primary text-sm group-hover:text-teal-700 transition-colors">
                            {patient.full_name}
                          </div>
                          {patient.father_name && (
                            <div className="text-xs text-text-muted mt-0.5">
                              s/o, d/o: {patient.father_name}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="capitalize font-medium text-text-primary">
                              {patient.gender}
                            </span>
                            <span className="text-[11px] text-text-muted">
                              {patient.date_of_birth || 'DOB unrecorded'}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col text-xs">
                            {patient.cnic ? (
                              <span className="font-mono text-[11px] text-text-secondary font-medium">
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
                              <Badge
                                variant="warning"
                                size="sm"
                                className="w-fit gap-1 font-semibold"
                              >
                                <BedDouble className="h-3 w-3" />
                                Inpatient
                              </Badge>
                              <span className="text-[11px] text-text-secondary font-medium">
                                {patient.activeAdmission?.ward}
                                {patient.activeAdmission?.bed_number &&
                                  ` • Bed ${patient.activeAdmission.bed_number}`}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="muted" size="sm" className="w-fit">
                              Outpatient
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="default" size="sm" className="font-mono">
                            {patient.prescriptionCount || 0} orders
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Record Profile */}
                            <Link
                              href={`/patients/${patient.id}`}
                              className={buttonVariants({
                                variant: 'ghost',
                                size: 'sm',
                                className:
                                  'h-8 px-2 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 font-medium',
                              })}
                              title="View Patient Medical Profile"
                            >
                              Profile
                            </Link>

                            {/* Create Prescription shortcut */}
                            <Link
                              href={`/prescriptions/new?patientId=${patient.id}`}
                              className={buttonVariants({
                                variant: 'ghost',
                                size: 'sm',
                                className:
                                  'h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50',
                              })}
                              title="Write new Prescription"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Link>

                            {/* In-table Edit Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPatient(patient)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50 cursor-pointer"
                              title="Edit Patient Information"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingPatient(patient)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete Patient Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/70 text-xs text-text-secondary">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
                patient records
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => applyFilters(search, genderFilter, statusFilter, page - 1)}
                  className="h-8 px-2.5 text-xs bg-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <span className="px-2.5 font-semibold text-text-primary">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => applyFilters(search, genderFilter, statusFilter, page + 1)}
                  className="h-8 px-2.5 text-xs bg-white"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Patient Dialog */}
      {editingPatient && (
        <EditPatientDialog
          patient={editingPatient}
          open={Boolean(editingPatient)}
          onClose={() => setEditingPatient(null)}
        />
      )}

      {/* Delete Patient Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingPatient)}
        onClose={() => setDeletingPatient(null)}
        title="Delete Patient Record"
        description="Are you sure you want to remove this patient record? This action will archive the record and prevent active prescription dispensing."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingPatient(null)}
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
        {deletingPatient && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1 text-xs">
            <div className="font-semibold text-text-primary text-sm">
              {deletingPatient.full_name}
            </div>
            <div className="text-text-muted">
              MRN: {deletingPatient.mr_number} • CNIC: {deletingPatient.cnic || 'Unrecorded'}
            </div>
            <div className="text-slate-500 text-[11px]">
              Gender: {deletingPatient.gender} • Prescriptions:{' '}
              {deletingPatient.prescriptionCount || 0}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
