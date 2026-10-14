'use client';

import Link from 'next/link';
import { Pill, PackagePlus, ClipboardCheck, FileCheck2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActionItem {
  id: string;
  label: string;
  urduLabel: string;
  description: string;
  href: string;
  icon: typeof Pill;
  iconBg: string;
  badge: string;
  badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  buttonColor: string;
}

const actions: ActionItem[] = [
  {
    id: 'qa-dispense',
    label: 'Dispense Medicine',
    urduLabel: 'دوائی جاری کریں',
    description: 'Issue prescribed medicines to OPD/IPD patients with real-time stock deduction.',
    href: '/dispensing',
    icon: ClipboardCheck,
    iconBg: 'bg-emerald-50 text-emerald-600',
    badge: 'Counter Action',
    badgeVariant: 'success',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    id: 'qa-receive-stock',
    label: 'Receive New Stock',
    urduLabel: 'نیا سامان وصول کریں',
    description: 'Verify supplier deliveries against POs and log batch inventory into warehouse.',
    href: '/purchases',
    icon: PackagePlus,
    iconBg: 'bg-teal-50 text-teal-600',
    badge: 'Store Intake',
    badgeVariant: 'info',
    buttonColor: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
  {
    id: 'qa-add-medicine',
    label: 'Medicine Catalog',
    urduLabel: 'ادویات کا ریکارڈ',
    description:
      'Search formulary, check unit prices, reorder levels, and manage hospital medicines.',
    href: '/medicines',
    icon: Pill,
    iconBg: 'bg-blue-50 text-blue-600',
    badge: 'Registry',
    badgeVariant: 'default',
    buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    id: 'qa-review-claims',
    label: 'Sehat Card & Claims',
    urduLabel: 'صحت کارڈ اور کلیمز',
    description: 'Audit patient eligibility, review pending hospital claims, and balance billing.',
    href: '/claims',
    icon: FileCheck2,
    iconBg: 'bg-purple-50 text-purple-600',
    badge: 'Finance',
    badgeVariant: 'muted',
    buttonColor: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
];

export function QuickActions() {
  return (
    <Card className="hover:shadow-card-hover">
      <CardHeader className="px-5 py-4 border-b border-border flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <span className="text-sm">⚡</span>
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-text-primary">
              Frequent Pharmacy Operations
            </CardTitle>
            <p className="text-[11px] text-text-muted">
              فارمیسی کے بنیادی کام — One-click operational workflows
            </p>
          </div>
        </div>
        <Badge variant="muted" size="sm" className="hidden sm:inline-flex">
          DHQ Live Operations
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.id}
                href={action.href}
                className="flex flex-col justify-between p-4 rounded-lg border border-border bg-white group cursor-pointer transition-all duration-200 ease-out hover:shadow-card-hover hover:border-slate-300 hover:-translate-y-0.5"
              >
                <div>
                  {/* Icon & Badge Header */}
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.iconBg} transition-transform duration-200 group-hover:scale-110`}
                    >
                      <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                    </div>
                    <Badge variant={action.badgeVariant} size="sm">
                      {action.badge}
                    </Badge>
                  </div>

                  {/* Urdu & English Labels */}
                  <div className="mb-1.5">
                    <h3 className="font-semibold text-sm text-text-primary group-hover:text-primary transition-colors duration-150">
                      {action.label}
                    </h3>
                    <p className="text-[11px] text-text-muted" dir="rtl">
                      {action.urduLabel}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">
                    {action.description}
                  </p>
                </div>

                {/* Direct action button */}
                <div
                  className={`w-full py-1.5 px-3 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all duration-150 ${action.buttonColor}`}
                >
                  <span>Open Workflow</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
