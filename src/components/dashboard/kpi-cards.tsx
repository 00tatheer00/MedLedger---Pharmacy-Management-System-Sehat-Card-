import { Pill, AlertTriangle, Clock, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { kpiData } from '@/lib/demo-data';
import { KpiSummary } from '@/modules/dashboard/types';

interface KpiCardsProps {
  data?: KpiSummary;
}

export function KpiCards({ data }: KpiCardsProps) {
  const cards = [
    {
      title: 'Total Medicines',
      value: data ? data.totalMedicines.value : kpiData.totalMedicines.toLocaleString(),
      change: data ? data.totalMedicines.change : '+14 items',
      subtitle: data ? data.totalMedicines.subtext : 'Catalog SKUs',
      icon: Pill,
      iconBg: 'bg-primary-light text-primary',
      badge: data ? data.totalMedicines.badgeText : 'Active',
      badgeVariant: 'info' as const,
    },
    {
      title: 'Low Stock Items',
      value: data ? data.lowStockItems.value : kpiData.lowStockItems.toString(),
      change: data ? data.lowStockItems.change : '<= 20 threshold',
      subtitle: data ? data.lowStockItems.subtext : 'Reorder needed',
      icon: AlertTriangle,
      iconBg: 'bg-warning-light/60 text-warning',
      badge: data ? data.lowStockItems.badgeText : 'Action',
      badgeVariant: 'warning' as const,
    },
    {
      title: 'Expiring Medicines',
      value: data ? data.expiringMedicines.value : kpiData.expiringMedicines.toString(),
      change: data ? data.expiringMedicines.change : '< 60 days',
      subtitle: data ? data.expiringMedicines.subtext : 'FEFO rotation',
      icon: Clock,
      iconBg: 'bg-danger-light/60 text-danger',
      badge: data ? data.expiringMedicines.badgeText : 'Urgent',
      badgeVariant: 'danger' as const,
    },
    {
      title: 'Pending Claims',
      value: data ? data.pendingClaims.value : kpiData.pendingClaims.toString(),
      change: data ? data.pendingClaims.change : 'PKR 482,500',
      subtitle: data ? data.pendingClaims.subtext : 'Hospital audit',
      icon: Receipt,
      iconBg: 'bg-blue-light/10 text-primary',
      badge: data ? data.pendingClaims.badgeText : 'In Review',
      badgeVariant: 'default' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="hover:shadow-card-hover transition-all">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  {card.title}
                </span>
                <Badge variant={card.badgeVariant} size="sm">
                  {card.badge}
                </Badge>
              </div>

              <div className="mt-2.5 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold tracking-tight text-text-primary">
                    {card.value}
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-text-secondary">{card.change}</span>
                    <span className="text-text-muted">• {card.subtitle}</span>
                  </div>
                </div>

                <div
                  className={`flex h-7.5 w-7.5 items-center justify-center rounded-lg ${card.iconBg} shrink-0`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
