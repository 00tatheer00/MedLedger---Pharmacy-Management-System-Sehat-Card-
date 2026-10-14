'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  X,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { priorityAlerts } from '@/lib/demo-data';
import { searchCatalogueAction } from '@/modules/dashboard/actions';
import { SearchResultItem } from '@/modules/dashboard/types';
import { SYSTEM_ROLES, SystemRole } from '@/core/authorization/roles';
import { InstallButton } from '@/components/pwa/install-button';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({
  onToggleMobileMenu,
  title = 'Pharmacy Operations Dashboard',
  subtitle = 'DHQ Hospital Kohat',
}: HeaderProps) {
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(priorityAlerts.length);
  const notificationsList = priorityAlerts;

  // Search Dialog State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // User Profile State & Role Switcher
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeRole, setActiveRole] = useState<SystemRole>('pharmacy_manager');

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Debounced Search Handler
  const executeSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await searchCatalogueAction(query);
      if (res.success) {
        setSearchResults(res.data);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        executeSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch]);

  // Keyboard shortcut Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        handleCloseSearch();
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseSearch]);

  // Auto-focus search input when search modal opens
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card-bg/98 px-5 sm:px-6 backdrop-blur-sm">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden rounded-lg p-2 text-text-secondary hover:bg-hover-bg hover:text-text-primary focus-ring transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex flex-col">
          <h1 className="text-base font-bold text-text-primary leading-tight tracking-tight">
            {title}
          </h1>
          <span className="text-xs text-text-secondary">{subtitle}</span>
        </div>
      </div>

      {/* Middle: Global Search Input / Trigger */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search medicines, prescriptions, claims..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!searchOpen && e.target.value.length > 0) {
                setSearchOpen(true);
              }
            }}
            onClick={() => setSearchOpen(true)}
            className="w-full h-10 pl-10 pr-16 rounded-xl border border-border bg-page-bg/60 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus-ring transition-all hover:border-primary/40 focus:border-primary cursor-pointer"
          />
          <button
            onClick={() => setSearchOpen(true)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-border bg-card-bg px-2 py-0.5 text-[10px] font-mono text-text-muted shadow-xs hover:text-text-primary transition-colors"
            aria-label="Search shortcut"
          >
            Ctrl K
          </button>
        </div>
      </div>

      {/* Right: Notifications, User Profile, PWA Install */}
      <div className="flex items-center gap-2 sm:gap-3">
        <InstallButton />
        {/* Notifications Bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-11 w-11 p-0 rounded-xl text-text-secondary hover:text-text-primary hover:bg-hover-bg"
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-danger" />
              </span>
            )}
          </Button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-3 z-50 w-96 sm:w-[420px] rounded-2xl border border-border bg-card-bg shadow-dropdown p-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-base font-bold text-text-primary">System Alerts</h4>
                    {unreadCount > 0 ? (
                      <Badge variant="warning" size="sm" className="font-bold">
                        {unreadCount} unread
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm" className="font-bold">
                        All read
                      </Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-sm text-primary hover:underline font-bold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                  {notificationsList.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-xl border border-border bg-page-bg/60 p-4 hover:bg-hover-bg hover:border-primary/30 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={
                            alert.severity === 'critical'
                              ? 'danger'
                              : alert.severity === 'warning'
                                ? 'warning'
                                : 'info'
                          }
                          size="sm"
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-text-muted font-medium">
                          {alert.timestamp.replace('T', ' ').slice(0, 16)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-text-primary mb-1">{alert.title}</p>
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {alert.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-sm text-text-secondary hover:text-text-primary font-semibold transition-colors"
                  >
                    Close panel
                  </button>
                  <span className="text-xs text-text-muted">Operational alerts</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Menu with Provisional Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-3 sm:pl-4 border-l-2 border-border focus-ring rounded-xl py-1.5 hover:bg-hover-bg transition-colors"
            aria-label="User profile and role menu"
            aria-expanded={showUserMenu}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-navy to-primary text-white text-sm font-bold ring-3 ring-teal/30 shadow-sm">
              AK
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-bold text-text-primary leading-tight">
                Dr. Ayesha Khan
              </span>
              <span className="text-xs text-text-secondary font-semibold">
                {SYSTEM_ROLES[activeRole].name}
              </span>
            </div>
            <ChevronDown className="hidden sm:block h-4 w-4 text-text-muted" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-3 z-50 w-80 rounded-2xl border border-border bg-card-bg shadow-dropdown p-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-navy to-primary text-white text-base font-bold shadow-md">
                    AK
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">Dr. Ayesha Khan</h4>
                    <p className="text-sm text-text-secondary">ayesha.khan@dhqkohat.test</p>
                  </div>
                </div>

                {/* Role Simulation Switcher */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                      Simulated Role Preview
                    </span>
                    <Badge variant="info" size="sm" className="font-bold">
                      Provisional
                    </Badge>
                  </div>
                  <p className="text-sm text-text-muted leading-snug mb-3">
                    Switch roles to evaluate permission boundaries.
                  </p>

                  <div className="space-y-1.5">
                    {(Object.keys(SYSTEM_ROLES) as SystemRole[]).map((roleKey) => (
                      <button
                        key={roleKey}
                        onClick={() => {
                          setActiveRole(roleKey);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          activeRole === roleKey
                            ? 'bg-primary-light text-primary font-bold border-2 border-primary/30'
                            : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary border-2 border-transparent'
                        }`}
                      >
                        <span>{SYSTEM_ROLES[roleKey].name}</span>
                        {activeRole === roleKey && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Supabase RBAC
                  </span>
                  <span>DHQ Kohat</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Global Search Dialog Modal (Ctrl+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-navy-dark/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={handleCloseSearch} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-border bg-card-bg shadow-dropdown overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Search Input Bar */}
            <div className="flex items-center px-5 py-4 border-b border-border bg-card-bg">
              <Search className="h-5 w-5 text-text-muted mr-3 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search medicines, generic names, batches, or claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted focus:outline-hidden"
              />
              {isSearching && <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />}
              <button
                onClick={handleCloseSearch}
                className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-hover-bg transition-colors"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Results Area */}
            <div className="max-h-96 overflow-y-auto p-3 scrollbar-thin">
              {searchQuery.trim().length < 2 ? (
                <div className="py-10 px-4 text-center">
                  <p className="text-sm text-text-secondary">
                    Type at least 2 characters to search the medicine catalogue.
                  </p>
                  <p className="text-sm text-text-muted mt-2">
                    Examples: &quot;Amoxicillin&quot;, &quot;B-2026&quot;, &quot;Ceftriaxone&quot;
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1.5">
                  {searchResults.map((item) => (
                    <Link
                      key={`${item.category}-${item.id}`}
                      href={item.href}
                      onClick={handleCloseSearch}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-hover-bg transition-all duration-150 focus-ring"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">{item.title}</span>
                        <span className="text-sm text-text-secondary">{item.subtitle}</span>
                      </div>
                      <Badge variant={item.badgeVariant} size="sm">
                        {item.badgeText}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-10 px-4 text-center">
                  <p className="text-sm font-bold text-text-primary">
                    No records found matching &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-sm text-text-secondary mt-2">
                    Try searching by medicine name, generic ingredient, or batch code.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-page-bg/60 text-sm text-text-muted">
              <span>ESC to close • Enter to select</span>
              <span>Search</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
