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
    <div className="flex h-full flex-col bg-navy text-text-on-dark w-64 border-r border-navy-dark shadow-sidebar select-none">
      {/* Brand Header */}
      <div className="shrink-0 flex h-16 items-center justify-between px-5 border-b border-navy-light/40">
        <Link
          href="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group focus-ring rounded-xl py-1"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal to-primary text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
            <Cross className="h-4.5 w-4.5 rotate-45" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-white text-lg leading-tight">
              MedLedger
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-light">
              DHQ Hospital Kohat
            </span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-text-on-dark-muted hover:text-white p-1.5 rounded-lg hover:bg-navy-light transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation list — completely hidden scrollbar, clean and smooth */}
      <nav className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-3 space-y-3">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-text-on-dark-muted/60 mb-1">
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
                      'flex items-center justify-between rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-150 focus-ring',
                      isActive
                        ? 'bg-gradient-to-r from-teal to-primary text-white shadow-sm font-bold'
                        : 'text-text-on-dark-muted hover:bg-navy-light/70 hover:text-white',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'text-white' : 'text-text-on-dark-muted',
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold leading-normal',
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-teal/25 text-teal-light border border-teal/40',
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
      <div className="shrink-0 p-3 border-t border-navy-light/30 bg-navy-dark/40">
        <div className="rounded-xl bg-navy-light/30 p-2.5 px-3 border border-navy-light/20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-light">
              System Status
            </span>
            <span className="text-xs text-text-on-dark-muted">All systems operational</span>
          </div>
          <span className="h-2 w-2 rounded-full bg-teal animate-pulse shadow-sm shadow-teal/50 shrink-0" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-navy-dark/80 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full">{content}</div>
        </div>
      )}
    </>
  );
}
