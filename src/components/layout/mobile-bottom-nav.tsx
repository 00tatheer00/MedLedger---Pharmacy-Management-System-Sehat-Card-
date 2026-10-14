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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy/98 backdrop-blur-lg border-t border-navy-light/50 px-2 py-1.5 shadow-2xl flex items-center justify-around select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 min-w-[56px]',
              isActive ? 'text-teal-light font-bold' : 'text-text-on-dark-muted hover:text-white',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center h-7 w-7 rounded-lg transition-transform',
                isActive && 'bg-teal/20 scale-110',
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
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-text-on-dark-muted hover:text-white transition-all min-w-[56px] cursor-pointer"
        aria-label="Open full menu"
      >
        <div className="flex items-center justify-center h-7 w-7 rounded-lg">
          <Menu className="h-4.5 w-4.5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">More</span>
      </button>
    </nav>
  );
}
