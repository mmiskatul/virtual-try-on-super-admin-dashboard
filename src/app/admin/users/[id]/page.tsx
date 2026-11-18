import { UsersStaffView } from '@/features/users/UsersStaffView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UsersStaffView userId={decodeURIComponent(id)} />;
}
