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
import { InstallButton } from '@/components/pwa/install-button';
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
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card-bg/98 px-5 sm:px-6 backdrop-blur-sm">
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
            placeholder="Search medicines, patients, prescriptions, batches..."
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
            className="w-full h-10 pl-10 pr-16 rounded-xl border border-border bg-page-bg/60 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus-ring transition-all hover:border-primary/40 focus:border-primary cursor-pointer"
          />
          <button
            onClick={() => {
              setSearchOpen(true);
              executeSearch(searchQuery);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-border bg-card-bg px-2 py-0.5 text-[10px] font-mono text-text-muted shadow-xs hover:text-text-primary transition-colors cursor-pointer"
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

      {/* Global Omni-Search Command Palette (Ctrl+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-3 sm:px-4 bg-navy-dark/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={handleCloseSearch} aria-hidden="true" />

          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-teal/40 bg-card-bg shadow-2xl shadow-navy-dark/50 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="flex items-center px-4 sm:px-5 py-3 sm:py-4 border-b border-border bg-card-bg gap-3 shrink-0">
              <Search className="h-5 w-5 text-teal shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search medicines, patients, prescriptions, batches, suppliers, claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDownInSearch}
                className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-text-primary placeholder:text-text-muted focus:outline-hidden"
              />
              {isSearching && <Loader2 className="h-5 w-5 text-teal animate-spin shrink-0" />}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-text-muted hover:text-text-primary px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleCloseSearch}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-hover-bg transition-colors cursor-pointer"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category Filter Pills Bar with Dynamic Counts */}
            <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-b border-border/70 bg-slate-50/90 overflow-x-auto no-scrollbar shrink-0">
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
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer',
                      isActive
                        ? 'bg-teal text-white shadow-xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-slate-200/70',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{cat.label === 'All' ? 'All (تمام)' : cat.label}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          'ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                          isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700',
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
              <div className="px-3 sm:px-4 py-2.5 border-b border-border/50 bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 text-teal" />
                  <span>Popular Searches (عام تلاشیں):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag.label}
                      onClick={() => handleTagClick(tag.label)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-card-bg border border-border hover:border-teal/50 hover:bg-teal-bg/60 hover:text-teal transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>{tag.label}</span>
                      <span className="text-[10px] text-text-muted font-normal">({tag.type})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results Area */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 scrollbar-thin">
              {activeResults.length > 0 ? (
                <>
                  <div className="px-3 py-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-text-muted">
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
                          'flex items-center justify-between p-3 rounded-xl transition-all duration-150 border',
                          isSelected
                            ? 'bg-teal-bg border-teal/40 shadow-xs'
                            : 'bg-card-bg border-transparent hover:bg-hover-bg hover:border-border/60',
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'h-9 w-9 rounded-xl flex items-center justify-center border shrink-0',
                              item.category === 'Medicine'
                                ? 'bg-teal/15 text-teal border-teal/30'
                                : item.category === 'Patient'
                                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                                  : item.category === 'Prescription'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : item.category === 'Batch'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : item.category === 'Supplier'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : item.category === 'Claim'
                                          ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                          : 'bg-rose-50 text-rose-600 border-rose-200',
                            )}
                          >
                            {item.category === 'Medicine' && <Pill className="h-4 w-4" />}
                            {item.category === 'Patient' && <Users className="h-4 w-4" />}
                            {item.category === 'Prescription' && <FileText className="h-4 w-4" />}
                            {item.category === 'Batch' && <Package className="h-4 w-4" />}
                            {item.category === 'Supplier' && <Building2 className="h-4 w-4" />}
                            {item.category === 'Claim' && <Receipt className="h-4 w-4" />}
                            {item.category === 'Action' && <Zap className="h-4 w-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-text-primary truncate">
                                {item.title}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                {item.category}
                              </span>
                            </div>
                            <span className="text-xs text-text-secondary line-clamp-1">
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
                              'h-4 w-4 transition-transform hidden sm:block',
                              isSelected ? 'text-teal translate-x-0.5' : 'text-text-muted/30',
                            )}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </>
              ) : (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1 border border-amber-200">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="text-base font-bold text-text-primary">
                    No hospital records found matching &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                    Try searching by medicine name, generic name, patient MRN, CNIC, prescription
                    number, batch ID, or supplier name.
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-teal bg-teal-bg hover:bg-teal/20 transition-colors cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer with Keyboard Shortcuts */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 border-t border-border bg-slate-50 text-xs text-text-muted shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 rounded bg-card-bg border border-border text-[10px] font-mono shadow-2xs">
                    ↑↓
                  </kbd>
                  <span className="hidden sm:inline">to navigate</span>
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 rounded bg-card-bg border border-border text-[10px] font-mono shadow-2xs">
                    ↵
                  </kbd>
                  <span className="hidden sm:inline">to select</span>
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 rounded bg-card-bg border border-border text-[10px] font-mono shadow-2xs">
                    ESC
                  </kbd>
                  <span className="hidden sm:inline">to close</span>
                </span>
              </div>
              <span className="font-semibold text-teal text-xs">MedLedger Omni-Search</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
