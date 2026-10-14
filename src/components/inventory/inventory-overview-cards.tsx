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
      color: 'text-teal-700',
      bg: 'bg-teal-50',
      border: 'border-slate-200 hover:border-teal-300',
    },
    {
      title: 'Low Stock Alert Items',
      value: summary.low_stock_medicines_count.toString(),
      subtitle: `${summary.out_of_stock_medicines_count} medicines completely out of stock`,
      icon: AlertTriangle,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-slate-200 hover:border-amber-300',
    },
    {
      title: 'Near-Expiry Batches (60d)',
      value: summary.near_expiry_batches_count.toString(),
      subtitle: `${summary.expired_batches_count} batches already expired`,
      icon: Clock,
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-slate-200 hover:border-rose-300',
    },
    {
      title: 'Quarantined / Expired Units',
      value: (summary.quarantined_units + summary.expired_units).toLocaleString(),
      subtitle: `${summary.quarantined_units} quarantined, ${summary.expired_units} expired`,
      icon: ShieldAlert,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
      border: 'border-slate-200 hover:border-purple-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Card
            key={i}
            className={`border bg-white shadow-card transition-all duration-200 hover-lift ${c.border} cursor-default`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {c.title}
                </p>
                <p className="text-2xl font-bold font-mono text-text-primary mt-1.5">{c.value}</p>
                <p className="text-xs text-text-secondary mt-1">{c.subtitle}</p>
              </div>
              <div
                className={`p-3 rounded-lg ${c.bg} ${c.color} border border-slate-100 shrink-0 transition-transform duration-200 group-hover:scale-105`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
