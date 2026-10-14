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
import { InstallButton } from '@/components/pwa/install-button';

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
    <div className="flex h-full flex-col bg-slate-950/85 backdrop-blur-3xl text-text-on-dark w-64 border-r border-white/10 shadow-2xl select-none relative overflow-hidden">
      {/* Ambient glowing orbs inside sidebar */}
      <div className="absolute top-0 left-0 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Brand Header */}
      <div className="shrink-0 flex h-16 items-center justify-between px-5 border-b border-white/10 relative z-10">
        <Link
          href="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group focus-ring rounded-xl py-1"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.45)] group-hover:scale-105 transition-all duration-300">
            <Cross className="h-4.5 w-4.5 rotate-45 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-white text-lg leading-tight">
              MedLedger
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300">
              DHQ Hospital Kohat
            </span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-3 space-y-3 relative z-10">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 mb-1">
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
                      'flex items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 focus-ring ios-press',
                      isActive
                        ? 'bg-gradient-to-r from-teal-500/95 to-emerald-500/95 text-white shadow-[0_4px_18px_rgba(20,184,166,0.35)] font-bold border border-white/25 backdrop-blur-md'
                        : 'text-slate-300/85 hover:bg-white/10 hover:text-white border border-transparent',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'text-white' : 'text-slate-400',
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
                            : 'bg-teal-500/20 text-teal-300 border border-teal-400/30',
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

      {/* Footer info box & Install App */}
      <div className="shrink-0 p-3 space-y-2 border-t border-white/10 bg-black/20 backdrop-blur-md relative z-10">
        <InstallButton variant="sidebar" />
        <div className="rounded-xl bg-white/5 p-2.5 px-3 border border-white/10 flex items-center justify-between backdrop-blur-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
              System Status
            </span>
            <span className="text-xs text-slate-300/85">All systems operational</span>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)] shrink-0" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed top-0 bottom-0 left-0 z-30 w-64 h-screen">
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
