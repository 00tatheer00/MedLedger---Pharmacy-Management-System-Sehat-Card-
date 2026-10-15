'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Pill,
  Users,
  FileText,
  Package,
  Building2,
  Receipt,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { priorityAlerts } from '@/lib/demo-data';
import { searchCatalogueAction } from '@/modules/dashboard/actions';
import { SearchResultItem } from '@/modules/dashboard/types';
import { SYSTEM_ROLES, SystemRole } from '@/core/authorization/roles';
import { cn } from '@/lib/utils';

const DEFAULT_QUICK_ACTIONS: SearchResultItem[] = [
  {
    id: 'def-dispense',
    title: 'Dispense Medicine (دوائی کاؤنٹر)',
    subtitle: 'Open dispensing counter, verify prescriptions & deduct stock',
    category: 'Action',
    badgeText: 'Counter',
    badgeVariant: 'success',
    href: '/dispensing',
  },
  {
    id: 'def-transcribe',
    title: 'Transcribe Prescription (نسخہ اندراج)',
    subtitle: 'Enter handwritten doctor clinical prescription orders',
    category: 'Action',
    badgeText: 'Clinical',
    badgeVariant: 'info',
    href: '/prescriptions/new',
  },
  {
    id: 'def-patient',
    title: 'Register New Patient (نیا مریض داخلہ)',
    subtitle: 'Register patient with MR number, CNIC, and phone contact',
    category: 'Patient',
    badgeText: 'Patient',
    badgeVariant: 'default',
    href: '/patients/new',
  },
  {
    id: 'def-receive',
    title: 'Receive Stock & Inspection (اسٹاک وصولی)',
    subtitle: 'Record supplier goods receiving and verify batch inspection',
    category: 'Batch',
    badgeText: 'Supply',
    badgeVariant: 'warning',
    href: '/purchases/new',
  },
  {
    id: 'def-inventory',
    title: 'Inventory & Stock Surveillance',
    subtitle: 'Check medicine stock levels, batch expiry dates, and alerts',
    category: 'Medicine',
    badgeText: 'Stock',
    badgeVariant: 'default',
    href: '/inventory',
  },
  {
    id: 'def-claims',
    title: 'Sehat Sahulat & Claims Audit',
    subtitle: 'Track insurance claims, verify coverage, and patient audits',
    category: 'Claim',
    badgeText: 'Finance',
    badgeVariant: 'muted',
    href: '/claims',
  },
];

