'use client';

import { useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import { Badge } from '@/components/ui/Badge';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { Loading } from '@/components/Loading';
import { IoSettings } from 'react-icons/io5';

const MEMBER_SEGMENT_TO_ADMIN: Record<string, string> = { rules: 'rules', ranking: 'ranking', groups: 'groups', final: 'final', players: 'players' };
import {
  PoolProvider,
  usePoolContext,
} from '@/contexts/PoolContext';

function PoolNav() {
  const { t } = useI18n();
  const { setCenter } = useNavCenter();
  const pathname = usePathname();
  const { poolId, isPastPoolDeadline, groupMissingCount, finalMissingCount, playersMissingCount } = usePoolContext();

  const routes: Array<{ segment: string; label: string; missingCount?: number }> = [
    { segment: 'rules', label: t('poolDetail.tabs.rules') },
    { segment: 'ranking', label: t('poolDetail.tabs.ranking') },
    { segment: 'groups', label: t('poolDetail.tabs.groupPhase'), missingCount: isPastPoolDeadline ? 0 : groupMissingCount },
    { segment: 'final', label: t('poolDetail.tabs.finalPhase'), missingCount: isPastPoolDeadline ? 0 : finalMissingCount },
    { segment: 'players', label: t('poolDetail.tabs.players'), missingCount: isPastPoolDeadline ? 0 : playersMissingCount },
  ];

  useLayoutEffect(() => {
    setCenter(
      <nav aria-label={t('poolDetail.tabs.label')} className="floating-nav">
        {routes.map((route) => {
          const href = `/pools/${poolId}/${route.segment}`;
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={route.segment}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`floating-nav-btn${active ? ' floating-nav-btn--active' : ''}`}
            >
              <span>{route.label}</span>
              {route.missingCount ? (
                <Badge
                  variant="sunset"
                  className="badge-attention"
                  title={t('poolDetail.tabs.missingCount', { count: route.missingCount })}
                  aria-label={t('poolDetail.tabs.missingCount', { count: route.missingCount })}
                  leadingIcon={
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                      <path d="M12 9v4" /><path d="M12 17h.01" />
                    </svg>
                  }
                >
                  {route.missingCount}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>,
    );
    return () => setCenter(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isPastPoolDeadline, groupMissingCount, finalMissingCount, playersMissingCount, poolId]);

  return null;
}

function PoolBreadcrumbs() {
  const { t } = useI18n();
  const { user } = useAuth();
  const pathname = usePathname();
  const { pool, poolId, poolDeadline } = usePoolContext();
  const { setSubBar } = useNavCenter();

  const isPoolAdmin = user?.role === 'admin' && user.userId === pool?.adminUserId;
  const isAdminRoute = pathname.includes('/admin');

  const routes = [
    { segment: 'rules', label: t('poolDetail.tabs.rules') },
    { segment: 'ranking', label: t('poolDetail.tabs.ranking') },
    { segment: 'groups', label: t('poolDetail.tabs.groupPhase') },
    { segment: 'final', label: t('poolDetail.tabs.finalPhase') },
    { segment: 'players', label: t('poolDetail.tabs.players') },
  ];

  const activeRoute = routes.find(({ segment }) => {
    const href = `/pools/${poolId}/${segment}`;
    return pathname === href || pathname.startsWith(href + '/');
  });

  useLayoutEffect(() => {
    if (isAdminRoute) return;
    setSubBar(
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', gap: '1rem' }}>
        <nav aria-label="breadcrumb" style={{ minWidth: 0 }}>
          <ol className="breadcrumb">
            <li><Link href="/pools">{t('pools.title')}</Link></li>
            <li aria-hidden><span className="breadcrumb-separator">›</span></li>
            <li>
              <span className="breadcrumb-current" aria-current="page">{pool?.name ?? '…'}</span>
            </li>
          </ol>
        </nav>
        <div style={{ display: 'flex', justifyContent: 'center' }}><CountdownChip deadline={poolDeadline} /></div>
        <div className="nav-sub-bar-actions" style={{ justifySelf: 'end' }}>
          {isPoolAdmin ? (
            <div
              role="group"
              aria-label={t('poolDetail.mode.label')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid rgb(var(--border))',
                borderRadius: '999px',
                overflow: 'hidden',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              <span
                aria-current="true"
                style={{
                  padding: '0.22rem 0.6rem',
                  background: 'rgb(var(--fg) / 0.10)',
                  color: 'rgb(var(--fg))',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('poolDetail.mode.member')}
              </span>
              <Link
                href={`/pools/${poolId}/admin/${MEMBER_SEGMENT_TO_ADMIN[activeRoute?.segment || ''] || 'groups'}`}
                style={{
                  padding: '0.22rem 0.6rem',
                  background: 'transparent',
                  color: 'rgb(var(--fg-muted))',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <IoSettings size={10} aria-hidden />
                {t('poolDetail.mode.admin')}
              </Link>
            </div>
          ) : null}
        </div>
      </div>,
    );
    return () => setSubBar(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, isPoolAdmin, poolDeadline, poolId, pathname, isAdminRoute]);

  return null;
}

function PoolLayoutInner({ children }: Readonly<{ children: React.ReactNode }>) {
  const { t } = useI18n();
  const { loading } = usePoolContext();
  const pathname = usePathname();
  const isAdminRoute = pathname.includes('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-2xl)', minHeight: '60vh' }}>
        <Loading message={t('poolDetail.loading')} />
      </main>
    );
  }

  return (
    <>
      <PoolNav />
      <PoolBreadcrumbs />
      <div style={{ marginTop: '1.75rem' }}>
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
