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
    description: 'Issue prescribed medicines to OPD/IPD patients with real-time stock reduction.',
    href: '/dispensing',
    icon: ClipboardCheck,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    borderColor: 'border-emerald-200 hover:border-emerald-500',
    hoverGlow: 'hover:shadow-emerald-500/15',
    badge: 'Counter Action',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    id: 'qa-receive-stock',
    label: 'Receive New Stock',
    urduLabel: 'نیا سامان وصول کریں',
    description:
      'Verify supplier deliveries against Purchase Orders and log batches into inventory.',
    href: '/purchases',
    icon: PackagePlus,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-700',
    borderColor: 'border-teal-200 hover:border-teal-500',
    hoverGlow: 'hover:shadow-teal-500/15',
    badge: 'Store Intake',
    badgeBg: 'bg-teal-100 text-teal-800',
    buttonColor: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
  {
    id: 'qa-add-medicine',
    label: 'Medicine Catalog',
    urduLabel: 'ادویات کا ریکارڈ',
    description: 'Search formulary, check unit prices, reorder levels, and register new drugs.',
    href: '/medicines',
    icon: Pill,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    borderColor: 'border-blue-200 hover:border-blue-500',
    hoverGlow: 'hover:shadow-blue-500/15',
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
    hoverGlow: 'hover:shadow-purple-500/15',
    badge: 'Finance',
    badgeBg: 'bg-purple-100 text-purple-800',
    buttonColor: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
];

export function QuickActions() {
  return (
    <Card className="border-2 border-border/80 shadow-card">
      <CardHeader className="px-6 py-5 border-b border-border/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <CardTitle className="text-xl font-extrabold text-text-primary">
              Frequent Pharmacy Operations
            </CardTitle>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5 font-medium">
              فارمیسی کے بنیادی کام — One-click access to operational workflows
            </p>
          </div>
        </div>
        <Badge variant="muted" size="md" className="font-bold hidden sm:inline-flex">
          DHQ Live Operations
        </Badge>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.id}
                href={action.href}
                className={`flex flex-col justify-between p-6 rounded-2xl border-2 bg-card-bg shadow-sm transition-all duration-300 ease-out group cursor-pointer hover:-translate-y-1.5 hover:shadow-xl active:scale-[0.98] ${action.borderColor} ${action.hoverGlow}`}
              >
                <div>
                  {/* Icon & Badge Header */}
                  <div className="flex items-center justify-between w-full mb-5">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl ${action.iconBg} ${action.iconColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                    >
                      <Icon className="h-8 w-8" strokeWidth={2.2} />
                    </div>
                    <span
                      className={`${action.badgeBg} px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide`}
                    >
                      {action.badge}
                    </span>
                  </div>

                  {/* Urdu & English Labels */}
                  <div className="mb-2">
                    <h3 className="font-extrabold text-lg sm:text-xl text-text-primary group-hover:text-primary transition-colors duration-200">
                      {action.label}
                    </h3>
                    <p className="text-sm font-bold text-primary/80 mt-0.5" dir="rtl">
                      {action.urduLabel}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-6">
                    {action.description}
                  </p>
                </div>

                {/* Direct action button */}
                <div
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors ${action.buttonColor}`}
                >
                  <span>Open Workflow</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
