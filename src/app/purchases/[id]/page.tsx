import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { PurchaseOrderDetailCard } from '@/components/purchasing/purchase-order-detail-card';
import {
  getPurchaseOrderByIdAction,
  getGoodsReceiptsAction,
  getSupplierInvoicesAction,
} from '@/modules/purchasing/actions';

interface PurchaseOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function PurchaseOrderDetailPage({ params }: PurchaseOrderDetailPageProps) {
  await connection();
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const poResult = await getPurchaseOrderByIdAction(id);
  if (!poResult.success || !poResult.data) {
    notFound();
  }

  const receiptsResult = await getGoodsReceiptsAction({
    purchase_order_id: id,
    pageSize: 50,
  });

  const invoicesResult = await getSupplierInvoicesAction({
    purchase_order_id: id,
    pageSize: 50,
  });

  const receipts =
    receiptsResult.success && receiptsResult.data ? receiptsResult.data.receipts : [];
  const invoices =
    invoicesResult.success && invoicesResult.data ? invoicesResult.data.invoices : [];

  return (
    <AppShell
      title={`PO #${poResult.data.po_number} — Order Details`}
      subtitle={`Supplier: ${poResult.data.supplier_name || poResult.data.supplier?.name || 'Distributor'} • Order Date: ${poResult.data.order_date}`}
    >
      <PurchaseOrderDetailCard order={poResult.data} receipts={receipts} invoices={invoices} />
    </AppShell>
  );
}
