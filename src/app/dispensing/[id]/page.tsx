import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { DispensingDetailCard } from '@/components/dispensing';
import { fetchDispensingById } from '@/modules/dispensing/server-queries';

interface DispensingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function DispensingDetailPage({ params }: DispensingDetailPageProps) {
  await connection();
  const { id } = await params;
  const record = await fetchDispensingById(id);

  if (!record) {
    notFound();
  }

  return (
    <AppShell
      title={`Dispensing Record ${record.dispensing_number}`}
      subtitle="DHQ Hospital Kohat — Medicine Issuance Audit"
    >
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: 'Dispensing Counter', href: '/dispensing' },
            { label: record.dispensing_number, current: true },
          ]}
        />

        <DispensingDetailCard initialRecord={record} />
      </div>
    </AppShell>
  );
}
