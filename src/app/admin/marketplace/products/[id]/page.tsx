import { MarketplaceModerationView } from '@/features/marketplace/MarketplaceModerationView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MarketplaceModerationView productId={decodeURIComponent(id)} />;
}
