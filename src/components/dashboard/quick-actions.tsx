'use client';

import { useState } from 'react';
import {
  Pill,
  PackagePlus,
  ClipboardCheck,
  FileCheck2,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { quickActions, type QuickAction } from '@/lib/demo-data';

export function QuickActions() {
  const [activeModalAction, setActiveModalAction] = useState<QuickAction | null>(null);

  const getActionConfig = (id: string) => {
    switch (id) {
      case 'qa-dispense':
        return {
          icon: ClipboardCheck,
          isPrimary: true,
          badge: 'Primary Clinical Action',
          category: 'Dispensing Counter',
          targetPhase: 'Phase 4 (Prescription Dispensing)',
          iconColor: 'bg-primary text-white shadow-xs',
          borderStyle: 'border-primary/40 bg-primary-light/20 hover:border-primary',
        };
      case 'qa-receive-stock':
        return {
          icon: PackagePlus,
          isPrimary: false,
          badge: 'Inventory Intake',
          category: 'Goods Receipt (GRN)',
          targetPhase: 'Phase 3 (Purchasing & Goods Receipt)',
          iconColor: 'bg-teal/15 text-teal',
          borderStyle: 'border-border bg-card-bg hover:border-teal',
        };
      case 'qa-add-medicine':
        return {
          icon: Pill,
          isPrimary: false,
          badge: 'Catalogue',
          category: 'Drug Registry',
          targetPhase: 'Phase 3 (Medicines Catalogue)',
          iconColor: 'bg-blue/15 text-primary',
          borderStyle: 'border-border bg-card-bg hover:border-primary',
        };
      case 'qa-review-claims':
        return {
          icon: FileCheck2,
          isPrimary: false,
          badge: 'Finance',
          category: 'DHQ Billing Audit',
          targetPhase: 'Phase 5 (Claims & Billing Reconciliation)',
          iconColor: 'bg-warning-light/80 text-amber-800',
          borderStyle: 'border-border bg-card-bg hover:border-amber-500',
        };
      default:
        return {
          icon: Sparkles,
          isPrimary: false,
          badge: 'General',
          category: 'System',
          targetPhase: 'Upcoming Phase',
          iconColor: 'bg-hover-bg text-text-primary',
          borderStyle: 'border-border bg-card-bg hover:border-border',
        };
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="px-4 py-3 border-b border-border/80 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold text-text-primary">
              Frequent Pharmacy Operations
            </CardTitle>
          </div>
          <Badge variant="muted" size="sm" className="text-[10px]">
            Phase 2 Workflow Preview
          </Badge>
        </CardHeader>
        <CardContent className="p-3 sm:p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {quickActions.map((action) => {
              const config = getActionConfig(action.id);
              const Icon = config.icon;

              return (
                <button
                  key={action.id}
                  onClick={() => setActiveModalAction(action)}
                  className={`flex flex-col text-left p-3 rounded-lg border transition-all group focus-ring cursor-pointer hover:shadow-card ${config.borderStyle}`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7.5 w-7.5 items-center justify-center rounded-md ${config.iconColor}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-semibold tracking-wider text-text-secondary uppercase">
                        {config.category}
                      </span>
                    </div>
                    {config.isPrimary ? (
                      <Badge variant="info" size="sm" className="text-[9px] px-1.5 py-0 font-bold">
                        Primary
                      </Badge>
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>

                  <span className="font-bold text-xs sm:text-sm text-text-primary group-hover:text-primary transition-colors">
                    {action.label}
                  </span>
                  <span className="mt-0.5 text-[11px] text-text-secondary line-clamp-1">
                    {action.description}
                  </span>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-border/50">
                    <span className="truncate">{config.targetPhase.split('(')[0].trim()}</span>
                    <span className="text-primary font-medium text-[10px]">Preview</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Honest Prototype Modal */}
      <Dialog
        open={!!activeModalAction}
        onClose={() => setActiveModalAction(null)}
        title={activeModalAction ? `${activeModalAction.label} (Workflow Preview)` : ''}
        description={activeModalAction?.description}
        footer={
          <Button variant="primary" size="sm" onClick={() => setActiveModalAction(null)}>
            Understood
          </Button>
        }
      >
        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-info/30 bg-info-light/40 p-3 flex items-start gap-3">
            <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950 space-y-1">
              <p className="font-semibold">Honest Prototype Notice</p>
              <p className="leading-relaxed">
                This workflow is targeted for{' '}
                <strong>
                  {activeModalAction ? getActionConfig(activeModalAction.id).targetPhase : ''}
                </strong>
                . In Phase 2, backend connections, database persistence, and mutations are
                intentionally inactive to preserve architectural isolation and adhere to engineering
                standards.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-page-bg p-3 text-xs space-y-1.5">
            <h5 className="font-semibold text-text-primary">What this workflow will include:</h5>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>Strict role-based authorization check (Pharmacist / Admin)</li>
              <li>Atomic database transaction with audit trail logging</li>
              <li>Input validation with Zod schema verification</li>
              <li>Real-time inventory quantity recalculation</li>
            </ul>
          </div>
        </div>
      </Dialog>
    </>
  );
}
