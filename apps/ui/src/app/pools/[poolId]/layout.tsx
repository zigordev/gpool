'use client';

import { useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import { Badge } from '@/components/ui/Badge';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { Loading } from '@/components/Loading';
import { Icon } from '../../../../design-system/components/icons/Icon.jsx';
import { BsFillDiagram3Fill } from 'react-icons/bs';
import { FaLayerGroup, FaRankingStar } from 'react-icons/fa6';
import { GiSoccerKick } from 'react-icons/gi';
import {
  PoolProvider,
  usePoolContext,
} from '@/contexts/PoolContext';

// Wraps the design-system Icon so it fits the same { className, aria-hidden }
// interface as the react-icons components the sibling tabs use below.
function ManageIcon({ className }: { className?: string }) {
  return <Icon name="settings" className={className} aria-hidden />;
}

function PoolNav() {
  const { t } = useI18n();
  const { setCenter } = useNavCenter();
  const pathname = usePathname();
  const { poolId, pool, poolDeadline, isPastPoolDeadline, groupMissingCount, finalMissingCount, playersMissingCount } = usePoolContext();
  const isPoolAdmin = pool?.userMembership?.role === 'admin';

  const routes = [
    { segment: 'ranking', label: t('poolDetail.tabs.ranking'), shortLabel: t('poolDetail.tabs.short.ranking'), icon: FaRankingStar },
    { segment: 'groups', label: t('poolDetail.tabs.groupPhase'), shortLabel: t('poolDetail.tabs.short.groupPhase'), icon: FaLayerGroup, missingCount: isPastPoolDeadline ? 0 : groupMissingCount },
    { segment: 'final', label: t('poolDetail.tabs.finalPhase'), shortLabel: t('poolDetail.tabs.short.finalPhase'), icon: BsFillDiagram3Fill, missingCount: isPastPoolDeadline ? 0 : finalMissingCount },
    { segment: 'players', label: t('poolDetail.tabs.players'), shortLabel: t('poolDetail.tabs.short.players'), icon: GiSoccerKick, missingCount: isPastPoolDeadline ? 0 : playersMissingCount },
    // Per-pool admin ("Manage") — this pool's own scoring/config/entry-fee
    // settings, distinct from tournament admin (real match results, reached
    // via the account menu). Contextual to this pool, so it lives here
    // rather than in the primary sidebar — previously had no nav entry
    // point at all (only reachable by typing the URL directly).
    ...(isPoolAdmin
      ? [{ segment: 'admin', label: t('poolDetail.actions.administrate'), shortLabel: t('poolDetail.actions.administrate'), icon: ManageIcon }]
      : []),
  ];

  useLayoutEffect(() => {
    setCenter(
      <>
        <div className="nav-center-mobile-countdown"><CountdownChip deadline={poolDeadline} /></div>
        <nav aria-label={t('poolDetail.tabs.label')} className="floating-nav">
          {routes.map((route) => {
            const href = `/pools/${poolId}/${route.segment}`;
            const active = pathname === href || pathname.startsWith(href + '/');
            const Icon = route.icon;
            return (
              <Link
                key={route.segment}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`floating-nav-btn${active ? ' floating-nav-btn--active' : ''}`}
              >
                <Icon className="floating-nav-icon" aria-hidden />
                <span className="floating-nav-label-desktop">{route.label}</span>
                <span className="floating-nav-label-mobile">{route.shortLabel}</span>
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
        </nav>
      </>,
    );
    return () => setCenter(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, poolDeadline, isPastPoolDeadline, groupMissingCount, finalMissingCount, playersMissingCount, poolId]);

  return null;
}

function PoolBreadcrumbs() {
  const pathname = usePathname();
  const { pool, poolDeadline } = usePoolContext();
  const { poolActions, setSubBar } = useNavCenter();

  const isAdminRoute = pathname.includes('/admin');

  useLayoutEffect(() => {
    if (isAdminRoute) return;
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
  }, [pool, poolDeadline, pathname, isAdminRoute, poolActions]);

  return null;
}

function PoolLayoutInner({ children }: Readonly<{ children: React.ReactNode }>) {
  const { t } = useI18n();
  const { loading } = usePoolContext();
  const pathname = usePathname();
  const isAdminRoute = pathname.includes('/admin');

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
      {/* Admin routes render their own subBar (pool name + countdown, no
          poolActions) via AdminBreadcrumbs in admin/layout.tsx — PoolNav's
          tab strip (including "Manage") still applies so admins can move
          between viewing the pool and administering it without a dead end. */}
      {isAdminRoute ? null : <PoolBreadcrumbs />}
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
