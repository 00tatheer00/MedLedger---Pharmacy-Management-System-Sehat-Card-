import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { SupplierForm } from '@/components/suppliers/supplier-form';
import { getSupplierByIdAction } from '@/modules/suppliers/actions';

interface EditSupplierPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function EditSupplierPage({ params }: EditSupplierPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const result = await getSupplierByIdAction(id);
  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <AppShell
      title={`Edit ${result.data.name}`}
      subtitle={`Update Contact, Tax or Address Credentials for ${result.data.id}`}
    >
      <SupplierForm initialSupplier={result.data} isEditing={true} />
    </AppShell>
  );
}
