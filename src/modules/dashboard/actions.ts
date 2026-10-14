'use server';

import { getDashboardSummary, searchCatalogue } from './server-queries';
import { DashboardSummary, SearchResultItem } from './types';
import { ActionResult, successResult, errorResult } from '@/core/errors/types';

/**
 * Server Action: Fetch dashboard summary metrics.
 */
export async function fetchDashboardSummaryAction(): Promise<ActionResult<DashboardSummary>> {
  try {
    const summary = await getDashboardSummary();
    return successResult(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve dashboard metrics.';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Search medicine catalogue, batches, and claims.
 */
export async function searchCatalogueAction(
  query: string,
): Promise<ActionResult<SearchResultItem[]>> {
  try {
    const trimmed = (query || '').trim();
    if (trimmed.length > 50) {
      return errorResult('VALIDATION_ERROR', 'Search query cannot exceed 50 characters.');
    }

    const results = await searchCatalogue(trimmed);
    return successResult(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search operation failed.';
    return errorResult('INTERNAL_ERROR', message);
  }
}
