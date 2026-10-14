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
    iconBg:
      'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_16px_rgba(16,185,129,0.3)]',
    iconColor: 'text-emerald-300',
    borderColor: 'border-white/15 hover:border-emerald-400/50',
    hoverGlow: 'hover:shadow-[0_24px_50px_rgba(16,185,129,0.25)]',
    badge: 'Counter Action',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
    buttonColor: 'bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-100 border-emerald-400/40',
  },
  {
    id: 'qa-receive-stock',
    label: 'Receive New Stock',
    urduLabel: 'نیا سامان وصول کریں',
    description: 'Verify supplier deliveries against POs and log batch inventory into warehouse.',
    href: '/purchases',
    icon: PackagePlus,
    iconBg:
      'bg-teal-500/20 text-teal-300 border border-teal-400/30 shadow-[0_0_16px_rgba(20,184,166,0.3)]',
    iconColor: 'text-teal-300',
    borderColor: 'border-white/15 hover:border-teal-400/50',
    hoverGlow: 'hover:shadow-[0_24px_50px_rgba(20,184,166,0.25)]',
    badge: 'Store Intake',
    badgeBg: 'bg-teal-500/20 text-teal-300 border border-teal-400/40',
    buttonColor: 'bg-teal-500/30 hover:bg-teal-500/50 text-teal-100 border-teal-400/40',
  },
  {
    id: 'qa-add-medicine',
    label: 'Medicine Catalog',
    urduLabel: 'ادویات کا ریکارڈ',
    description:
      'Search formulary, check unit prices, reorder levels, and manage hospital medicines.',
    href: '/medicines',
    icon: Pill,
    iconBg:
      'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_16px_rgba(6,182,212,0.3)]',
    iconColor: 'text-cyan-300',
    borderColor: 'border-white/15 hover:border-cyan-400/50',
    hoverGlow: 'hover:shadow-[0_24px_50px_rgba(6,182,212,0.25)]',
    badge: 'Registry',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40',
    buttonColor: 'bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-100 border-cyan-400/40',
  },
  {
    id: 'qa-review-claims',
    label: 'Sehat Card & Claims',
    urduLabel: 'صحت کارڈ اور کلیمز',
    description: 'Audit patient eligibility, review pending hospital claims, and balance billing.',
    href: '/claims',
    icon: FileCheck2,
    iconBg:
      'bg-purple-500/20 text-purple-300 border border-purple-400/30 shadow-[0_0_16px_rgba(168,85,247,0.3)]',
    iconColor: 'text-purple-300',
    borderColor: 'border-white/15 hover:border-purple-400/50',
    hoverGlow: 'hover:shadow-[0_24px_50px_rgba(168,85,247,0.25)]',
    badge: 'Finance',
    badgeBg: 'bg-purple-500/20 text-purple-300 border border-purple-400/40',
    buttonColor: 'bg-purple-500/30 hover:bg-purple-500/50 text-purple-100 border-purple-400/40',
  },
];

export function QuickActions() {
  return (
    <Card className="border border-white/20 border-t-white/40 bg-white/[0.08] backdrop-blur-3xl rounded-[28px] shadow-[0_30px_60px_rgba(0,0,0,0.45),inset_0_1px_1px_0_rgba(255,255,255,0.25)] text-white">
      <CardHeader className="px-5 py-4 border-b border-white/10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 shadow-[0_0_14px_rgba(20,184,166,0.3)]">
            <span className="text-base">⚡</span>
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-white">
              Frequent Pharmacy Operations
            </CardTitle>
            <p className="text-xs text-white/70 font-medium">
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
                className={`flex flex-col justify-between p-4.5 sm:p-5 rounded-[24px] border border-white/15 border-t-white/35 bg-white/[0.06] hover:bg-white/[0.14] backdrop-blur-2xl shadow-xs transition-all duration-300 ease-out group cursor-pointer hover:-translate-y-1.5 hover:shadow-apple-float ios-press ${action.borderColor} ${action.hoverGlow}`}
              >
                <div>
                  {/* Icon & Badge Header */}
                  <div className="flex items-center justify-between w-full mb-3.5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.iconBg} group-hover:scale-105 transition-transform duration-300 shadow-xs`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2.2} />
                    </div>
                    <span
                      className={`${action.badgeBg} px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide backdrop-blur-md shadow-2xs`}
                    >
                      {action.badge}
                    </span>
                  </div>

                  {/* Urdu & English Labels */}
                  <div className="mb-1.5">
                    <h3 className="font-bold text-base text-white group-hover:text-teal-300 transition-colors duration-200">
                      {action.label}
                    </h3>
                    <p className="text-xs font-semibold text-teal-300/80" dir="rtl">
                      {action.urduLabel}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-white/70 leading-relaxed line-clamp-2 mb-4">
                    {action.description}
                  </p>
                </div>

                {/* Direct action button */}
                <div
                  className={`w-full py-2.5 px-3.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors ios-press border ${action.buttonColor}`}
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
