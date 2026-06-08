'use client';

import { useLayoutEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import { Loading } from '@/components/Loading';
import { Badge } from '@/components/ui/Badge';
import { AdminProvider, fromDateTimeLocal, useAdminContext } from '@/contexts/AdminContext';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { BsFillDiagram3Fill } from 'react-icons/bs';
import { FaLayerGroup, FaRankingStar } from 'react-icons/fa6';
import { GiSoccerKick } from 'react-icons/gi';
import { IoSettings } from 'react-icons/io5';

function AdminNav({ poolId }: { poolId: string }) {
  const { t } = useI18n();
  const { setCenter } = useNavCenter();
  const pathname = usePathname();
  const { deadlineLocal, groupConfigMissingCount, finalConfigMissingCount, playersConfigMissingCount } = useAdminContext();
  const deadlineMs = fromDateTimeLocal(deadlineLocal);

  const routes = [
    { segment: 'ranking', href: `/pools/${poolId}/admin/ranking`, label: t('poolDetail.tabs.ranking'),    shortLabel: t('poolDetail.tabs.short.ranking'),    icon: FaRankingStar },
    { segment: 'groups',  href: `/pools/${poolId}/admin/groups`,  label: t('poolDetail.tabs.groupPhase'), shortLabel: t('poolDetail.tabs.short.groupPhase'), icon: FaLayerGroup, missingCount: groupConfigMissingCount },
    { segment: 'final',   href: `/pools/${poolId}/admin/final`,   label: t('poolDetail.tabs.finalPhase'), shortLabel: t('poolDetail.tabs.short.finalPhase'), icon: BsFillDiagram3Fill, missingCount: finalConfigMissingCount },
    { segment: 'players', href: `/pools/${poolId}/admin/players`, label: t('poolDetail.tabs.players'),    shortLabel: t('poolDetail.tabs.short.players'),    icon: GiSoccerKick, missingCount: playersConfigMissingCount },
  ];

  useLayoutEffect(() => {
    setCenter(
      <>
        <div className="nav-center-mobile-countdown"><CountdownChip deadline={deadlineMs} /></div>
        <nav aria-label={t('adminResults.tabs.label')} className="floating-nav">
          {routes.map((route) => {
            const active = pathname === route.href || pathname.startsWith(route.href + '/');
            const Icon = route.icon;
            return (
              <Link
                key={route.segment}
                href={route.href}
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
                    title={t('adminResults.tabs.missingConfigCount', { count: route.missingCount })}
                    aria-label={t('adminResults.tabs.missingConfigCount', { count: route.missingCount })}
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
  }, [pathname, poolId, deadlineLocal, groupConfigMissingCount, finalConfigMissingCount, playersConfigMissingCount]);

  return null;
}

const ADMIN_SEGMENT_TO_MEMBER: Record<string, string> = { ranking: 'ranking', groups: 'groups', final: 'final', players: 'players' };

function AdminBreadcrumbs({ poolId }: { poolId: string }) {
  const { t } = useI18n();
  const { poolName, deadlineLocal } = useAdminContext();
  const { setSubBar } = useNavCenter();
  const pathname = usePathname();

  const adminRoutes = [
    { segment: 'ranking', label: t('poolDetail.tabs.ranking')     },
    { segment: 'groups',  label: t('poolDetail.tabs.groupPhase')  },
    { segment: 'final',   label: t('poolDetail.tabs.finalPhase')  },
    { segment: 'players', label: t('poolDetail.tabs.players')     },
  ];

  const activeRoute = adminRoutes.find(({ segment }) => {
    const href = `/pools/${poolId}/admin/${segment}`;
    return pathname === href || pathname.startsWith(href + '/');
  });

  const memberCounterpart = ADMIN_SEGMENT_TO_MEMBER[activeRoute?.segment || ''] || 'groups';
  const memberHref = `/pools/${poolId}/${memberCounterpart}`;
  const deadlineMs = fromDateTimeLocal(deadlineLocal);

  useLayoutEffect(() => {
    setSubBar(
      <div className="pool-header-strip">
        <div className="pool-header-name">
          <span className="nav-pool-name">{poolName || '…'}</span>
        </div>
        <div className="pool-header-countdown"><CountdownChip deadline={deadlineMs} /></div>
        <div className="nav-sub-bar-actions pool-header-actions">
          {/* Mode toggle */}
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
            <Link
              href={memberHref}
              style={{
                padding: '0.22rem 0.6rem',
                background: 'transparent',
                color: 'rgb(var(--fg-muted))',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {t('poolDetail.mode.member')}
            </Link>
            <span
              aria-current="true"
              style={{
                padding: '0.22rem 0.6rem',
                background: 'rgb(var(--sunset) / 0.12)',
                color: 'rgb(var(--sunset))',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                whiteSpace: 'nowrap',
              }}
            >
              <IoSettings size={10} aria-hidden />
              {t('poolDetail.mode.admin')}
            </span>
          </div>
        </div>
      </div>,
    );
    return () => setSubBar(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId, poolName, deadlineLocal, pathname]);

  return null;
}

function AdminLayoutInner({ poolId, children }: { poolId: string; children: React.ReactNode }) {
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
      <AdminNav poolId={poolId} />
      <AdminBreadcrumbs poolId={poolId} />
      <div style={{ marginTop: '0.65rem' }}>
        {children}
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { poolId } = useParams<{ poolId: string }>();
  return (
    <AdminProvider poolId={poolId}>
      <AdminLayoutInner poolId={poolId}>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}
