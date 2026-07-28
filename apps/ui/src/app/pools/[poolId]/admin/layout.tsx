'use client';

import { useParams } from 'next/navigation';
import { useI18n } from '@/i18n/client';
import { Loading } from '@/components/Loading';
import { AdminProvider, useAdminContext } from '@/contexts/AdminContext';

function AdminLayoutInner({ children }: Readonly<{ poolId: string; children: React.ReactNode }>) {
  const { t } = useI18n();
  const { loading } = useAdminContext();

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-2xl)', minHeight: '60vh' }}>
        <Loading message={t('common.loading')} />
      </main>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { poolId } = useParams<{ poolId: string }>();
  return (
    <AdminProvider poolId={poolId}>
      <AdminLayoutInner poolId={poolId}>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}
