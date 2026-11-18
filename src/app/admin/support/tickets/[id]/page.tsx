import { SupportCommsGrowthView } from '@/features/operations/SupportCommsGrowthView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupportCommsGrowthView ticketId={decodeURIComponent(id)} />;
}
