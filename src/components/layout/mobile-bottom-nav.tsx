'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardCheck, Package, Users, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: LayoutDashboard },
    { label: 'Dispense', href: '/dispensing', icon: ClipboardCheck },
    { label: 'Stock', href: '/inventory', icon: Package },
    { label: 'Patients', href: '/patients', icon: Users },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-3 left-3 right-3 max-w-md mx-auto z-40 bg-slate-950/85 backdrop-blur-3xl border border-white/20 rounded-full px-3 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex items-center justify-around select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 min-w-[56px] ios-press',
              isActive ? 'text-teal-300 font-bold' : 'text-slate-400 hover:text-white',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200',
                isActive &&
                  'bg-gradient-to-tr from-teal-500/30 to-emerald-500/30 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.4)] border border-teal-400/40 scale-105',
              )}
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}

      {/* Menu Drawer Trigger */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-full text-slate-400 hover:text-white transition-all min-w-[56px] cursor-pointer ios-press"
        aria-label="Open full menu"
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/10 transition-colors">
          <Menu className="h-4.5 w-4.5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">More</span>
      </button>
    </nav>
  );
}
