import { describe, it, expect } from 'vitest';
import {
  kpiData,
  recentActivity,
  priorityAlerts,
  inventorySummary,
  quickActions,
} from './demo-data';

describe('Demo data module', () => {
  it('has consistent inventory totals', () => {
    const sum =
      inventorySummary.inStock +
      inventorySummary.lowStock +
      inventorySummary.outOfStock +
      inventorySummary.expired;
    expect(sum).toBe(inventorySummary.total);
    expect(inventorySummary.total).toBe(kpiData.totalMedicines);
  });

  it('contains valid activity items with reference numbers', () => {
    expect(recentActivity.length).toBeGreaterThan(0);
    recentActivity.forEach((act) => {
      expect(act.refNumber).toMatch(/^(GRN|DSP|ADJ)-\d{4}-\d{4}$/);
      expect(['receipt', 'dispensing', 'adjustment', 'return']).toContain(act.type);
      expect(['completed', 'pending', 'cancelled']).toContain(act.status);
    });
  });

  it('contains prioritized alerts with required severities', () => {
    expect(priorityAlerts.length).toBeGreaterThan(0);
    priorityAlerts.forEach((alert) => {
      expect(['critical', 'warning', 'info']).toContain(alert.severity);
      expect(alert.title.length).toBeGreaterThan(0);
    });
  });

  it('marks all quick actions as unavailable in prototype phase', () => {
    quickActions.forEach((action) => {
      expect(action.available).toBe(false);
    });
  });
});
