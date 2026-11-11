import { SubscriptionsPlansView } from '@/features/subscriptions/SubscriptionsPlansView';

export default function Page({ params }: { params: { id: string } }) {
  return <SubscriptionsPlansView planId={decodeURIComponent(params.id)} />;
}
