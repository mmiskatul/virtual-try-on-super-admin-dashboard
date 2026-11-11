import { AiOperationsView } from '@/features/ai/AiOperationsView';

export default function Page({ params }: { params: { id: string } }) {
  return <AiOperationsView jobId={decodeURIComponent(params.id)} />;
}
