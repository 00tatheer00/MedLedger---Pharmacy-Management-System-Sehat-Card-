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
      iconBg: 'bg-emerald-100 text-emerald-700',
      borderColor: 'border-emerald-200/80 hover:border-emerald-500',
      hoverGlow: 'hover:shadow-emerald-500/10',
      accentBar: 'bg-emerald-500',
      badge: data ? data.totalMedicines.badgeText : 'In Stock',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      textColor: 'text-emerald-950',
    },
    {
      title: 'Low Stock Items',
      urduTitle: 'کم سٹاک (فوری آرڈر)',
      value: data ? data.lowStockItems.value : kpiData.lowStockItems.toString(),
      change: data ? data.lowStockItems.change : '≤ 20 threshold',
      subtitle: data ? data.lowStockItems.subtext : 'Reorder needed',
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 text-amber-700',
      borderColor: 'border-amber-200/80 hover:border-amber-500',
      hoverGlow: 'hover:shadow-amber-500/10',
      accentBar: 'bg-amber-500',
      badge: data ? data.lowStockItems.badgeText : 'Order Now',
      badgeBg: 'bg-amber-100 text-amber-800',
      textColor: 'text-amber-950',
    },
    {
      title: 'Expiring Medicines',
      urduTitle: 'میعاد ختم (فوری چیک)',
      value: data ? data.expiringMedicines.value : kpiData.expiringMedicines.toString(),
      change: data ? data.expiringMedicines.change : '< 60 days',
      subtitle: data ? data.expiringMedicines.subtext : 'FEFO rotation',
      icon: Clock,
      iconBg: 'bg-rose-100 text-rose-700',
      borderColor: 'border-rose-200/80 hover:border-rose-500',
      hoverGlow: 'hover:shadow-rose-500/10',
      accentBar: 'bg-rose-500',
      badge: data ? data.expiringMedicines.badgeText : 'Urgent',
      badgeBg: 'bg-rose-100 text-rose-800',
      textColor: 'text-rose-950',
    },
    {
      title: 'Pending Claims',
      urduTitle: 'صحت کارڈ کلیمز',
      value: data ? data.pendingClaims.value : kpiData.pendingClaims.toString(),
      change: data ? data.pendingClaims.change : 'PKR 482,500',
      subtitle: data ? data.pendingClaims.subtext : 'Hospital audit',
      icon: Receipt,
      iconBg: 'bg-blue-100 text-blue-700',
      borderColor: 'border-blue-200/80 hover:border-blue-500',
      hoverGlow: 'hover:shadow-blue-500/10',
      accentBar: 'bg-blue-500',
      badge: data ? data.pendingClaims.badgeText : 'In Review',
      badgeBg: 'bg-blue-100 text-blue-800',
      textColor: 'text-blue-950',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-4.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-xl border-2 bg-card-bg shadow-sm transition-all duration-300 ease-out cursor-pointer group hover:-translate-y-1 hover:shadow-lg ${card.borderColor} ${card.hoverGlow}`}
          >
            {/* Top accent bar */}
            <div className={`h-1.5 w-full ${card.accentBar}`} />

            <div className="p-5 sm:p-5.5">
              {/* Header row: icon + badge */}
              <div className="flex items-center justify-between mb-3.5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} group-hover:scale-105 transition-transform duration-300 shadow-xs`}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <span
                  className={`${card.badgeBg} px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}
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
              <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
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
