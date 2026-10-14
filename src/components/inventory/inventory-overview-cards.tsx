import { Package, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { InventoryOverviewSummary } from '@/modules/inventory/types';

interface InventoryOverviewCardsProps {
  summary: InventoryOverviewSummary;
}

export function InventoryOverviewCards({ summary }: InventoryOverviewCardsProps) {
  const cards = [
    {
      title: 'Total Stock on Hand',
      value: summary.total_units_on_hand.toLocaleString(),
      subtitle: `${summary.available_units.toLocaleString()} available for dispensing`,
      icon: Package,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-border/80',
    },
    {
      title: 'Low Stock Alert Items',
      value: summary.low_stock_medicines_count.toString(),
      subtitle: `${summary.out_of_stock_medicines_count} medicines completely out of stock`,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200/80',
    },
    {
      title: 'Near-Expiry Batches (60d)',
      value: summary.near_expiry_batches_count.toString(),
      subtitle: `${summary.expired_batches_count} batches already expired`,
      icon: Clock,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200/80',
    },
    {
      title: 'Quarantined / Expired Units',
      value: (summary.quarantined_units + summary.expired_units).toLocaleString(),
      subtitle: `${summary.quarantined_units} quarantined, ${summary.expired_units} expired`,
      icon: ShieldAlert,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200/80',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Card key={i} className={`border ${c.border} shadow-xs`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted">{c.title}</p>
                <p className="text-2xl font-bold font-mono text-text-primary mt-1">{c.value}</p>
                <p className="text-[11px] text-text-secondary mt-0.5">{c.subtitle}</p>
              </div>
              <div className={`p-3 rounded-xl ${c.bg} ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
