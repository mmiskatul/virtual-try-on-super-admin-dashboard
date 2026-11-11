import { MarketplaceModerationView } from '@/features/marketplace/MarketplaceModerationView';

export default function Page({ params }: { params: { id: string } }) {
  return <MarketplaceModerationView productId={decodeURIComponent(params.id)} />;
}
