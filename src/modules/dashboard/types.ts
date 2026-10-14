/**
 * MedLedger — Dashboard Data Architecture & Types
 *
 * Defines the structured contract for all dashboard metrics,
 * KPI summaries, alerts, inventory health, and journal activity.
 */

export interface KpiMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral' | 'warning';
  subtext: string;
  badgeText: string;
  badgeVariant: 'teal' | 'warning' | 'danger' | 'info' | 'neutral';
}

export interface KpiSummary {
  totalMedicines: KpiMetric;
  lowStockItems: KpiMetric;
  expiringMedicines: KpiMetric;
  pendingClaims: KpiMetric;
}

export interface PriorityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  entityType?: string;
  entityId?: string;
  actionable?: boolean;
}

export interface InventoryCategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface InventoryBreakdown {
  inStock: number;
  lowStock: number;
  outOfStock: number;
  expired: number;
  total: number;
  categories?: InventoryCategoryBreakdown[];
}

export interface ActivityItem {
  id: string;
  refNumber: string;
  type: 'receipt' | 'dispensing' | 'adjustment' | 'return';
  summary: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  actorName?: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  href: string;
  tag: string;
  category: 'clinical' | 'inventory' | 'finance';
  isPrimary?: boolean;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Medicine' | 'Batch' | 'Claim' | 'Prescription';
  badgeText: string;
  badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  href: string;
}

export interface DashboardSummary {
  kpis: KpiSummary;
  alerts: PriorityAlert[];
  inventory: InventoryBreakdown;
  recentActivity: ActivityItem[];
  quickActions: QuickActionItem[];
  isLiveDatabase: boolean;
  dataSource: 'supabase_database' | 'prototype_demo';
  sourceNotice: string;
  retrievedAt: string;
}
