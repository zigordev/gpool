import { redirect } from 'next/navigation';

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ poolId?: string }>;
}) {
  const { poolId } = await searchParams;
  const destination = poolId
    ? `/pools/admin/results/configuration?poolId=${encodeURIComponent(poolId)}`
    : '/pools/admin/results/configuration';
  redirect(destination);
}
