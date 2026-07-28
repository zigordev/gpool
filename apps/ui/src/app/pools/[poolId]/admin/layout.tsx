'use client';

import { useLayoutEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import { Loading } from '@/components/Loading';
import { AdminProvider, fromDateTimeLocal, useAdminContext } from '@/contexts/AdminContext';
import { CountdownChip } from '@/components/ui/CountdownChip';

function AdminBreadcrumbs() {
  const { poolName, deadlineLocal } = useAdminContext();
  const { setSubBar } = useNavCenter();
  const deadlineMs = fromDateTimeLocal(deadlineLocal);

  useLayoutEffect(() => {
    setSubBar(
      <div className="pool-header-strip">
        <div className="pool-header-name">
          <span className="nav-pool-name">{poolName || '…'}</span>
        </div>
        <div className="pool-header-countdown"><CountdownChip deadline={deadlineMs} /></div>
        <div className="nav-sub-bar-actions pool-header-actions" />
      </div>,
    );
    return () => setSubBar(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolName, deadlineLocal]);

  return null;
}

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

  return (
    <>
      <AdminBreadcrumbs />
      <div style={{ marginTop: '0.65rem' }}>
        {children}
      </div>
    </>
  );
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { poolId } = useParams<{ poolId: string }>();
  return (
    <AdminProvider poolId={poolId}>
      <AdminLayoutInner poolId={poolId}>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}
