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
      bgColor: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
      textColor: 'text-emerald-700',
      icon: CheckCircle2,
    },
    {
      label: 'Low Stock',
      urdu: 'کم سٹاک',
      count: inventorySummary.lowStock,
      pct: lowStockPct,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50 border-amber-200 hover:border-amber-400',
      textColor: 'text-amber-700',
      icon: AlertTriangle,
    },
    {
      label: 'Out of Stock',
      urdu: 'ختم شدہ',
      count: inventorySummary.outOfStock,
      pct: outOfStockPct,
      color: 'bg-rose-500',
      bgColor: 'bg-rose-50 border-rose-200 hover:border-rose-400',
      textColor: 'text-rose-700',
      icon: XCircle,
    },
    {
      label: 'Expired',
      urdu: 'میعاد ختم',
      count: inventorySummary.expired,
      pct: expiredPct,
      color: 'bg-slate-500',
      bgColor: 'bg-slate-50 border-slate-200 hover:border-slate-400',
      textColor: 'text-slate-700',
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
    <Card className="h-full flex flex-col justify-between border-2 border-border/80 shadow-card">
      <CardHeader className="px-6 py-5 border-b border-border/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-800 shadow-sm">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-extrabold text-text-primary">
              Stock Health & Classification
            </CardTitle>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5 font-medium">
              سٹاک کی عمومی حالت — Real-time hospital stock levels
            </p>
          </div>
        </div>
        <span className="bg-slate-100 text-slate-800 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
          {inventorySummary.total} Total SKUs
        </span>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Segmented Stock Health Bar */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-extrabold text-text-primary text-base">
              Overall Stock Reliability
            </span>
            <span className="text-emerald-700 text-base font-extrabold bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              {inStockPct}% Ready
            </span>
          </div>

          <div
            className="h-5 w-full rounded-full bg-slate-200 flex overflow-hidden shadow-inner border border-slate-300"
            role="progressbar"
            aria-valuenow={inventorySummary.inStock}
            aria-valuemin={0}
            aria-valuemax={inventorySummary.total}
            aria-label="Stock health distribution"
          >
            <div
              style={{ width: `${inStockPct}%` }}
              className="bg-emerald-500 transition-all duration-500"
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
              className="bg-slate-400 transition-all duration-500"
              title={`Expired: ${inventorySummary.expired}`}
            />
          </div>

          {/* Status Cards Grid with Big Touch Targets */}
          <div className="grid grid-cols-2 gap-4 mt-5">
            {statusCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.label}
                  className={`rounded-2xl border-2 p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${cat.bgColor}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 shrink-0 ${cat.textColor}`} aria-hidden="true" />
                      <span className="font-extrabold text-sm sm:text-base text-text-primary">
                        {cat.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-text-muted" dir="rtl">
                      {cat.urdu}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-text-primary">
                      {cat.count}
                    </span>
                    <span className="text-sm font-extrabold text-text-secondary">{cat.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Therapeutic Groups Distribution */}
        <div className="pt-5 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-extrabold text-text-primary">Top Therapeutic Groups</h4>
            <Link
              href="/inventory"
              className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Full Inventory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {categories.map((group) => (
              <div
                key={group.name}
                className="flex items-center justify-between text-sm p-2 rounded-xl hover:bg-hover-bg transition-colors"
              >
                <span className="text-text-secondary font-semibold truncate max-w-[240px]">
                  {group.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-text-primary">{group.count} SKUs</span>
                  <span className="text-xs text-text-muted font-bold w-12 text-right">
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
