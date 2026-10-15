'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { Footer } from './footer';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-page-bg w-full max-w-full">
      {/* Sidebar navigation */}
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      {/* Main Content Area (offset by lg:pl-[260px] for fixed sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px] w-full max-w-full overflow-x-hidden">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          title={title}
          subtitle={subtitle}
        />
        <main className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 lg:pb-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
        <Footer />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
    </div>
  );
}
