import Link from 'next/link';
import { connection } from 'next/server';
import { FileX } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchClaimById } from '@/modules/claims/server-queries';
import { ClaimDetailView } from '@/components/claims/claim-detail-view';

interface ClaimDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function ClaimDetailPage({ params }: ClaimDetailPageProps) {
  await connection();
  const resolvedParams = await params;
  const claim = await fetchClaimById(resolvedParams.id);

  if (!claim) {
    return (
      <AppShell title="Hospital Claim" subtitle="DHQ Hospital Kohat">
        <div className="space-y-3">
          <Breadcrumbs
            items={[
              { label: 'Claims', href: '/claims' },
              { label: 'Claim Not Found', current: true },
            ]}
          />

          <div className="py-16">
            <EmptyState
              icon={FileX}
              title="Reimbursement Claim Not Found"
              description="The requested reimbursement claim reference does not exist or has been deleted."
              action={
                <Link href="/claims">
                  <Button size="sm" className="mt-2">
                    Return to Claims Queue
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
    <AppShell title={`Claim — ${claim.claim_number}`} subtitle="DHQ Hospital Kohat">
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: 'Claims', href: '/claims' },
            { label: claim.claim_number, current: true },
          ]}
        />

        <ClaimDetailView initialClaim={claim} />
      </div>
    </AppShell>
  );
}
