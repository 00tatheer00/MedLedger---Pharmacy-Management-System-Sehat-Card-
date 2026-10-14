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
      iconBg:
        'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_18px_rgba(16,185,129,0.35)]',
      borderColor: 'border-white/20 hover:border-emerald-400/50',
      hoverGlow: 'hover:shadow-[0_30px_60px_rgba(16,185,129,0.3)]',
      accentBar: 'bg-gradient-to-r from-teal-400 to-emerald-400',
      badge: data ? data.totalMedicines.badgeText : 'In Stock',
      badgeBg:
        'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.25)]',
      textColor: 'text-white',
    },
    {
      title: 'Low Stock Items',
      urduTitle: 'کم سٹاک (فوری آرڈر)',
      value: data ? data.lowStockItems.value : kpiData.lowStockItems.toString(),
      change: data ? data.lowStockItems.change : '≤ 20 threshold',
      subtitle: data ? data.lowStockItems.subtext : 'Reorder needed',
      icon: AlertTriangle,
      iconBg:
        'bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-[0_0_18px_rgba(245,158,11,0.35)]',
      borderColor: 'border-white/20 hover:border-amber-400/50',
      hoverGlow: 'hover:shadow-[0_30px_60px_rgba(245,158,11,0.3)]',
      accentBar: 'bg-gradient-to-r from-amber-400 to-orange-500',
      badge: data ? data.lowStockItems.badgeText : 'Order Now',
      badgeBg:
        'bg-amber-500/20 text-amber-300 border border-amber-400/40 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      textColor: 'text-white',
    },
    {
      title: 'Expiring Medicines',
      urduTitle: 'میعاد ختم (فوری چیک)',
      value: data ? data.expiringMedicines.value : kpiData.expiringMedicines.toString(),
      change: data ? data.expiringMedicines.change : '< 60 days',
      subtitle: data ? data.expiringMedicines.subtext : 'FEFO rotation',
      icon: Clock,
      iconBg:
        'bg-rose-500/20 text-rose-300 border border-rose-400/30 shadow-[0_0_18px_rgba(244,63,94,0.35)]',
      borderColor: 'border-white/20 hover:border-rose-400/50',
      hoverGlow: 'hover:shadow-[0_30px_60px_rgba(244,63,94,0.3)]',
      accentBar: 'bg-gradient-to-r from-rose-400 to-pink-500',
      badge: data ? data.expiringMedicines.badgeText : 'Urgent',
      badgeBg:
        'bg-rose-500/20 text-rose-300 border border-rose-400/40 backdrop-blur-md shadow-[0_0_12px_rgba(244,63,94,0.25)]',
      textColor: 'text-white',
    },
    {
      title: 'Pending Claims',
      urduTitle: 'صحت کارڈ کلیمز',
      value: data ? data.pendingClaims.value : kpiData.pendingClaims.toString(),
      change: data ? data.pendingClaims.change : 'PKR 482,500',
      subtitle: data ? data.pendingClaims.subtext : 'Hospital audit',
      icon: Receipt,
      iconBg:
        'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-[0_0_18px_rgba(14,165,233,0.35)]',
      borderColor: 'border-white/20 hover:border-sky-400/50',
      hoverGlow: 'hover:shadow-[0_30px_60px_rgba(14,165,233,0.3)]',
      accentBar: 'bg-gradient-to-r from-sky-400 to-blue-500',
      badge: data ? data.pendingClaims.badgeText : 'In Review',
      badgeBg:
        'bg-sky-500/20 text-sky-300 border border-sky-400/40 backdrop-blur-md shadow-[0_0_12px_rgba(14,165,233,0.25)]',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-[28px] border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.45),inset_0_1px_1px_0_rgba(255,255,255,0.25)] transition-all duration-300 ease-out cursor-pointer group hover:-translate-y-1.5 ${card.borderColor} ${card.hoverGlow}`}
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
                <h3 className="text-sm font-bold text-white tracking-tight">{card.title}</h3>
                <p className="text-[11px] font-semibold text-white/60 mt-0.5" dir="rtl">
                  {card.urduTitle}
                </p>
              </div>

              {/* Value */}
              <div className="text-3xl sm:text-4xl font-black tracking-tight mb-2.5 text-white">
                {card.value}
              </div>

              {/* Sub-info pill */}
              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-teal-300">{card.change}</span>
                <span className="text-white/60 font-medium">{card.subtitle}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
