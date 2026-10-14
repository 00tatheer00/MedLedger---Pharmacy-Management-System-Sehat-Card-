import { AppShell } from '@/components/layout/app-shell';
import { SupplierForm } from '@/components/suppliers/supplier-form';

export default function NewSupplierPage() {
  return (
    <AppShell
      title="Register New Supplier"
      subtitle="Onboard Authorized Pharmaceutical Distributor or Medical Vendor"
    >
      <SupplierForm />
    </AppShell>
  );
}
