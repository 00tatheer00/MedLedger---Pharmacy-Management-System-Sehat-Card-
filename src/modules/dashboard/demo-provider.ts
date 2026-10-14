import {
  kpiData,
  priorityAlerts,
  inventorySummary,
  recentActivity,
  quickActions,
} from '@/lib/demo-data';
import { DashboardSummary } from './types';

/**
 * MedLedger — Demo Data Provider for Dashboard
 *
 * Provides a structured, verified demo dataset when running in prototype mode
 * or when the Supabase database is not connected.
 */
export function getDemoDashboardSummary(): DashboardSummary {
  return {
    kpis: {
      totalMedicines: {
        id: 'total-medicines',
        title: 'Total Medicines',
        value: kpiData.totalMedicines.toLocaleString(),
        change: '+14 items',
        changeType: 'positive',
        subtext: 'Catalog SKUs',
        badgeText: 'Active',
        badgeVariant: 'teal',
      },
      lowStockItems: {
        id: 'low-stock-items',
        title: 'Low Stock Items',
        value: kpiData.lowStockItems.toString(),
        change: '<= 20 threshold',
        changeType: 'warning',
        subtext: 'Reorder needed',
        badgeText: 'Action',
        badgeVariant: 'warning',
      },
      expiringMedicines: {
        id: 'expiring-medicines',
        title: 'Expiring Medicines',
        value: kpiData.expiringMedicines.toString(),
        change: '< 60 days',
        changeType: 'negative',
        subtext: 'FEFO rotation',
        badgeText: 'Urgent',
        badgeVariant: 'danger',
      },
      pendingClaims: {
        id: 'pending-claims',
        title: 'Pending Claims',
        value: kpiData.pendingClaims.toString(),
        change: 'PKR 482,500',
        changeType: 'neutral',
        subtext: 'Hospital audit',
        badgeText: 'In Review',
        badgeVariant: 'info',
      },
    },
    alerts: priorityAlerts,
    inventory: inventorySummary,
    recentActivity: recentActivity,
    quickActions: quickActions.map((qa) => ({
      id: qa.id,
      title: qa.label,
      description: qa.description,
      href:
        qa.id === 'qa-add-medicine'
          ? '/medicines'
          : qa.id === 'qa-receive-stock'
            ? '/purchases'
            : qa.id === 'qa-dispense'
              ? '/dispensing'
              : '/claims',
      tag:
        qa.id === 'qa-add-medicine'
          ? 'Phase 3 Preview'
          : qa.id === 'qa-receive-stock'
            ? 'Phase 3 Preview'
            : qa.id === 'qa-dispense'
              ? 'Phase 4 Preview'
              : 'Phase 5 Preview',
      category:
        qa.id === 'qa-dispense'
          ? 'clinical'
          : qa.id === 'qa-review-claims'
            ? 'finance'
            : 'inventory',
      isPrimary: qa.id === 'qa-dispense',
    })),
    isLiveDatabase: false,
    dataSource: 'prototype_demo',
    sourceNotice:
      'Simulated demonstration records for UI evaluation. No real patient data or database mutations exist.',
    retrievedAt: '2026-10-13T00:00:00.000Z',
  };
}
