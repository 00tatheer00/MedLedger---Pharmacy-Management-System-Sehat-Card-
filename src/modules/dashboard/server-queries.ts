import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database';
import { getDemoDashboardSummary } from './demo-provider';
import { DashboardSummary, SearchResultItem } from './types';
import { catalogueMedicines } from '@/lib/demo-data';
import { PatientPrototypeStore } from '@/modules/patients/prototype-store';
import { prescriptionStore } from '@/modules/prescriptions/prototype-store';
import { initialSuppliers } from '@/modules/suppliers/prototype-store';
import { initialBatches } from '@/modules/inventory/prototype-store';
import { initialClaimsData } from '@/modules/claims/prototype-store';

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
 * Searches medicines, patients, prescriptions, stock batches, suppliers, claims, and quick actions.
 */
export async function searchCatalogue(rawQuery: string): Promise<SearchResultItem[]> {
  const query = (rawQuery || '').trim();

  // Input constraints: minimum 2 characters, maximum 50 characters
  if (query.length < 2 || query.length > 50) {
    return [];
  }

  const normalized = query.toLowerCase();

  // 1. Matched Quick Actions
  const systemActions: SearchResultItem[] = [
    {
      id: 'act-dispense',
      title: 'Dispense Medicine (دوائی کاؤنٹر)',
      subtitle: 'Open dispensing counter, verify prescriptions & deduct stock',
      category: 'Action',
      badgeText: 'Counter',
      badgeVariant: 'success',
      href: '/dispensing',
    },
    {
      id: 'act-transcribe',
      title: 'Transcribe Prescription (نسخہ اندراج)',
      subtitle: 'Enter handwritten doctor clinical prescription orders',
      category: 'Action',
      badgeText: 'Clinical',
      badgeVariant: 'info',
      href: '/prescriptions/new',
    },
    {
      id: 'act-patient-reg',
      title: 'Register New Patient (مریض اندراج)',
      subtitle: 'Add new patient record & Sehat Sahulat Card entitlement',
      category: 'Action',
      badgeText: 'Intake',
      badgeVariant: 'info',
      href: '/patients/new',
    },
    {
      id: 'act-stock-receive',
      title: 'Receive Stock & Inspection (اسٹاک وصولی)',
      subtitle: 'Record supplier goods receiving and verify batch inspection',
      category: 'Action',
      badgeText: 'Supply',
      badgeVariant: 'warning',
      href: '/purchases/new',
    },
    {
      id: 'act-inventory',
      title: 'Inventory & Stock Surveillance',
      subtitle: 'Check medicine stock levels, batch expiry dates, and alerts',
      category: 'Action',
      badgeText: 'Stock',
      badgeVariant: 'default',
      href: '/inventory',
    },
    {
      id: 'act-reports',
      title: 'Statutory Reports & Financial Audit',
      subtitle: 'View hospital revenue, consumption audits, and CSV statements',
      category: 'Action',
      badgeText: 'Finance',
      badgeVariant: 'muted',
      href: '/reports',
    },
  ];

  const matchedActions = systemActions.filter(
    (a) =>
      a.title.toLowerCase().includes(normalized) || a.subtitle.toLowerCase().includes(normalized),
  );

  // 2. Query Medicines (Catalogue)
  const matchedMedicines = catalogueMedicines
    .filter(
      (m) =>
        m.name.toLowerCase().includes(normalized) ||
        m.genericName.toLowerCase().includes(normalized) ||
        m.category.toLowerCase().includes(normalized) ||
        m.dosageForm.toLowerCase().includes(normalized),
    )
    .slice(0, 6)
    .map((m): SearchResultItem => ({
      id: m.id,
      title: m.name,
      subtitle: `${m.genericName} • ${m.strength} (${m.dosageForm})`,
      category: 'Medicine',
      badgeText: m.category,
      badgeVariant: 'info',
      href: `/medicines?search=${encodeURIComponent(m.name)}`,
    }));

  // 3. Query Patients (Master Directory)
  const patients = PatientPrototypeStore.getAll();
  const matchedPatients = patients
    .filter(
      (p) =>
        p.full_name.toLowerCase().includes(normalized) ||
        p.mr_number.toLowerCase().includes(normalized) ||
        (p.cnic && p.cnic.includes(query)) ||
        (p.phone && p.phone.includes(query)),
    )
    .slice(0, 5)
    .map((p): SearchResultItem => ({
      id: p.id,
      title: p.full_name,
      subtitle: `MRN: ${p.mr_number}${p.cnic ? ` • CNIC: ${p.cnic}` : ''}${p.phone ? ` • ${p.phone}` : ''}`,
      category: 'Patient',
      badgeText: p.gender === 'male' ? 'Male' : 'Female',
      badgeVariant: 'default',
      href: `/patients/${p.id}`,
    }));

  // 4. Query Prescriptions (Queue)
  const prescriptions = prescriptionStore.getAll();
  const matchedPrescriptions = prescriptions
    .filter(
      (rx) =>
        rx.prescription_number.toLowerCase().includes(normalized) ||
        rx.prescriber_name.toLowerCase().includes(normalized) ||
        (rx.patient?.full_name && rx.patient.full_name.toLowerCase().includes(normalized)) ||
        (rx.patient?.mr_number && rx.patient.mr_number.toLowerCase().includes(normalized)),
    )
    .slice(0, 5)
    .map((rx): SearchResultItem => ({
      id: rx.id,
      title: `${rx.prescription_number} — ${rx.patient?.full_name || 'Patient'}`,
      subtitle: `${rx.prescriber_name} • Date: ${rx.prescription_date}`,
      category: 'Prescription',
      badgeText: rx.status.replace('_', ' '),
      badgeVariant:
        rx.status === 'fully_dispensed' ? 'success' : rx.status === 'pending' ? 'warning' : 'info',
      href: `/prescriptions/${rx.id}`,
    }));

  // 5. Query Stock Batches
  const matchedBatches = initialBatches
    .filter((b) => b.batch_number.toLowerCase().includes(normalized))
    .slice(0, 4)
    .map((b): SearchResultItem => ({
      id: b.id,
      title: `Batch ${b.batch_number}`,
      subtitle: `Stock: ${b.quantity_on_hand} units • Expiry: ${b.expiry_date} • Unit: PKR ${b.unit_cost}`,
      category: 'Batch',
      badgeText: b.status,
      badgeVariant:
        b.status === 'available' ? 'success' : b.status === 'expired' ? 'danger' : 'warning',
      href: `/inventory?batch=${encodeURIComponent(b.batch_number)}`,
    }));

  // 6. Query Suppliers
  const matchedSuppliers = initialSuppliers
    .filter(
      (s) =>
        s.name.toLowerCase().includes(normalized) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(normalized)) ||
        (s.phone && s.phone.includes(query)) ||
        (s.ntn_number && s.ntn_number.includes(query)),
    )
    .slice(0, 4)
    .map((s): SearchResultItem => ({
      id: s.id,
      title: s.name,
      subtitle: `Contact: ${s.contact_person || 'N/A'} • Phone: ${s.phone}`,
      category: 'Supplier',
      badgeText: s.is_active ? 'Active' : 'Inactive',
      badgeVariant: s.is_active ? 'success' : 'muted',
      href: `/suppliers/${s.id}`,
    }));

  // 7. Query Reimbursement Claims
  const matchedClaims = initialClaimsData
    .filter(
      (c) =>
        c.claim_number.toLowerCase().includes(normalized) ||
        (c.notes && c.notes.toLowerCase().includes(normalized)) ||
        (c.submitted_by_name && c.submitted_by_name.toLowerCase().includes(normalized)),
    )
    .slice(0, 4)
    .map((c): SearchResultItem => ({
      id: c.id,
      title: `Claim ${c.claim_number}`,
      subtitle: `Total: PKR ${c.total_amount.toLocaleString()} • ${c.submitted_by_name || 'Hospital Staff'}`,
      category: 'Claim',
      badgeText: c.status.replace('_', ' '),
      badgeVariant:
        c.status === 'approved' ? 'success' : c.status === 'partially_paid' ? 'warning' : 'info',
      href: `/claims?ref=${encodeURIComponent(c.claim_number)}`,
    }));

  return [
    ...matchedActions,
    ...matchedMedicines,
    ...matchedPatients,
    ...matchedPrescriptions,
    ...matchedBatches,
    ...matchedSuppliers,
    ...matchedClaims,
  ];
}
