import { redirect } from 'next/navigation';

export default async function AdminIndexPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  redirect(`/pools/${poolId}/admin/groups`);
}
