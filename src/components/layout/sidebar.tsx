'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  FileText,
  ClipboardCheck,
  Pill,
  Package,
  Building2,
  ShoppingCart,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  X,
  Cross,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Clinical & Dispensing',
    items: [
      { label: 'Patients', href: '/patients', icon: Users },
      { label: 'Admissions', href: '/admissions', icon: BedDouble },
      { label: 'Prescriptions', href: '/prescriptions', icon: FileText },
      { label: 'Dispensing', href: '/dispensing', icon: ClipboardCheck },
    ],
  },
  {
    title: 'Inventory & Supply',
    items: [
      { label: 'Medicines', href: '/medicines', icon: Pill },
      { label: 'Inventory', href: '/inventory', icon: Package },
      { label: 'Suppliers', href: '/suppliers', icon: Building2 },
      { label: 'Purchases', href: '/purchases', icon: ShoppingCart },
    ],
  },
  {
    title: 'Finance & Governance',
    items: [
      { label: 'Claims & Billing', href: '/claims', icon: Receipt },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', href: '/notifications', icon: Bell, badge: '5' },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col bg-navy text-white w-[260px] border-r border-slate-800 select-none fixed top-0 bottom-0">
      {/* Brand Header */}
      <div className="shrink-0 flex h-14 items-center justify-between px-4 border-b border-slate-800">
        <Link
          href="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group focus-ring rounded-lg py-1"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white transition-colors duration-150 group-hover:bg-teal-500">
            <Cross className="h-4 w-4 rotate-45 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white text-[15px] leading-tight">
              MedLedger
            </span>
            <span className="text-[10px] uppercase font-medium tracking-wider text-slate-500">
              DHQ Hospital Kohat
            </span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition-colors duration-150"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto no-scrollbar p-2.5 space-y-3">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <h4 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {group.title}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ease-out focus-ring',
                      isActive
                        ? 'bg-teal-600/15 text-teal-400 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 hover:pl-3.5',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors duration-150',
                          isActive ? 'text-teal-400' : 'text-slate-500',
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-normal',
                          isActive ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-400',
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer info box */}
      <div className="shrink-0 p-3 space-y-2 border-t border-slate-800">
        <div className="rounded-lg bg-slate-800 p-2.5 px-3 border border-slate-700 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              System Status
            </span>
            <span className="text-xs text-slate-400">All systems operational</span>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed top-0 bottom-0 left-0 z-30 w-[260px] h-screen">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={onCloseMobile} aria-hidden="true" />
          <div className="relative z-10 flex h-full">{content}</div>
        </div>
      )}
    </>
  );
}
