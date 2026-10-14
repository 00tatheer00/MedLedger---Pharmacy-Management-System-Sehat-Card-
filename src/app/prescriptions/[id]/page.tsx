import Link from 'next/link';
import { connection } from 'next/server';
import { FileX } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PrescriptionDetailCard } from '@/components/prescriptions/prescription-detail-card';
import { getPrescriptionById } from '@/modules/prescriptions/server-queries';

interface PrescriptionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function PrescriptionDetailPage({ params }: PrescriptionDetailPageProps) {
  await connection();
  const resolvedParams = await params;
  const prescription = await getPrescriptionById(resolvedParams.id);

  if (!prescription) {
    return (
      <AppShell title="Prescription Order" subtitle="DHQ Hospital Kohat">
        <div className="space-y-3">
          <Breadcrumbs
            items={[
              { label: 'Prescriptions', href: '/prescriptions' },
              { label: 'Order Not Found', current: true },
            ]}
          />

          <div className="py-16">
            <EmptyState
              icon={FileX}
              title="Prescription Not Found"
              description="The requested prescription identifier does not exist or has been archived."
              action={
                <Link href="/prescriptions">
                  <Button variant="primary" size="sm" className="mt-2">
                    Return to Prescription Queue
                  </Button>
                </Link>
              }
            />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Prescription ${prescription.prescription_number}`}
      subtitle="DHQ Hospital Kohat — Clinical Order Detail"
    >
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: 'Prescriptions', href: '/prescriptions' },
            { label: prescription.prescription_number, current: true },
          ]}
        />

        <PrescriptionDetailCard prescription={prescription} />
      </div>
    </AppShell>
  );
}
