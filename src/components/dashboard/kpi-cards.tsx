import { Pill, AlertTriangle, Clock, Receipt } from 'lucide-react';
import { kpiData } from '@/lib/demo-data';
import { KpiSummary } from '@/modules/dashboard/types';

interface KpiCardsProps {
  data?: KpiSummary;
}

export function KpiCards({ data }: KpiCardsProps) {
  const cards = [
    {
      title: 'Total Medicines',
      urduTitle: 'کل ادویات (دستیاب)',
      value: data ? data.totalMedicines.value : kpiData.totalMedicines.toLocaleString(),
      change: data ? data.totalMedicines.change : '+14 items',
      subtitle: data ? data.totalMedicines.subtext : 'Active SKUs',
      icon: Pill,
      iconBg: 'bg-emerald-500/15 text-emerald-600 shadow-[0_0_16px_rgba(16,185,129,0.2)]',
      borderColor: 'border-white/70 hover:border-emerald-400/50',
      hoverGlow: 'hover:shadow-[0_20px_45px_-10px_rgba(16,185,129,0.18)]',
      accentBar: 'bg-gradient-to-r from-teal-400 to-emerald-500',
      badge: data ? data.totalMedicines.badgeText : 'In Stock',
      badgeBg: 'bg-emerald-500/12 text-emerald-800 border border-emerald-400/40 backdrop-blur-md',
      textColor: 'text-emerald-950',
    },
    {
      title: 'Low Stock Items',
      urduTitle: 'کم سٹاک (فوری آرڈر)',
      value: data ? data.lowStockItems.value : kpiData.lowStockItems.toString(),
      change: data ? data.lowStockItems.change : '≤ 20 threshold',
      subtitle: data ? data.lowStockItems.subtext : 'Reorder needed',
      icon: AlertTriangle,
      iconBg: 'bg-amber-500/15 text-amber-600 shadow-[0_0_16px_rgba(245,158,11,0.2)]',
      borderColor: 'border-white/70 hover:border-amber-400/50',
      hoverGlow: 'hover:shadow-[0_20px_45px_-10px_rgba(245,158,11,0.18)]',
      accentBar: 'bg-gradient-to-r from-amber-400 to-orange-500',
      badge: data ? data.lowStockItems.badgeText : 'Order Now',
      badgeBg: 'bg-amber-500/12 text-amber-800 border border-amber-400/40 backdrop-blur-md',
      textColor: 'text-amber-950',
    },
    {
      title: 'Expiring Medicines',
      urduTitle: 'میعاد ختم (فوری چیک)',
      value: data ? data.expiringMedicines.value : kpiData.expiringMedicines.toString(),
      change: data ? data.expiringMedicines.change : '< 60 days',
      subtitle: data ? data.expiringMedicines.subtext : 'FEFO rotation',
      icon: Clock,
      iconBg: 'bg-rose-500/15 text-rose-600 shadow-[0_0_16px_rgba(244,63,94,0.2)]',
      borderColor: 'border-white/70 hover:border-rose-400/50',
      hoverGlow: 'hover:shadow-[0_20px_45px_-10px_rgba(244,63,94,0.18)]',
      accentBar: 'bg-gradient-to-r from-rose-400 to-red-500',
      badge: data ? data.expiringMedicines.badgeText : 'Urgent',
      badgeBg: 'bg-rose-500/12 text-rose-800 border border-rose-400/40 backdrop-blur-md',
      textColor: 'text-rose-950',
    },
    {
      title: 'Pending Claims',
      urduTitle: 'صحت کارڈ کلیمز',
      value: data ? data.pendingClaims.value : kpiData.pendingClaims.toString(),
      change: data ? data.pendingClaims.change : 'PKR 482,500',
      subtitle: data ? data.pendingClaims.subtext : 'Hospital audit',
      icon: Receipt,
      iconBg: 'bg-sky-500/15 text-sky-600 shadow-[0_0_16px_rgba(14,165,233,0.2)]',
      borderColor: 'border-white/70 hover:border-sky-400/50',
      hoverGlow: 'hover:shadow-[0_20px_45px_-10px_rgba(14,165,233,0.18)]',
      accentBar: 'bg-gradient-to-r from-sky-400 to-blue-500',
      badge: data ? data.pendingClaims.badgeText : 'In Review',
      badgeBg: 'bg-sky-500/12 text-sky-800 border border-sky-400/40 backdrop-blur-md',
      textColor: 'text-sky-950',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-[26px] border border-white/80 bg-white/82 backdrop-blur-2xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.22),inset_0_1px_1.5px_0_rgba(255,255,255,0.95)] transition-all duration-300 ease-out cursor-pointer group hover:-translate-y-1.5 ${card.borderColor} ${card.hoverGlow}`}
          >
            {/* Top gradient accent bar */}
            <div className={`h-1.5 w-full ${card.accentBar}`} />

            <div className="p-5 sm:p-5.5">
              {/* Header row: icon + badge */}
              <div className="flex items-center justify-between mb-3.5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} group-hover:scale-105 transition-transform duration-300`}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <span
                  className={`${card.badgeBg} px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs`}
                >
                  {card.badge}
                </span>
              </div>

              {/* Title & Urdu subtitle */}
              <div className="mb-2">
                <h3 className="text-sm font-bold text-text-primary tracking-tight">{card.title}</h3>
                <p className="text-[11px] font-semibold text-text-muted mt-0.5" dir="rtl">
                  {card.urduTitle}
                </p>
              </div>

              {/* Value */}
              <div
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-2.5 ${card.textColor}`}
              >
                {card.value}
              </div>

              {/* Sub-info pill */}
              <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary">{card.change}</span>
                <span className="text-text-secondary font-medium">{card.subtitle}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
