'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { Loading } from '@/components/Loading';
import {
  PoolProvider,
  usePoolContext,
} from '@/contexts/PoolContext';

/**
 * The pool's sections live in the Sidebar now (see AppNav) — this only
 * contributes the pool's own header strip: name, deadline countdown, and
 * whatever page-level actions the active section registered.
 */
function PoolBreadcrumbs() {
  const pathname = usePathname();
  const { pool, poolDeadline } = usePoolContext();
  const { poolActions, setSubBar } = useNavCenter();

  useLayoutEffect(() => {
    setSubBar(
      <div className="pool-header-strip">
        <div className="pool-header-name">
          <span className="nav-pool-name">{pool?.name ?? '…'}</span>
        </div>
        <div className="pool-header-countdown"><CountdownChip deadline={poolDeadline} /></div>
        <div className="nav-sub-bar-actions pool-header-actions">
          {poolActions}
        </div>
      </div>,
    );
    return () => setSubBar(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, poolDeadline, pathname, poolActions]);

  return null;
}

function PoolLayoutInner({ children }: Readonly<{ children: React.ReactNode }>) {
  const { t } = useI18n();
  const { loading } = usePoolContext();

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-2xl)', minHeight: '60vh' }}>
        <Loading message={t('poolDetail.loading')} />
      </main>
    );
  }

  return (
    <>
      <PoolBreadcrumbs />
      <div style={{ marginTop: '0.65rem' }}>
        {children}
      </div>
    </>
  );
}

export default function PoolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ProtectedRoute>
      <PoolProvider>
        <PoolLayoutInner>{children}</PoolLayoutInner>
      </PoolProvider>
    </ProtectedRoute>
  );
}
