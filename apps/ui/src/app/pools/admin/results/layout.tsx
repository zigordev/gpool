'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import { Loading } from '@/components/Loading';
import { AdminProvider, useAdminContext } from '@/contexts/AdminContext';

function AdminNav() {
  const { t } = useI18n();
  const { setCenter } = useNavCenter();
  const pathname = usePathname();

  const routes = [
    { segment: 'configuration', label: t('adminResults.tabs.configuration') },
    { segment: 'groups', label: t('adminResults.tabs.groupPhase') },
    { segment: 'final', label: t('adminResults.tabs.finalPhase') },
    { segment: 'players', label: t('adminResults.tabs.players') },
  ];

  useLayoutEffect(() => {
    setCenter(
      <nav aria-label={t('adminResults.tabs.label')} className="floating-nav">
        {routes.map((route) => {
          const href = `/pools/admin/results/${route.segment}`;
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <a
              key={route.segment}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`floating-nav-btn${active ? ' floating-nav-btn--active' : ''}`}
            >
              {route.label}
            </a>
          );
        })}
      </nav>,
    );
    return () => setCenter(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
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
      <AdminNav />
      {children}
    </>
  );
}

export default function AdminResultsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </AdminProvider>
    </ProtectedRoute>
  );
}
