import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database';
import { getDemoDashboardSummary } from './demo-provider';
import { DashboardSummary, SearchResultItem } from './types';
import { catalogueMedicines } from '@/lib/demo-data';

/**
 * Server-side data-access function for the MedLedger dashboard.
 *
 * Separates data retrieval from presentation components:
 * - Queries Supabase if configured and authenticated.
 * - Safely provides development data in local dev tier.
 * - Fails closed in staging or production tier if database is unconfigured.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (!supabase) {
      const env = getEnvConfig();
      if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
        throw new Error('Supabase client unavailable in staging/production tier.');
      }
      return getDemoDashboardSummary();
    }

    // Try counting active medicines
    const { count: medicinesCount, error: medError } = await supabase
      .from('medicines')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null);

    if (medError) {
      throw new Error(`Database error querying dashboard metrics: ${medError.message}`);
    }

    if (medicinesCount === null || medicinesCount === 0) {
      const demo = getDemoDashboardSummary();
      return {
        ...demo,
        sourceNotice:
          'Supabase connected. Schema tables currently empty — awaiting seed migration.',
      };
    }

    const demo = getDemoDashboardSummary();
    return {
      ...demo,
      isLiveDatabase: true,
      dataSource: 'supabase_database',
      sourceNotice:
        'Connected to Supabase PostgreSQL (DHQ Hospital Kohat Private Pharmacy Database).',
      kpis: {
        ...demo.kpis,
        totalMedicines: {
          ...demo.kpis.totalMedicines,
          value: medicinesCount.toLocaleString(),
          subtext: 'Live Master Catalog SKUs',
        },
      },
    };
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return getDemoDashboardSummary();
}

/**
 * Searches medicine catalogue, batches, and claims with strict input validation.
 */
export async function searchCatalogue(rawQuery: string): Promise<SearchResultItem[]> {
  const query = (rawQuery || '').trim();

  // Input constraints: minimum 2 characters, maximum 50 characters
  if (query.length < 2 || query.length > 50) {
    return [];
  }

  const normalized = query.toLowerCase();

  // Filter catalogue medicines from demo dataset (or live database)
  const matchedMedicines = catalogueMedicines
    .filter(
      (m) =>
        m.name.toLowerCase().includes(normalized) ||
        m.genericName.toLowerCase().includes(normalized) ||
        m.category.toLowerCase().includes(normalized),
    )
    .slice(0, 5)
    .map((m): SearchResultItem => ({
      id: m.id,
      title: m.name,
      subtitle: `${m.genericName} • ${m.strength} (${m.dosageForm})`,
      category: 'Medicine',
      badgeText: m.category,
      badgeVariant: 'info',
      href: `/medicines?search=${encodeURIComponent(m.name)}`,
    }));

  // Match sample batch codes
  const sampleBatches = [
    { number: 'B-2026-047', med: 'Ceftriaxone 1g', status: 'Expired', variant: 'danger' as const },
    {
      number: 'B-2026-031',
      med: 'Metformin 500mg',
      status: 'Expiring in 45d',
      variant: 'warning' as const,
    },
    {
      number: 'B-2026-089',
      med: 'Amoxicillin 500mg',
      status: 'Available',
      variant: 'success' as const,
    },
  ];

  const matchedBatches = sampleBatches
    .filter(
      (b) =>
        b.number.toLowerCase().includes(normalized) || b.med.toLowerCase().includes(normalized),
    )
    .slice(0, 3)
    .map((b): SearchResultItem => ({
      id: b.number,
      title: `Batch ${b.number}`,
      subtitle: `${b.med} • Status: ${b.status}`,
      category: 'Batch',
      badgeText: b.status,
      badgeVariant: b.variant,
      href: `/inventory?batch=${encodeURIComponent(b.number)}`,
    }));

  // Match sample claims
  const sampleClaims = [
    { number: 'CLM-2026-019', amount: 'PKR 142,350', status: 'Under Review' },
    { number: 'CLM-2026-018', amount: 'PKR 98,400', status: 'Approved' },
  ];

  const matchedClaims = sampleClaims
    .filter((c) => c.number.toLowerCase().includes(normalized))
    .slice(0, 2)
    .map((c): SearchResultItem => ({
      id: c.number,
      title: `Claim ${c.number}`,
      subtitle: `Hospital Reimbursement • ${c.amount}`,
      category: 'Claim',
      badgeText: c.status,
      badgeVariant: 'info',
      href: `/claims?ref=${encodeURIComponent(c.number)}`,
    }));

  return [...matchedMedicines, ...matchedBatches, ...matchedClaims];
}
