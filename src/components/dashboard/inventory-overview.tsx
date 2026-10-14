import Link from 'next/link';
import { Package, CheckCircle2, AlertTriangle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { inventorySummary } from '@/lib/demo-data';

export function InventoryOverview() {
  const inStockPct = ((inventorySummary.inStock / inventorySummary.total) * 100).toFixed(1);
  const lowStockPct = ((inventorySummary.lowStock / inventorySummary.total) * 100).toFixed(1);
  const outOfStockPct = ((inventorySummary.outOfStock / inventorySummary.total) * 100).toFixed(1);
  const expiredPct = ((inventorySummary.expired / inventorySummary.total) * 100).toFixed(1);

  const statusCategories = [
    {
      label: 'In Stock',
      urdu: 'دستیاب',
      count: inventorySummary.inStock,
      pct: inStockPct,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 border-emerald-200',
      textColor: 'text-emerald-700',
      pctColor: 'text-emerald-600',
      icon: CheckCircle2,
    },
    {
      label: 'Low Stock',
      urdu: 'کم سٹاک',
      count: inventorySummary.lowStock,
      pct: lowStockPct,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-700',
      pctColor: 'text-amber-600',
      icon: AlertTriangle,
    },
    {
      label: 'Out of Stock',
      urdu: 'ختم شدہ',
      count: inventorySummary.outOfStock,
      pct: outOfStockPct,
      color: 'bg-rose-500',
      bgColor: 'bg-rose-50 border-rose-200',
      textColor: 'text-rose-700',
      pctColor: 'text-rose-600',
      icon: XCircle,
    },
    {
      label: 'Expired',
      urdu: 'میعاد ختم',
      count: inventorySummary.expired,
      pct: expiredPct,
      color: 'bg-slate-400',
      bgColor: 'bg-slate-50 border-slate-200',
      textColor: 'text-slate-700',
      pctColor: 'text-slate-500',
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
      <CardHeader className="px-5 py-4 border-b border-border flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-text-primary">
              Stock Health
            </CardTitle>
            <p className="text-[11px] text-text-muted">سٹاک کی عمومی حالت</p>
          </div>
        </div>
        <span className="bg-slate-100 text-text-secondary border border-border px-2 py-0.5 rounded-md text-[11px] font-medium">
          {inventorySummary.total} SKUs
        </span>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Segmented Stock Health Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-text-primary text-sm">Overall Reliability</span>
            <span className="text-emerald-700 text-xs font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {inStockPct}% Ready
            </span>
          </div>

          <div
            className="h-2.5 w-full rounded-full bg-slate-100 flex overflow-hidden"
            role="progressbar"
            aria-valuenow={inventorySummary.inStock}
            aria-valuemin={0}
            aria-valuemax={inventorySummary.total}
            aria-label="Stock health distribution"
          >
            <div
              style={{ width: `${inStockPct}%` }}
              className="bg-emerald-500 rounded-l-full transition-all duration-500"
              title={`In Stock: ${inventorySummary.inStock}`}
            />
            <div
              style={{ width: `${lowStockPct}%` }}
              className="bg-amber-400 transition-all duration-500"
              title={`Low Stock: ${inventorySummary.lowStock}`}
            />
            <div
              style={{ width: `${outOfStockPct}%` }}
              className="bg-rose-500 transition-all duration-500"
              title={`Out of Stock: ${inventorySummary.outOfStock}`}
            />
            <div
              style={{ width: `${expiredPct}%` }}
              className="bg-slate-400 rounded-r-full transition-all duration-500"
              title={`Expired: ${inventorySummary.expired}`}
            />
          </div>

          {/* Status Cards Grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {statusCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.label}
                  className={`rounded-lg border p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 ease-out hover:shadow-sm hover:-translate-y-0.5 ${cat.bgColor}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 ${cat.textColor}`}
                        aria-hidden="true"
                      />
                      <span className={`font-medium text-xs ${cat.textColor}`}>{cat.label}</span>
                    </div>
                    <span className="text-[10px] text-text-muted" dir="rtl">
                      {cat.urdu}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl sm:text-2xl font-bold text-text-primary">
                      {cat.count}
                    </span>
                    <span className={`text-xs font-medium ${cat.pctColor}`}>{cat.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Therapeutic Groups Distribution */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-text-primary">Top Therapeutic Groups</h4>
            <Link
              href="/inventory"
              className="text-xs font-medium text-primary hover:text-primary-hover hover:underline flex items-center gap-1 transition-colors duration-150"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-1">
            {categories.map((group) => (
              <div
                key={group.name}
                className="flex items-center justify-between text-xs p-1.5 rounded-md transition-all duration-150 hover:bg-slate-50 hover:pl-2.5"
              >
                <span className="text-text-secondary truncate max-w-[200px]">{group.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{group.count}</span>
                  <span className="text-[11px] text-text-muted font-mono w-10 text-right">
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
