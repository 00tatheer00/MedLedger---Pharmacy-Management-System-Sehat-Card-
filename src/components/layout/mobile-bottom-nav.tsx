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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border px-2 py-1.5 flex items-center justify-around select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors duration-100 min-w-[56px]',
              isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600',
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
            <span className={cn('text-[10px] mt-0.5', isActive && 'font-semibold')}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Menu Drawer Trigger */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-slate-400 hover:text-slate-600 transition-colors min-w-[56px] cursor-pointer"
        aria-label="Open full menu"
      >
        <Menu className="h-5 w-5" strokeWidth={1.8} />
        <span className="text-[10px] mt-0.5">More</span>
      </button>
    </nav>
  );
}
