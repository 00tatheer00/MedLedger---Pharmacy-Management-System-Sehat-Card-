import { AppShell } from '@/components/layout/app-shell';
import { ClaimCreationForm } from '@/components/claims/claim-creation-form';

export default function NewClaimPage() {
  return (
    <AppShell title="Prepare Reimbursement Claim" subtitle="DHQ Hospital Kohat">
      <ClaimCreationForm />
    </AppShell>
  );
}
