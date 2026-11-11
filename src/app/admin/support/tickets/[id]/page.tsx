import { SupportCommsGrowthView } from '@/features/operations/SupportCommsGrowthView';

export default function Page({ params }: { params: { id: string } }) {
  return <SupportCommsGrowthView ticketId={decodeURIComponent(params.id)} />;
}
