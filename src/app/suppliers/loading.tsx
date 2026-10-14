import { AppShell } from '@/components/layout/app-shell';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function SuppliersLoading() {
  return (
    <AppShell
      title="Supplier & Vendor Directory"
      subtitle="Authorized Pharmaceutical Distributors & Drug License Registrations"
    >
      <TableSkeleton
        title="Supplier & Vendor Directory"
        subtitle="Licensed pharmaceutical distributors, NTN records, and supply history."
        actionText="+ Register Supplier"
      />
    </AppShell>
  );
}
