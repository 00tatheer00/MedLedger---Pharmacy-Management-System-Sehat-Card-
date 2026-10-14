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
    <div className="flex h-full flex-col justify-between bg-navy text-text-on-dark w-72 border-r border-navy-dark shadow-sidebar">
      {/* Brand Header */}
      <div>
        <div className="flex h-[72px] items-center justify-between px-6 border-b border-navy-light/40">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 group focus-ring rounded-xl py-1"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-primary text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <Cross className="h-5 w-5 rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-white text-xl leading-tight">
                MedLedger
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-teal-light">
                DHQ Hospital Kohat
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-text-on-dark-muted hover:text-white p-2 rounded-xl hover:bg-navy-light transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)] scrollbar-thin">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <h4 className="px-3 text-xs font-bold uppercase tracking-widest text-text-on-dark-muted/70 mb-2">
                {group.title}
              </h4>
              <div className="space-y-1">
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
                        'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 focus-ring',
                        isActive
                          ? 'bg-gradient-to-r from-teal to-primary text-white shadow-md font-bold'
                          : 'text-text-on-dark-muted hover:bg-navy-light/80 hover:text-white hover:translate-x-1',
                      )}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            isActive ? 'text-white' : 'text-text-on-dark-muted',
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-bold leading-normal',
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
      </div>

      {/* Footer info box */}
      <div className="p-4 border-t border-navy-light/30 bg-navy-dark/50">
        <div className="rounded-xl bg-navy-light/40 p-4 border border-navy-light/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-light">
              System Status
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-teal animate-pulse shadow-sm shadow-teal/50" />
          </div>
          <p className="text-sm text-text-on-dark-muted leading-snug">All systems operational</p>
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
