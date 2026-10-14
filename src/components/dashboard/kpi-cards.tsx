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
      iconBg: 'bg-emerald-50 text-emerald-600',
      accentColor: 'border-t-emerald-500',
      badge: data ? data.totalMedicines.badgeText : 'In Stock',
      badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      changeColor: 'text-emerald-600',
    },
    {
      title: 'Low Stock Items',
      urduTitle: 'کم سٹاک (فوری آرڈر)',
      value: data ? data.lowStockItems.value : kpiData.lowStockItems.toString(),
      change: data ? data.lowStockItems.change : '≤ 20 threshold',
      subtitle: data ? data.lowStockItems.subtext : 'Reorder needed',
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-600',
      accentColor: 'border-t-amber-500',
      badge: data ? data.lowStockItems.badgeText : 'Order Now',
      badgeBg: 'bg-amber-50 text-amber-700 border border-amber-200',
      changeColor: 'text-amber-600',
    },
    {
      title: 'Expiring Medicines',
      urduTitle: 'میعاد ختم (فوری چیک)',
      value: data ? data.expiringMedicines.value : kpiData.expiringMedicines.toString(),
      change: data ? data.expiringMedicines.change : '< 60 days',
      subtitle: data ? data.expiringMedicines.subtext : 'FEFO rotation',
      icon: Clock,
      iconBg: 'bg-rose-50 text-rose-600',
      accentColor: 'border-t-rose-500',
      badge: data ? data.expiringMedicines.badgeText : 'Urgent',
      badgeBg: 'bg-rose-50 text-rose-700 border border-rose-200',
      changeColor: 'text-rose-600',
    },
    {
      title: 'Pending Claims',
      urduTitle: 'صحت کارڈ کلیمز',
      value: data ? data.pendingClaims.value : kpiData.pendingClaims.toString(),
      change: data ? data.pendingClaims.change : 'PKR 482,500',
      subtitle: data ? data.pendingClaims.subtext : 'Hospital audit',
      icon: Receipt,
      iconBg: 'bg-sky-50 text-sky-600',
      accentColor: 'border-t-sky-500',
      badge: data ? data.pendingClaims.badgeText : 'In Review',
      badgeBg: 'bg-sky-50 text-sky-700 border border-sky-200',
      changeColor: 'text-sky-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`relative rounded-xl border border-border bg-white shadow-card group cursor-pointer border-t-2 ${card.accentColor} transition-all duration-200 ease-out hover:shadow-card-hover hover:border-slate-300 hover:-translate-y-0.5`}
          >
            <div className="p-4">
              {/* Header row: icon + badge */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg} transition-transform duration-200 group-hover:scale-110`}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                </div>
                <span
                  className={`${card.badgeBg} px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider`}
                >
                  {card.badge}
                </span>
              </div>

              {/* Title & Urdu subtitle */}
              <div className="mb-1.5">
                <h3 className="text-xs font-semibold text-text-primary">{card.title}</h3>
                <p className="text-[10px] text-text-muted mt-0.5" dir="rtl">
                  {card.urduTitle}
                </p>
              </div>

              {/* Value */}
              <div className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-text-primary">
                {card.value}
              </div>

              {/* Sub-info */}
              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className={`font-medium ${card.changeColor}`}>{card.change}</span>
                <span className="text-text-muted text-[11px]">{card.subtitle}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
