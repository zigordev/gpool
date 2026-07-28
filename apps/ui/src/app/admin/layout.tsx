'use client';

import { Loading } from '@/components/Loading';
import { AdminProvider, useAdminContext } from '@/contexts/AdminContext';
import { useI18n } from '@/i18n/client';

/**
 * Tournament administration — the real match results and player actions
 * every pool is graded against. Its sections live in the Sidebar (see
 * AppNav's tournament-admin branch); this only handles the data provider
 * and loading state.
 */
function SystemAdminContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const { loading } = useAdminContext();
  const { t } = useI18n();

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-2xl)', minHeight: '60vh' }}>
        <Loading message={t('common.loading')} />
      </main>
    );
  }

  return <div style={{ marginTop: '0.65rem' }}>{children}</div>;
}

export default function SystemAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdminProvider poolId="all-pools" systemMode>
      <SystemAdminContent>{children}</SystemAdminContent>
    </AdminProvider>
  );
}
