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
    <div className="flex h-full flex-col justify-between bg-navy text-text-on-dark w-64 border-r border-navy-dark shadow-sidebar">
      {/* Brand Header */}
      <div>
        <div className="flex h-14 items-center justify-between px-5 border-b border-navy-light/40">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 group focus-ring rounded-lg py-1"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-white shadow-xs group-hover:bg-teal-light transition-colors">
              <Cross className="h-4.5 w-4.5 rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white text-base leading-tight">
                MedLedger
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-light">
                DHQ Hospital Kohat
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-text-on-dark-muted hover:text-white p-1 rounded-md"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-text-on-dark-muted/80">
                {group.title}
              </h4>
              <div className="mt-1 space-y-0.5">
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
                        'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-ring',
                        isActive
                          ? 'bg-teal text-white shadow-xs font-semibold'
                          : 'text-text-on-dark-muted hover:bg-navy-light/60 hover:text-white',
                      )}
                    >
                      <div className="flex items-center gap-3">
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
                            'rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-normal',
                            isActive
                              ? 'bg-white text-teal'
                              : 'bg-teal/30 text-teal-light border border-teal/40',
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
      <div className="p-4 border-t border-navy-light/30 bg-navy-dark/40">
        <div className="rounded-lg bg-navy/60 p-3 border border-navy-light/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-light">
              Phase 2 Prototype
            </span>
            <span className="h-2 w-2 rounded-full bg-teal animate-pulse" />
          </div>
          <p className="mt-1 text-xs text-text-on-dark-muted leading-tight">
            Design system & dashboard view. Backend disabled.
          </p>
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
            className="fixed inset-0 bg-navy-dark/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full">{content}</div>
        </div>
      )}
    </>
  );
}
