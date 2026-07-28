'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useI18n } from '@/i18n/client';
import { Loading } from '@/components/Loading';
import {
  PoolProvider,
  usePoolContext,
} from '@/contexts/PoolContext';

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

  return <>{children}</>;
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
