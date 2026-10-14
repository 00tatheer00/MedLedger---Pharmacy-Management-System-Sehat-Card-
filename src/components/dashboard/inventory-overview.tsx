import { Package, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { inventorySummary } from '@/lib/demo-data';

export function InventoryOverview() {
  const inStockPct = ((inventorySummary.inStock / inventorySummary.total) * 100).toFixed(1);
  const lowStockPct = ((inventorySummary.lowStock / inventorySummary.total) * 100).toFixed(1);
  const outOfStockPct = ((inventorySummary.outOfStock / inventorySummary.total) * 100).toFixed(1);
  const expiredPct = ((inventorySummary.expired / inventorySummary.total) * 100).toFixed(1);

  const statusCategories = [
    {
      label: 'In Stock',
      count: inventorySummary.inStock,
      pct: inStockPct,
      color: 'bg-success',
      textColor: 'text-success',
      icon: CheckCircle2,
    },
    {
      label: 'Low Stock',
      count: inventorySummary.lowStock,
      pct: lowStockPct,
      color: 'bg-warning',
      textColor: 'text-warning',
      icon: AlertTriangle,
    },
    {
      label: 'Out of Stock',
      count: inventorySummary.outOfStock,
      pct: outOfStockPct,
      color: 'bg-danger',
      textColor: 'text-danger',
      icon: XCircle,
    },
    {
      label: 'Expired',
      count: inventorySummary.expired,
      pct: expiredPct,
      color: 'bg-text-muted',
      textColor: 'text-text-muted',
      icon: Clock,
    },
  ];

  const categories = [
    { name: 'Antibiotics & Antimicrobials', count: 342, share: '27.4%' },
    { name: 'Cardiovascular & Antihypertensives', count: 215, share: '17.2%' },
    { name: 'Analgesics & Anti-inflammatory', count: 189, share: '15.2%' },
    { name: 'Diabetes & Endocrine', count: 164, share: '13.2%' },
    { name: 'IV Fluids & Electrolytes', count: 142, share: '11.4%' },
    { name: 'Respiratory & Others', count: 195, share: '15.6%' },
  ];

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="px-4 py-3 border-b border-border/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-bold text-text-primary">
            Inventory Health & Classification
          </CardTitle>
        </div>
        <Badge variant="default" size="sm" className="text-[10px]">
          {inventorySummary.total} SKUs • Simulated
        </Badge>
      </CardHeader>

      <CardContent className="p-3 sm:p-3.5 space-y-3.5">
        {/* Segmented Stock Health Bar */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-text-primary text-xs">
              Stock Health Distribution
            </span>
            <span className="text-text-secondary text-[11px] font-mono">
              {inStockPct}% healthy stock
            </span>
          </div>
          <div
            className="h-2.5 w-full rounded-full bg-border-light flex overflow-hidden shadow-2xs"
            role="progressbar"
            aria-valuenow={inventorySummary.inStock}
            aria-valuemin={0}
            aria-valuemax={inventorySummary.total}
            aria-label="Stock health distribution"
          >
            <div
              style={{ width: `${inStockPct}%` }}
              className="bg-success transition-all duration-300"
              title={`In Stock: ${inventorySummary.inStock}`}
            />
            <div
              style={{ width: `${lowStockPct}%` }}
              className="bg-warning transition-all duration-300"
              title={`Low Stock: ${inventorySummary.lowStock}`}
            />
            <div
              style={{ width: `${outOfStockPct}%` }}
              className="bg-danger transition-all duration-300"
              title={`Out of Stock: ${inventorySummary.outOfStock}`}
            />
            <div
              style={{ width: `${expiredPct}%` }}
              className="bg-text-muted transition-all duration-300"
              title={`Expired: ${inventorySummary.expired}`}
            />
          </div>

          {/* Status Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
            {statusCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.label}
                  className="rounded-lg border border-border/80 bg-page-bg/60 p-2 flex flex-col"
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                    <Icon className={`h-2.5 w-2.5 shrink-0 ${cat.textColor}`} aria-hidden="true" />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-text-primary">{cat.count}</span>
                    <span className="text-[10px] font-mono text-text-muted">{cat.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Therapeutic Groups Distribution */}
        <div className="pt-2.5 border-t border-border">
          <h4 className="text-xs font-semibold text-text-primary mb-2">Top Therapeutic Groups</h4>
          <div className="space-y-1.5">
            {categories.map((group) => (
              <div key={group.name} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary truncate max-w-[200px] text-[11px]">
                  {group.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary text-[11px]">{group.count}</span>
                  <span className="text-[10px] text-text-muted font-mono w-9 text-right">
                    {group.share}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
