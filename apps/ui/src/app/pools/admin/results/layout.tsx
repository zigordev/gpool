'use client';

import { useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import { Loading } from '@/components/Loading';
import { AdminProvider, useAdminContext } from '@/contexts/AdminContext';

function AdminNav() {
  const { t } = useI18n();
  const { setCenter } = useNavCenter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const poolId = searchParams.get('poolId');

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
          const base = `/pools/admin/results/${route.segment}`;
          const href = poolId ? `${base}?poolId=${encodeURIComponent(poolId)}` : base;
          const active = pathname === base || pathname.startsWith(base + '/');
          return (
            <Link
              key={route.segment}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`floating-nav-btn${active ? ' floating-nav-btn--active' : ''}`}
            >
              {route.label}
            </Link>
          );
        })}
      </nav>,
    );
    return () => setCenter(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, poolId]);

  return null;
}

function AdminBreadcrumbs() {
  const { t } = useI18n();
  const { poolId, poolName } = useAdminContext();
  const { setSubBar } = useNavCenter();
  const pathname = usePathname();

  const routes = [
    { segment: 'configuration', label: t('adminResults.tabs.configuration') },
    { segment: 'groups', label: t('adminResults.tabs.groupPhase') },
    { segment: 'final', label: t('adminResults.tabs.finalPhase') },
    { segment: 'players', label: t('adminResults.tabs.players') },
  ];

  const activeRoute = routes.find(({ segment }) => {
    const href = `/pools/admin/results/${segment}`;
    return pathname === href || pathname.startsWith(href + '/');
  });

  const poolHref = poolId && poolId !== 'all-pools' ? `/pools/${poolId}/ranking` : '/pools';

  useLayoutEffect(() => {
    setSubBar(
      <div style={{ display: 'contents' }}>
        <nav aria-label="breadcrumb" style={{ minWidth: 0 }}>
          <ol className="breadcrumb">
            <li><Link href="/pools">{t('pools.title')}</Link></li>
            <li aria-hidden><span className="breadcrumb-separator">›</span></li>
            {poolName ? (
              <>
                <li><Link href={poolHref}>{poolName}</Link></li>
                <li aria-hidden><span className="breadcrumb-separator">›</span></li>
              </>
            ) : null}
            <li aria-hidden={!activeRoute || undefined}>
              {activeRoute ? (
                <Link href={poolId ? `/pools/admin/results/configuration?poolId=${encodeURIComponent(poolId)}` : '/pools/admin/results/configuration'}>
                  {t('nav.admin')}
                </Link>
              ) : (
                <span className="breadcrumb-current" aria-current="page">{t('nav.admin')}</span>
              )}
            </li>
            {activeRoute ? (
              <>
                <li aria-hidden><span className="breadcrumb-separator">›</span></li>
                <li>
                  <span className="breadcrumb-current" aria-current="page">
                    {activeRoute.label}
                  </span>
                </li>
              </>
            ) : null}
          </ol>
        </nav>
      </div>,
    );
    return () => setSubBar(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId, poolName, pathname]);

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
      <AdminBreadcrumbs />
      <div style={{ marginTop: '1.75rem' }}>
        {children}
      </div>
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
