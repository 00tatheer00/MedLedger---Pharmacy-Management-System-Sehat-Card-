'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileBottomNav } from './mobile-bottom-nav';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex relative overflow-x-hidden apple-mesh-bg">
      {/* Dynamic ambient luminous orbs behind glass panels */}
      <div
        className="fixed top-[-5%] left-[25%] w-[450px] h-[450px] rounded-full bg-teal-400/20 blur-[120px] pointer-events-none -z-10 animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="fixed bottom-[5%] right-[15%] w-[550px] h-[550px] rounded-full bg-purple-500/20 blur-[140px] pointer-events-none -z-10 animate-pulse"
        style={{ animationDuration: '10s' }}
      />
      <div className="fixed top-[45%] right-[35%] w-[320px] h-[320px] rounded-full bg-pink-500/15 blur-[100px] pointer-events-none -z-10" />

      {/* Sidebar navigation */}
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      {/* Main Content Area (offset by lg:pl-64 for fixed sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          title={title}
          subtitle={subtitle}
        />
        <main className="flex-1 p-3.5 sm:p-5 lg:p-7 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
    </div>
  );
}
