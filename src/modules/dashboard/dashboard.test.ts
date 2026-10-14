import { describe, it, expect } from 'vitest';
import { getDashboardSummary, searchCatalogue } from './server-queries';
import { getDemoDashboardSummary } from './demo-provider';
import { fetchDashboardSummaryAction, searchCatalogueAction } from './actions';

describe('Dashboard Data Architecture & Queries', () => {
  describe('getDashboardSummary', () => {
    it('returns a structured DashboardSummary conforming to contract', async () => {
      const summary = await getDashboardSummary();

      expect(summary).toBeDefined();
      expect(summary.kpis).toBeDefined();
      expect(summary.kpis.totalMedicines.title).toBe('Total Medicines');
      expect(summary.kpis.lowStockItems.title).toBe('Low Stock Items');
      expect(summary.kpis.expiringMedicines.title).toBe('Expiring Medicines');
      expect(summary.kpis.pendingClaims.title).toBe('Pending Claims');
      expect(summary.alerts.length).toBeGreaterThan(0);
      expect(summary.recentActivity.length).toBeGreaterThan(0);
      expect(typeof summary.isLiveDatabase).toBe('boolean');
      expect(summary.sourceNotice).toBeDefined();
    });

    it('getDemoDashboardSummary explicitly flags data as prototype demo', () => {
      const demo = getDemoDashboardSummary();

      expect(demo.isLiveDatabase).toBe(false);
      expect(demo.dataSource).toBe('prototype_demo');
      expect(demo.sourceNotice).toContain('Simulated demonstration records');
    });
  });

  describe('searchCatalogue input validation and filtering', () => {
    it('returns empty array for queries shorter than 2 characters', async () => {
      const results = await searchCatalogue('a');
      expect(results).toEqual([]);
    });

    it('returns empty array for empty string or whitespace', async () => {
      const results = await searchCatalogue('   ');
      expect(results).toEqual([]);
    });

    it('returns empty array for queries longer than 50 characters', async () => {
      const longQuery = 'a'.repeat(51);
      const results = await searchCatalogue(longQuery);
      expect(results).toEqual([]);
    });

    it('successfully matches medicines by name or generic ingredient', async () => {
      const results = await searchCatalogue('Amox');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.category === 'Medicine')).toBe(true);
      expect(results[0].title).toContain('Amoxicillin');
    });

    it('matches sample batch numbers', async () => {
      const results = await searchCatalogue('B-2026');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.category === 'Batch')).toBe(true);
    });

    it('matches sample claims', async () => {
      const results = await searchCatalogue('CLM-2026');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.category === 'Claim')).toBe(true);
    });
  });

  describe('Dashboard Server Actions', () => {
    it('fetchDashboardSummaryAction returns success ActionResult', async () => {
      const res = await fetchDashboardSummaryAction();
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.kpis.totalMedicines.value).toBeDefined();
      }
    });

    it('searchCatalogueAction validates string length and returns VALIDATION_ERROR', async () => {
      const longQuery = 'x'.repeat(51);
      const res = await searchCatalogueAction(longQuery);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('searchCatalogueAction returns valid search results', async () => {
      const res = await searchCatalogueAction('Metformin');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.length).toBeGreaterThan(0);
      }
    });
  });
});
