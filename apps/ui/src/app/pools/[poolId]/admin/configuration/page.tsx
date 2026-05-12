import { redirect } from 'next/navigation';

export default async function AdminConfigurationPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  redirect(`/pools/${poolId}/admin/groups`);
}
