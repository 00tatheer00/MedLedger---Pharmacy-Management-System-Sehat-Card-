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
    <Card className="h-full flex flex-col justify-between border border-white/80 bg-white/82 backdrop-blur-2xl rounded-[28px] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.22),inset_0_1px_1.5px_0_rgba(255,255,255,0.95)]">
      <CardHeader className="px-5 py-4 border-b border-border/50 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal shadow-[0_0_14px_rgba(20,184,166,0.25)]">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-text-primary">Stock Health</CardTitle>
            <p className="text-xs text-text-secondary font-medium">سٹاک کی عمومی حالت</p>
          </div>
        </div>
        <span className="bg-slate-500/10 text-slate-800 border border-slate-300/40 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-2xs">
          {inventorySummary.total} SKUs
        </span>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Segmented Stock Health Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-text-primary text-sm">Overall Reliability</span>
            <span className="text-emerald-700 text-xs font-bold bg-emerald-500/15 px-3 py-0.5 rounded-full border border-emerald-400/40 backdrop-blur-md shadow-2xs">
              {inStockPct}% Ready
            </span>
          </div>

          <div
            className="h-3.5 w-full rounded-full bg-slate-200/70 flex overflow-hidden shadow-inner border border-white/60 p-0.5 backdrop-blur-md"
            role="progressbar"
            aria-valuenow={inventorySummary.inStock}
            aria-valuemin={0}
            aria-valuemax={inventorySummary.total}
            aria-label="Stock health distribution"
          >
            <div
              style={{ width: `${inStockPct}%` }}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-500"
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
          <div className="grid grid-cols-2 gap-3 mt-3.5">
            {statusCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.label}
                  className={`rounded-[20px] border border-white/70 bg-white/60 backdrop-blur-xl p-3 sm:p-3.5 flex flex-col justify-between hover:bg-white/85 hover:shadow-apple-float hover:-translate-y-1 transition-all duration-300 cursor-pointer ios-press`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-4 w-4 shrink-0 ${cat.textColor}`} aria-hidden="true" />
                      <span className="font-bold text-xs sm:text-sm text-text-primary">
                        {cat.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-text-muted" dir="rtl">
                      {cat.urdu}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">
                      {cat.count}
                    </span>
                    <span className="text-xs font-bold text-text-secondary">{cat.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Therapeutic Groups Distribution */}
        <div className="pt-3.5 border-t border-border">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-sm font-bold text-text-primary">Top Therapeutic Groups</h4>
            <Link
              href="/inventory"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {categories.map((group) => (
              <div
                key={group.name}
                className="flex items-center justify-between text-xs sm:text-sm p-1.5 rounded-lg hover:bg-hover-bg transition-colors"
              >
                <span className="text-text-secondary font-medium truncate max-w-[200px]">
                  {group.name}
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-text-primary">{group.count}</span>
                  <span className="text-xs text-text-muted font-mono w-10 text-right font-medium">
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
