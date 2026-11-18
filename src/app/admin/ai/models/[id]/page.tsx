import { AiOperationsView } from '@/features/ai/AiOperationsView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AiOperationsView modelId={decodeURIComponent(id)} />;
}
