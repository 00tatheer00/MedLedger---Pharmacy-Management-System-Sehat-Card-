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
  iconColor: string;
  borderColor: string;
  hoverGlow: string;
  badge: string;
  badgeBg: string;
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
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    borderColor: 'border-emerald-200 hover:border-emerald-500',
    hoverGlow: 'hover:shadow-emerald-500/10',
    badge: 'Counter Action',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    id: 'qa-receive-stock',
    label: 'Receive New Stock',
    urduLabel: 'نیا سامان وصول کریں',
    description: 'Verify supplier deliveries against POs and log batch inventory into warehouse.',
    href: '/purchases',
    icon: PackagePlus,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-700',
    borderColor: 'border-teal-200 hover:border-teal-500',
    hoverGlow: 'hover:shadow-teal-500/10',
    badge: 'Store Intake',
    badgeBg: 'bg-teal-100 text-teal-800',
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
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    borderColor: 'border-blue-200 hover:border-blue-500',
    hoverGlow: 'hover:shadow-blue-500/10',
    badge: 'Registry',
    badgeBg: 'bg-blue-100 text-blue-800',
    buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    id: 'qa-review-claims',
    label: 'Sehat Card & Claims',
    urduLabel: 'صحت کارڈ اور کلیمز',
    description: 'Audit patient eligibility, review pending hospital claims, and balance billing.',
    href: '/claims',
    icon: FileCheck2,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-700',
    borderColor: 'border-purple-200 hover:border-purple-500',
    hoverGlow: 'hover:shadow-purple-500/10',
    badge: 'Finance',
    badgeBg: 'bg-purple-100 text-purple-800',
    buttonColor: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
];

export function QuickActions() {
  return (
    <Card className="border-2 border-border/80 shadow-sm">
      <CardHeader className="px-5 py-4 border-b border-border/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="text-base">⚡</span>
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-text-primary">
              Frequent Pharmacy Operations
            </CardTitle>
            <p className="text-xs text-text-secondary font-medium">
              فارمیسی کے بنیادی کام — One-click operational workflows
            </p>
          </div>
        </div>
        <Badge variant="muted" size="sm" className="font-bold hidden sm:inline-flex">
          DHQ Live Operations
        </Badge>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.id}
                href={action.href}
                className={`flex flex-col justify-between p-4 sm:p-5 rounded-xl border-2 bg-card-bg shadow-xs transition-all duration-300 ease-out group cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] ${action.borderColor} ${action.hoverGlow}`}
              >
                <div>
                  {/* Icon & Badge Header */}
                  <div className="flex items-center justify-between w-full mb-3.5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.iconBg} ${action.iconColor} group-hover:scale-105 transition-transform duration-300 shadow-xs`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2.2} />
                    </div>
                    <span
                      className={`${action.badgeBg} px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide`}
                    >
                      {action.badge}
                    </span>
                  </div>

                  {/* Urdu & English Labels */}
                  <div className="mb-1.5">
                    <h3 className="font-bold text-base text-text-primary group-hover:text-primary transition-colors duration-200">
                      {action.label}
                    </h3>
                    <p className="text-xs font-semibold text-primary/80" dir="rtl">
                      {action.urduLabel}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-4">
                    {action.description}
                  </p>
                </div>

                {/* Direct action button */}
                <div
                  className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors ${action.buttonColor}`}
                >
                  <span>Open Workflow</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
