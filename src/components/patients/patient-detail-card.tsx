'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  BedDouble,
  FileText,
  Edit,
  PlusCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { PatientWithRelations } from '@/modules/patients/types';
import { EditPatientDialog } from './edit-patient-dialog';
import { RecordAdmissionDialog } from './record-admission-dialog';

interface PatientDetailCardProps {
  patient: PatientWithRelations;
}

export function PatientDetailCard({ patient }: PatientDetailCardProps) {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'admissions'>('prescriptions');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAdmissionDialog, setShowAdmissionDialog] = useState(false);

  const isAdmitted = Boolean(patient.activeAdmission);
  const admissions = patient.admissions || [];
  const prescriptions = patient.prescriptions || [];

  return (
    <div className="space-y-4">
      {/* Patient Header Card */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <User className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-text-primary tracking-tight">
                    {patient.full_name}
                  </h1>
                  <Badge
                    variant="default"
                    size="md"
                    className="font-mono text-primary bg-primary/10"
                  >
                    {patient.mr_number}
                  </Badge>
                  {isAdmitted ? (
                    <Badge variant="warning" size="md" className="gap-1 font-semibold">
                      <BedDouble className="h-3.5 w-3.5" />
                      Inpatient • {patient.activeAdmission?.ward}
                    </Badge>
                  ) : (
                    <Badge variant="muted" size="md">
                      Outpatient / Walk-in
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                  {patient.father_name && <span>s/o, d/o {patient.father_name}</span>}
                  <span className="capitalize">{patient.gender}</span>
                  {patient.date_of_birth && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-text-muted" />
                      DOB: {patient.date_of_birth}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="gap-1.5 text-xs"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit Profile
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAdmissionDialog(true)}
                className="gap-1.5 text-xs"
              >
                <BedDouble className="h-3.5 w-3.5 text-primary" />
                {isAdmitted ? 'Transfer / Readmit' : 'Record Admission'}
              </Button>

              <Link href={`/prescriptions/new?patientId=${patient.id}`}>
                <Button variant="primary" size="sm" className="gap-1.5 text-xs shadow-sm">
                  <FileText className="h-3.5 w-3.5" />
                  Transcribe Prescription
                </Button>
              </Link>
            </div>
          </div>

          {/* Demographic Detail Badges Grid */}
          <div className="mt-5 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors duration-150">
              <CreditCard className="h-4 w-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase font-semibold">
                  CNIC Number
                </span>
                <span className="font-mono font-medium text-text-primary">
                  {patient.cnic || 'Not recorded'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors duration-150">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase font-semibold">
                  Contact Phone
                </span>
                <span className="font-medium text-text-primary">
                  {patient.phone || 'Not recorded'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors duration-150">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase font-semibold">
                  Residential Area
                </span>
                <span
                  className="font-medium text-text-primary truncate max-w-44"
                  title={patient.address || ''}
                >
                  {patient.address || 'Kohat District'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors duration-150">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase font-semibold">
                  Registered Since
                </span>
                <span className="font-medium text-text-primary">
                  {new Date(patient.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section: Prescriptions & Admissions */}
      <Card>
        <CardHeader className="p-3 border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'prescriptions'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg'
              }`}
            >
              Paper Prescriptions ({prescriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('admissions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'admissions'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg'
              }`}
            >
              Hospital Admissions ({admissions.length})
            </button>
          </div>

          <div>
            {activeTab === 'prescriptions' ? (
              <Link href={`/prescriptions/new?patientId=${patient.id}`}>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  New Rx
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdmissionDialog(true)}
                className="h-7 text-xs gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Admit
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {activeTab === 'prescriptions' ? (
            prescriptions.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-secondary">
                <FileText className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
                <p className="font-medium text-text-primary">No prescriptions recorded yet</p>
                <p className="mt-0.5">
                  Transcribe doctor orders from handwritten prescription slips.
                </p>
                <Link href={`/prescriptions/new?patientId=${patient.id}`}>
                  <Button variant="primary" size="sm" className="mt-3 text-xs gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Transcribe First Prescription
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rx Number</TableHead>
                    <TableHead>Prescription Date</TableHead>
                    <TableHead>Prescribing Physician</TableHead>
                    <TableHead>Care Setting</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        <Link href={`/prescriptions/${rx.id}`} className="hover:underline">
                          {rx.prescription_number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {rx.prescription_date}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-text-primary">
                        {rx.prescriber_name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {rx.admission_id ? (
                          <Badge variant="warning" size="sm">
                            Inpatient
                          </Badge>
                        ) : (
                          <Badge variant="muted" size="sm">
                            Outpatient
                          </Badge>
                        )}
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
                            View Order
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : admissions.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-secondary">
              <BedDouble className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="font-medium text-text-primary">No hospital admissions on record</p>
              <p className="mt-0.5">
                This patient currently receives outpatient dispensary services.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAdmissionDialog(true)}
                className="mt-3 text-xs gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Record Hospital Admission
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission Number</TableHead>
                  <TableHead>Ward / Department</TableHead>
                  <TableHead>Bed Number</TableHead>
                  <TableHead>Attending Doctor</TableHead>
                  <TableHead>Admission Date</TableHead>
                  <TableHead>Discharge Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admissions.map((adm) => (
                  <TableRow key={adm.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {adm.admission_number}
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
                      {new Date(adm.admission_date).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {adm.discharge_date
                        ? new Date(adm.discharge_date).toLocaleDateString('en-GB')
                        : '—'}
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
        </CardContent>
      </Card>

      {/* Edit Patient Dialog */}
      <EditPatientDialog
        patient={patient}
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
      />

      {/* Record Admission Dialog */}
      <RecordAdmissionDialog
        patient={patient}
        open={showAdmissionDialog}
        onClose={() => setShowAdmissionDialog(false)}
      />
    </div>
  );
}
