import { TenantGovernanceView } from '@/features/tenants/TenantGovernanceView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TenantGovernanceView mode="detail" tenantId={decodeURIComponent(id)} detailTab="subscription" />;
}
