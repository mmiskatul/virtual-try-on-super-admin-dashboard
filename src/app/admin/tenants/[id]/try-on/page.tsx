import { TenantGovernanceView } from '@/features/tenants/TenantGovernanceView';

export default function Page({ params }: { params: { id: string } }) {
  return <TenantGovernanceView mode="detail" tenantId={decodeURIComponent(params.id)} detailTab="try-on" />;
}
