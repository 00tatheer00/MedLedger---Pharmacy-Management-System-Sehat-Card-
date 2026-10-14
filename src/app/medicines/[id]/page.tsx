import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { MedicineDetailCard } from '@/components/medicines/medicine-detail-card';
import { getMedicineByIdAction } from '@/modules/medicines/actions';
import { getBatchesAction, getStockMovementsAction } from '@/modules/inventory/actions';

interface MedicineDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function MedicineDetailPage({ params }: MedicineDetailPageProps) {
  await connection();
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const medicineResult = await getMedicineByIdAction(id);
  if (!medicineResult.success || !medicineResult.data) {
    notFound();
  }

  const batchesResult = await getBatchesAction({ medicine_id: id, pageSize: 50 });
  const movementsResult = await getStockMovementsAction({ medicine_id: id, pageSize: 50 });

  const batches = batchesResult.success ? batchesResult.data.batches : [];
  const movements = movementsResult.success ? movementsResult.data.movements : [];

  return (
    <AppShell
      title={`${medicineResult.data.name} — Item Details`}
      subtitle={`Formulary ID: ${medicineResult.data.id} • ${medicineResult.data.category}`}
    >
      <MedicineDetailCard medicine={medicineResult.data} batches={batches} movements={movements} />
    </AppShell>
  );
}
