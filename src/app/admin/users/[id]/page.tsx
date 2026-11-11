import { UsersStaffView } from '@/features/users/UsersStaffView';

export default function Page({ params }: { params: { id: string } }) {
  return <UsersStaffView userId={decodeURIComponent(params.id)} />;
}
