import { AppShell } from '@/components/layout/app-shell';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function PurchasesLoading() {
  return (
    <AppShell
      title="Procurement & Goods Receiving"
      subtitle="Purchase Orders, Physical Receiving Inspection (GRN) & Accounts Payable"
    >
      <TableSkeleton
        title="Purchase Orders & Procurement"
        subtitle="Purchase order authorizations, supplier contracts, and receiving queue."
        actionText="+ New Purchase Order"
      />
    </AppShell>
  );
}