const POPULAR_SEARCH_TAGS = [
  { label: 'Panadol', type: 'Medicine' },
  { label: 'Amoxicillin', type: 'Medicine' },
  { label: 'Ceftriaxone', type: 'Medicine' },
  { label: 'Insulin', type: 'Medicine' },
  { label: 'B-2026-089', type: 'Batch' },
  { label: 'Dr. Farhan', type: 'Prescription' },
  { label: 'MR-2026-0001', type: 'Patient' },
  { label: 'CLM-2026-001', type: 'Claim' },
];

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
  const router = useRouter();

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(priorityAlerts.length);
  const notificationsList = priorityAlerts;

  // Search Dialog State & Omni-Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // User Profile State & Role Switcher
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeRole, setActiveRole] = useState<SystemRole>('pharmacy_manager');

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setActiveCategory('All');
    setSelectedIndex(0);
  }, []);

  // Search Handler (fetches results from all hospital modules)
  const executeSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const res = await searchCatalogueAction(query);
      if (res.success) {
        setSearchResults(res.data);
        setSelectedIndex(0);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchOpen) {
        executeSearch(searchQuery);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch, searchOpen]);

  // Auto-focus search input when search modal opens
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  // Keyboard shortcut Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => {
          if (!prev) executeSearch(searchQuery);
          return !prev;
        });
      } else if (e.key === 'Escape') {
        handleCloseSearch();
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseSearch, executeSearch, searchQuery]);

  const isQueryTooShort = searchQuery.trim().length < 2;

  const activeResults = useMemo(() => {
    if (isQueryTooShort) {
      if (activeCategory === 'All') return DEFAULT_QUICK_ACTIONS;
      return DEFAULT_QUICK_ACTIONS.filter((item) => item.category === activeCategory);
    }
    if (activeCategory === 'All') return searchResults;
    return searchResults.filter((item) => item.category === activeCategory);
  }, [isQueryTooShort, activeCategory, searchResults]);

  const categoryCounts = useMemo(() => {
    const list = isQueryTooShort ? DEFAULT_QUICK_ACTIONS : searchResults;
    const counts: Record<string, number> = { All: list.length };
    for (const item of list) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [isQueryTooShort, searchResults]);

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    executeSearch(tag);
    setActiveCategory('All');
  };

  const handleKeyDownInSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        activeResults.length > 0 ? (prev + 1) % activeResults.length : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        activeResults.length > 0 ? (prev - 1 + activeResults.length) % activeResults.length : 0,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeResults[selectedIndex]) {
        router.push(activeResults[selectedIndex].href);
        handleCloseSearch();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCloseSearch();
    }
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-white px-4 sm:px-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden rounded-lg p-2 text-text-muted hover:bg-slate-100 hover:text-text-primary focus-ring transition-all duration-150"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-none">
          <h1 className="text-xs sm:text-sm font-semibold text-text-primary leading-tight truncate">
            {title}
          </h1>
          <span className="text-[10px] sm:text-[11px] text-text-muted truncate">{subtitle}</span>
        </div>
      </div>

      {/* Middle: Global Search Input / Trigger */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search medicines, patients, prescriptions..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!searchOpen && e.target.value.length > 0) {
                setSearchOpen(true);
                executeSearch(e.target.value);
              }
            }}
            onClick={() => {
              setSearchOpen(true);
              executeSearch(searchQuery);
            }}
            className="w-full h-9 pl-9 pr-16 rounded-lg border border-border bg-slate-50 text-sm text-text-primary placeholder:text-text-muted focus-ring transition-all duration-150 hover:border-slate-400 hover:bg-white focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
          />
          <button
            onClick={() => {
              setSearchOpen(true);
              executeSearch(searchQuery);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-border bg-white px-1.5 py-0.5 text-[10px] font-mono text-text-muted hover:text-text-primary hover:border-slate-400 transition-all duration-150 cursor-pointer"
            aria-label="Search shortcut"
          >
            Ctrl K
          </button>
        </div>
      </div>

      {/* Right: Notifications, User Profile */}
      <div className="flex items-center gap-2">
        {/* Notifications Bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-9 w-9 p-0 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-all duration-150"
            aria-label="Open notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" />
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
              <div className="absolute right-0 mt-2 z-50 w-[360px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-white shadow-dropdown p-4 animate-in fade-in zoom-in-95 duration-150">
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
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                  {notificationsList.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-lg border border-border p-3 hover:bg-slate-50 transition-colors duration-100 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
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
                        <span className="text-[11px] text-text-muted">
                          {alert.timestamp.replace('T', ' ').slice(0, 16)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-text-primary mb-0.5">{alert.title}</p>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {alert.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-text-secondary hover:text-text-primary font-medium transition-colors"
                  >
                    Close
                  </button>
                  <span className="text-[11px] text-text-muted">Operational alerts</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Menu with Provisional Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-3 border-l border-border focus-ring rounded-lg py-1.5 hover:bg-slate-50 transition-all duration-150"
            aria-label="User profile and role menu"
            aria-expanded={showUserMenu}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white text-xs font-semibold">
              AK
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-medium text-text-primary leading-tight">
                Dr. Ayesha Khan
              </span>
              <span className="text-[11px] text-text-muted">{SYSTEM_ROLES[activeRole].name}</span>
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
              <div className="absolute right-0 mt-2 z-50 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-white shadow-dropdown p-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white text-sm font-semibold">
                    AK
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">Dr. Ayesha Khan</h4>
                    <p className="text-xs text-text-muted">ayesha.khan@dhqkohat.test</p>
                  </div>
                </div>

                {/* Role Simulation Switcher */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                      Simulated Role Preview
                    </span>
                    <Badge variant="info" size="sm">
                      Provisional
                    </Badge>
                  </div>
                  <p className="text-[11px] text-text-muted leading-snug mb-2.5">
                    Switch roles to evaluate permission boundaries.
                  </p>

                  <div className="space-y-1">
                    {(Object.keys(SYSTEM_ROLES) as SystemRole[]).map((roleKey) => (
                      <button
                        key={roleKey}
                        onClick={() => {
                          setActiveRole(roleKey);
                          setShowUserMenu(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100 cursor-pointer',
                          activeRole === roleKey
                            ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200'
                            : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary border border-transparent',
                        )}
                      >
                        <span>{SYSTEM_ROLES[roleKey].name}</span>
                        {activeRole === roleKey && (
                          <CheckCircle2 className="h-4 w-4 text-teal-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Supabase RBAC
                  </span>
                  <span>DHQ Kohat</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Global Omni-Search Command Palette (Ctrl+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/40 animate-in fade-in duration-100">
          <div className="fixed inset-0" onClick={handleCloseSearch} aria-hidden="true" />

          <div className="relative z-10 w-full max-w-2xl rounded-xl border border-border bg-white shadow-dropdown overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-100">
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3 border-b border-border gap-3 shrink-0">
              <Search className="h-4 w-4 text-text-muted shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search medicines, patients, prescriptions, batches, suppliers, claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDownInSearch}
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden"
              />
              {isSearching && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] text-text-muted hover:text-text-primary px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 transition-all duration-150 cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleCloseSearch}
                className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-slate-100 transition-all duration-150 cursor-pointer"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Category Filter Pills Bar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-slate-50 overflow-x-auto no-scrollbar shrink-0">
              {[
                { label: 'All', icon: Sparkles },
                { label: 'Medicine', icon: Pill },
                { label: 'Patient', icon: Users },
                { label: 'Prescription', icon: FileText },
                { label: 'Batch', icon: Package },
                { label: 'Supplier', icon: Building2 },
                { label: 'Claim', icon: Receipt },
                { label: 'Action', icon: Zap },
              ].map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.label;
                const count = categoryCounts[cat.label] || 0;
                return (
                  <button
                    key={cat.label}
                    onClick={() => {
                      setActiveCategory(cat.label);
                      setSelectedIndex(0);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 shrink-0 cursor-pointer',
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-slate-100',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{cat.label === 'All' ? 'All (تمام)' : cat.label}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          'ml-0.5 text-[10px] px-1 rounded font-medium',
                          isActive ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 text-slate-600',
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Popular Search Suggestions when query is short */}
            {isQueryTooShort && (
              <div className="px-3 py-2.5 border-b border-border bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 text-teal-600" />
                  <span>Popular Searches (عام تلاشیں):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag.label}
                      onClick={() => handleTagClick(tag.label)}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-border hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all duration-150 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{tag.label}</span>
                      <span className="text-[10px] text-text-muted font-normal">({tag.type})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
              {activeResults.length > 0 ? (
                <>
                  <div className="px-3 py-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-text-muted">
                    <span>
                      {searchQuery
                        ? `Matching Results (${activeResults.length})`
                        : 'Quick Actions & Hospital Counters (فوری اقدامات)'}
                    </span>
                    <span className="hidden sm:inline">Use ↑↓ arrows to navigate</span>
                  </div>

                  {activeResults.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <Link
                        key={`${item.category}-${item.id}`}
                        href={item.href}
                        onClick={handleCloseSearch}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'flex items-center justify-between p-2.5 rounded-lg transition-colors duration-100',
                          isSelected ? 'bg-slate-100' : 'hover:bg-slate-50',
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                              item.category === 'Medicine'
                                ? 'bg-teal-50 text-teal-600'
                                : item.category === 'Patient'
                                  ? 'bg-blue-50 text-blue-600'
                                  : item.category === 'Prescription'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : item.category === 'Batch'
                                      ? 'bg-amber-50 text-amber-600'
                                      : item.category === 'Supplier'
                                        ? 'bg-purple-50 text-purple-600'
                                        : item.category === 'Claim'
                                          ? 'bg-cyan-50 text-cyan-600'
                                          : 'bg-rose-50 text-rose-600',
                            )}
                          >
                            {item.category === 'Medicine' && <Pill className="h-3.5 w-3.5" />}
                            {item.category === 'Patient' && <Users className="h-3.5 w-3.5" />}
                            {item.category === 'Prescription' && (
                              <FileText className="h-3.5 w-3.5" />
                            )}
                            {item.category === 'Batch' && <Package className="h-3.5 w-3.5" />}
                            {item.category === 'Supplier' && <Building2 className="h-3.5 w-3.5" />}
                            {item.category === 'Claim' && <Receipt className="h-3.5 w-3.5" />}
                            {item.category === 'Action' && <Zap className="h-3.5 w-3.5" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-text-primary truncate">
                                {item.title}
                              </span>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                                {item.category}
                              </span>
                            </div>
                            <span className="text-xs text-text-muted line-clamp-1">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant={item.badgeVariant} size="sm">
                            {item.badgeText}
                          </Badge>
                          <ArrowRight
                            className={cn(
                              'h-3.5 w-3.5 transition-all duration-100 hidden sm:block',
                              isSelected ? 'text-text-primary translate-x-0.5' : 'text-transparent',
                            )}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </>
              ) : (
                <div className="py-10 px-4 text-center space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">
                    No records found matching &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-xs text-text-muted max-w-sm mx-auto">
                    Try searching by medicine name, generic name, patient MRN, CNIC, prescription
                    number, batch ID, or supplier name.
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer with Keyboard Shortcuts */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-slate-50 text-[11px] text-text-muted shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-white border border-border text-[10px] font-mono">
                    ↑↓
                  </kbd>
                  <span className="hidden sm:inline">navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-white border border-border text-[10px] font-mono">
                    ↵
                  </kbd>
                  <span className="hidden sm:inline">select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-white border border-border text-[10px] font-mono">
                    ESC
                  </kbd>
                  <span className="hidden sm:inline">close</span>
                </span>
              </div>
              <span className="font-medium text-text-muted text-[11px]">MedLedger Search</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
