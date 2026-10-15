import React from 'react';
import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SYSTEM_ROLES, ROLE_PERMISSIONS_MATRIX, SystemRole } from '@/core/authorization/roles';
import { isSupabaseConfigured } from '@/core/config/env';
import { Settings, Building2, Clock, Database, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hospital Settings & System Configuration',
  description:
    'DHQ Hospital Kohat facility configuration, user roles, security policies, and database connection status.',
};

export default function SettingsPage() {
  const isLiveDb = isSupabaseConfigured();

  return (
    <AppShell
      title="System & Facility Settings"
      subtitle="DHQ Hospital Kohat — Operational & Security Configuration"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Hospital Facility & Ledger Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative operating profile, database environment parameters, and role-based access
            controls for DHQ Hospital Kohat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Hospital Facility Profile */}
          <Card className="border border-border/70 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Hospital Facility Profile
              </CardTitle>
              <CardDescription className="text-xs">
                Official institutional metadata for hospital claims and pharmacy registration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-text-muted">Facility Name:</span>
                <span className="font-semibold text-text-primary">
                  District Headquarter Hospital (DHQ) Kohat
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-text-muted">Jurisdiction:</span>
                <span className="font-medium text-text-secondary">
                  Khyber Pakhtunkhwa Health Department
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-text-muted">Pharmacy License:</span>
                <span className="font-mono text-text-primary">KP-KHT-HOSP-PHARM-2026-081</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-text-muted">Central Dispensary Head:</span>
                <span className="font-medium text-text-secondary">
                  Dr. Ayesha Bangash, Chief Pharmacist
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-text-muted">Facility Type:</span>
                <span className="font-medium text-text-secondary">
                  Government Inpatient & Trauma Facility
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 2. Pharmacy Operating Hours */}
          <Card className="border border-border/70 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Dispensing Shifts & Operating Schedule
              </CardTitle>
              <CardDescription className="text-xs">
                Active clinical hours and emergency trauma dispensing policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-text-muted">Inpatient Wards Pharmacy:</span>
                <Badge variant="success" size="sm">
                  24/7 Continuous
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-text-muted">Emergency & Trauma Pharmacy:</span>
                <Badge variant="success" size="sm">
                  24/7 Continuous
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-text-muted">Outpatient (OPD) Dispensary:</span>
                <span className="font-medium text-text-secondary">
                  08:00 AM – 02:00 PM (Mon – Sat)
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-text-muted">FEFO Batch Allocation Rule:</span>
                <Badge variant="info" size="sm">
                  Strict First-Expiring First-Out
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 3. System & Database Environment */}
          <Card className="border border-border/70 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Database & Security Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Active execution environment, ledger arithmetic, and audit integrity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-text-muted">Database Engine:</span>
                <span className="font-medium text-text-secondary">
                  {isLiveDb
                    ? 'Supabase PostgreSQL (Live)'
                    : 'Prototype In-Memory Store (Evaluation Mode)'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-text-muted">Row Level Security (RLS):</span>
                <Badge variant={isLiveDb ? 'success' : 'warning'} size="sm">
                  {isLiveDb ? 'Enforced (28 Tables)' : 'Prototype RBAC Emulation'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-text-muted">Financial Arithmetic:</span>
                <span className="font-medium text-emerald-700">
                  Strict Integer Paisa (Decimal.ts)
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-text-muted">Audit Log Immutability:</span>
                <Badge variant="success" size="sm">
                  Protected (Triggers Enabled)
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-text-muted">RFC 4180 CSV Export:</span>
                <span className="font-medium text-text-secondary">Active with UTF-8 BOM</span>
              </div>
            </CardContent>
          </Card>

          {/* 4. RBAC Roles Matrix */}
          <Card className="border border-border/70 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Staff Role & Privilege Matrix
              </CardTitle>
              <CardDescription className="text-xs">
                Approved 5-role clinical and financial permission hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              {(Object.keys(SYSTEM_ROLES) as SystemRole[]).map((roleKey) => {
                const roleInfo = SYSTEM_ROLES[roleKey];
                const permissions = ROLE_PERMISSIONS_MATRIX[roleKey];
                return (
                  <div
                    key={roleKey}
                    className="p-2.5 rounded-lg border border-border/60 bg-surface-muted/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary">{roleInfo.name}</span>
                      <Badge variant="default" size="sm">
                        {permissions.length} permissions
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">{roleInfo.description}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
