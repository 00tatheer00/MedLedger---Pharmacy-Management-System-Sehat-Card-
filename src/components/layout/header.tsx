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
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card-bg/95 px-4 sm:px-6 backdrop-blur-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden rounded-lg p-2 text-text-secondary hover:bg-hover-bg hover:text-text-primary focus-ring"
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
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search medicines, prescriptions, claims, or batch numbers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!searchOpen && e.target.value.length > 0) {
                setSearchOpen(true);
              }
            }}
            onClick={() => setSearchOpen(true)}
            className="w-full h-9 pl-9 pr-14 rounded-lg border border-border bg-page-bg/60 text-xs text-text-primary placeholder:text-text-muted focus-ring transition-colors cursor-pointer"
          />
          <button
            onClick={() => setSearchOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-card-bg px-1.5 py-0.5 text-[10px] font-mono text-text-muted shadow-2xs hover:text-text-primary"
            aria-label="Search shortcut"
          >
            Ctrl K
          </button>
        </div>
      </div>

      {/* Right: Environment pill, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Prototype Environment Pill */}
        <div className="hidden xl:flex items-center gap-2 rounded-full border border-border bg-page-bg px-3 py-1 text-xs text-text-secondary">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-medium text-xs">Phase 4 • App Integration</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-9 w-9 p-0 rounded-lg text-text-secondary hover:text-text-primary hover:bg-hover-bg"
            aria-label="Open notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
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
              <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-xl border border-border bg-card-bg shadow-dropdown p-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-text-primary">System Alerts</h4>
                    {unreadCount > 0 ? (
                      <Badge variant="warning" size="sm">
                        {unreadCount} unread
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        All read
                      </Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto scrollbar-thin">
                  {notificationsList.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-lg border border-border/80 bg-page-bg/60 p-2.5 hover:bg-hover-bg transition-colors"
                    >
                      <div className="flex items-center justify-between">
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
                        <span className="text-[10px] text-text-muted">
                          {alert.timestamp.replace('T', ' ').slice(0, 16)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs font-semibold text-text-primary">
                        {alert.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-secondary line-clamp-2">
                        {alert.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-text-secondary hover:text-text-primary font-medium"
                  >
                    Close panel
                  </button>
                  <span className="text-[10px] text-text-muted">Simulated operational alerts</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Menu with Provisional Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-border focus-ring rounded-lg py-1"
            aria-label="User profile and role menu"
            aria-expanded={showUserMenu}
          >
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-navy text-white text-xs font-bold ring-2 ring-teal/30">
              AK
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-text-primary leading-tight">
                Dr. Ayesha Khan
              </span>
              <span className="text-[10px] text-text-secondary font-medium">
                {SYSTEM_ROLES[activeRole].name}
              </span>
            </div>
            <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-text-muted" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 z-50 w-72 rounded-xl border border-border bg-card-bg shadow-dropdown p-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white text-sm font-bold">
                    AK
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">Dr. Ayesha Khan</h4>
                    <p className="text-xs text-text-secondary">ayesha.khan@dhqkohat.test</p>
                  </div>
                </div>

                {/* Role Simulation Switcher */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                      Simulated Role Preview
                    </span>
                    <Badge variant="info" size="sm">
                      Provisional
                    </Badge>
                  </div>
                  <p className="text-[11px] text-text-muted leading-tight mb-2">
                    Switch roles to evaluate provisional permission boundaries in this prototype.
                  </p>

                  <div className="space-y-1">
                    {(Object.keys(SYSTEM_ROLES) as SystemRole[]).map((roleKey) => (
                      <button
                        key={roleKey}
                        onClick={() => {
                          setActiveRole(roleKey);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          activeRole === roleKey
                            ? 'bg-primary-light text-primary font-semibold'
                            : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
                        }`}
                      >
                        <span>{SYSTEM_ROLES[roleKey].name}</span>
                        {activeRole === roleKey && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    Supabase RBAC
                  </span>
                  <span>DHQ Kohat Dispensary</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Global Search Dialog Modal (Ctrl+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-navy-dark/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={handleCloseSearch} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-xl rounded-xl border border-border bg-card-bg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3 border-b border-border bg-card-bg">
              <Search className="h-4.5 w-4.5 text-text-muted mr-3 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search medicines, generic names, batches, or claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden"
              />
              {isSearching && <Loader2 className="h-4 w-4 text-primary animate-spin mr-2" />}
              <button
                onClick={handleCloseSearch}
                className="text-text-muted hover:text-text-primary p-1 rounded-md"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Results Area */}
            <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
              {searchQuery.trim().length < 2 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs text-text-secondary">
                    Type at least 2 characters to search the medicine catalogue, batch numbers, or
                    claims.
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">
                    Examples: &quot;Amoxicillin&quot;, &quot;B-2026&quot;, &quot;CLM-2026&quot;,
                    &quot;Ceftriaxone&quot;
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item) => (
                    <Link
                      key={`${item.category}-${item.id}`}
                      href={item.href}
                      onClick={handleCloseSearch}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-hover-bg transition-colors focus-ring"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-text-primary">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-text-secondary">{item.subtitle}</span>
                      </div>
                      <Badge variant={item.badgeVariant} size="sm">
                        {item.badgeText}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs font-medium text-text-primary">
                    No records found matching &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Try searching by medicine name, generic ingredient, or batch code.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-page-bg/60 text-[11px] text-text-muted">
              <span>ESC to close • Enter to select</span>
              <span>Prototype Evaluation Search</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
