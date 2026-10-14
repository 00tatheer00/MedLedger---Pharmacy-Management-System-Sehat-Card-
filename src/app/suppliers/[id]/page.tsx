import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { SupplierDetailCard } from '@/components/suppliers/supplier-detail-card';
import { getSupplierByIdAction } from '@/modules/suppliers/actions';
import { getPurchaseOrdersAction } from '@/modules/purchasing/actions';

interface SupplierDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  await connection();
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const supplierResult = await getSupplierByIdAction(id);
  if (!supplierResult.success || !supplierResult.data) {
    notFound();
  }

  const ordersResult = await getPurchaseOrdersAction({
    supplier_id: id,
    pageSize: 50,
  });

  const orders = ordersResult.success && ordersResult.data ? ordersResult.data.orders : [];

  return (
    <AppShell
      title={`${supplierResult.data.name} — Vendor Profile`}
      subtitle={`Distributor ID: ${supplierResult.data.id} • ${supplierResult.data.is_active ? 'Active Partner' : 'Inactive'}`}
    >
      <SupplierDetailCard supplier={supplierResult.data} orders={orders} />
    </AppShell>
  );
}
