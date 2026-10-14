import { AppShell } from '@/components/layout/app-shell';
import { PurchaseOrderForm } from '@/components/purchasing/purchase-order-form';
import { getSuppliersAction } from '@/modules/suppliers/actions';
import { getMedicinesAction } from '@/modules/medicines/actions';

interface NewPurchaseOrderPageProps {
  searchParams: Promise<{
    supplierId?: string;
  }>;
}

export const instant = false;

export default async function NewPurchaseOrderPage({ searchParams }: NewPurchaseOrderPageProps) {
  const resolvedParams = await searchParams;
  const preselectedSupplierId = resolvedParams.supplierId || '';

  // Fetch active suppliers
  const suppliersRes = await getSuppliersAction({
    status: 'active',
    pageSize: 100,
  });
  const suppliers = suppliersRes.success && suppliersRes.data ? suppliersRes.data.suppliers : [];

  // Fetch active medicines catalogue
  const medicinesRes = await getMedicinesAction({ status: 'active' }, { pageSize: 200 });
  const medicines = medicinesRes.success && medicinesRes.data ? medicinesRes.data.medicines : [];

  return (
    <AppShell
      title="Create Purchase Order"
      subtitle="Issue Procurement Requisition to Authorized Pharmaceutical Distributor"
    >
      <PurchaseOrderForm
        suppliers={suppliers}
        medicines={medicines}
        preselectedSupplierId={preselectedSupplierId}
      />
    </AppShell>
  );
}
