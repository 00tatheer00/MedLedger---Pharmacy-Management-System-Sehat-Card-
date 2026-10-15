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
  cardBorder: string;
}

const actions: ActionItem[] = [
  {
    id: 'qa-dispense',
    label: '⚡ 1-Screen Quick Counter',
    urduLabel: 'فوری پرچی کاؤنٹر • بل پرنٹ کریں',
    description:
      'Instant dispensing from ward slip by Visit Number. Prints computerized invoice in 30 seconds.',
    href: '/dispensing',
    icon: ClipboardCheck,
    iconBg: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    badge: '⚡ Fastest 1-Step',
    badgeVariant: 'success',
    buttonColor:
      'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs',
    cardBorder: 'border-emerald-300/80 hover:border-emerald-500 hover:shadow-emerald-500/15',
  },
  {
    id: 'qa-receive-stock',
    label: 'Receive New Stock',
    urduLabel: 'نیا سامان و اسٹاک وصول کریں',
    description: 'Verify supplier deliveries against POs and log batch inventory into warehouse.',
    href: '/purchases',
    icon: PackagePlus,
    iconBg: 'bg-teal-100 text-teal-800 border border-teal-300',
    badge: 'Store Intake',
    badgeVariant: 'info',
    buttonColor:
      'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-xs',
    cardBorder: 'border-teal-300/80 hover:border-teal-500 hover:shadow-teal-500/15',
  },
  {
    id: 'qa-add-medicine',
    label: 'Medicine Formulary & Rates',
    urduLabel: 'ادویات و سرکاری ریٹس کا ریکارڈ',
    description:
      'Search formulary, check unit prices, reorder levels, and manage hospital medicines.',
    href: '/medicines',
    icon: Pill,
    iconBg: 'bg-blue-100 text-blue-800 border border-blue-300',
    badge: 'Registry',
    badgeVariant: 'default',
    buttonColor:
      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xs',
    cardBorder: 'border-blue-300/80 hover:border-blue-500 hover:shadow-blue-500/15',
  },
  {
    id: 'qa-review-claims',
    label: 'Sehat Card (SSP) Claims',
    urduLabel: 'صحت کارڈ کلیمز و آڈٹ فائلز',
    description: 'Audit patient eligibility, review pending hospital claims, and balance billing.',
    href: '/claims',
    icon: FileCheck2,
    iconBg: 'bg-purple-100 text-purple-800 border border-purple-300',
    badge: 'Finance',
    badgeVariant: 'muted',
    buttonColor:
      'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xs',
    cardBorder: 'border-purple-300/80 hover:border-purple-500 hover:shadow-purple-500/15',
  },
];

export function QuickActions() {
  return (
    <Card className="hover:shadow-card-hover border border-slate-200">
      <CardHeader className="px-5 py-4 border-b border-border flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="text-sm">⚡</span>
          </div>
          <div>
            <CardTitle className="text-base font-bold text-text-primary">
              Frequent Pharmacy Operations • فارمیسی کے بنیادی کام
            </CardTitle>
            <p className="text-[11px] text-text-muted">
              One-click operational workflows designed for fast hospital rush hours
            </p>
          </div>
        </div>
        <Badge variant="success" size="sm" className="hidden sm:inline-flex font-bold">
          DHQ Kohat Fast Actions
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.id}
                href={action.href}
                className={`flex flex-col justify-between p-4 rounded-xl border bg-white group cursor-pointer transition-all duration-200 ease-out hover:shadow-xl hover:-translate-y-1 hover:scale-101 ${action.cardBorder}`}
              >
                <div>
                  {/* Icon & Badge Header */}
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.iconBg} transition-transform duration-200 group-hover:scale-110 shadow-2xs`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <Badge variant={action.badgeVariant} size="sm" className="font-bold">
                      {action.badge}
                    </Badge>
                  </div>

                  {/* Urdu & English Labels */}
                  <div className="mb-1.5">
                    <h3 className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors duration-150">
                      {action.label}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium" dir="rtl">
                      {action.urduLabel}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3 font-medium">
                    {action.description}
                  </p>
                </div>

                {/* Direct action button */}
                <div
                  className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-150 ${action.buttonColor}`}
                >
                  <span>Open Workflow</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
