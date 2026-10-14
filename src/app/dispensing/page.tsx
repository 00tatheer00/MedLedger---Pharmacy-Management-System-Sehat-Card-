import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { DispensingClientView } from '@/components/dispensing';
import { getPrescriptions } from '@/modules/prescriptions/server-queries';
import { fetchDispensingRecords, fetchDispensingKPIs } from '@/modules/dispensing/server-queries';

export const instant = false;

export default async function DispensingPage() {
  await connection();
  const [prescriptionsRes, dispensingRes, kpis] = await Promise.all([
    getPrescriptions({ pageSize: 50 }),
    fetchDispensingRecords({ pageSize: 50 }),
    fetchDispensingKPIs(),
  ]);

  return (
    <AppShell
      title="Medicine Dispensing Counter"
      subtitle="DHQ Hospital Kohat — Central Dispensary & Stock Deductions"
    >
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: 'Dispensing Counter', current: true }]} />

        <DispensingClientView
          initialPrescriptions={prescriptionsRes.prescriptions}
          initialDispensingRecords={dispensingRes.records}
          kpis={kpis}
        />
      </div>
    </AppShell>
  );
}
