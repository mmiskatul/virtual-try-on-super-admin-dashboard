import { SubscriptionsPlansView } from '@/features/subscriptions/SubscriptionsPlansView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SubscriptionsPlansView subscriptionId={decodeURIComponent(id)} />;
}
