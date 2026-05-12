'use client';

import { useLayoutEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import { Loading } from '@/components/Loading';
import { AdminProvider, fromDateTimeLocal, useAdminContext } from '@/contexts/AdminContext';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { IoSettings } from 'react-icons/io5';

function AdminNav({ poolId }: { poolId: string }) {
  const { t } = useI18n();
  const { setCenter } = useNavCenter();
  const pathname = usePathname();

  const routes = [
    { segment: 'rules',   href: `/pools/${poolId}/admin/rules`,   label: t('poolDetail.tabs.rules'),       gear: false },
    { segment: 'ranking', href: `/pools/${poolId}/admin/ranking`, label: t('poolDetail.tabs.ranking'),     gear: true  },
    { segment: 'groups',  href: `/pools/${poolId}/admin/groups`,  label: t('poolDetail.tabs.groupPhase'),  gear: true  },
    { segment: 'final',   href: `/pools/${poolId}/admin/final`,   label: t('poolDetail.tabs.finalPhase'),  gear: true  },
    { segment: 'players', href: `/pools/${poolId}/admin/players`, label: t('poolDetail.tabs.players'),     gear: true  },
  ];

  useLayoutEffect(() => {
    setCenter(
      <nav aria-label={t('adminResults.tabs.label')} className="floating-nav">
        {routes.map((route) => {
          const active = pathname === route.href || pathname.startsWith(route.href + '/');
          return (
            <Link
              key={route.segment}
              href={route.href}
              aria-current={active ? 'page' : undefined}
              className={`floating-nav-btn${active ? ' floating-nav-btn--active' : ''}`}
            >
              {route.gear ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}>
                  <IoSettings size={11} aria-hidden style={{ color: active ? 'rgb(var(--sunset))' : 'inherit' }} />
                  {route.label}
                </span>
              ) : route.label}
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

const ADMIN_SEGMENT_TO_MEMBER: Record<string, string> = { rules: 'rules', ranking: 'ranking', groups: 'groups', final: 'final', players: 'players' };

function AdminBreadcrumbs({ poolId }: { poolId: string }) {
  const { t } = useI18n();
  const { poolName, deadlineLocal } = useAdminContext();
  const { setSubBar } = useNavCenter();
  const pathname = usePathname();

  const adminRoutes = [
    { segment: 'rules',   label: t('poolDetail.tabs.rules')       },
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', gap: '1rem' }}>
        <nav aria-label="breadcrumb" style={{ minWidth: 0 }}>
          <ol className="breadcrumb">
            <li><Link href="/pools">{t('pools.title')}</Link></li>
            <li aria-hidden><span className="breadcrumb-separator">›</span></li>
            <li><span className="breadcrumb-current" aria-current="page">{poolName || '…'}</span></li>
          </ol>
        </nav>
        <div style={{ display: 'flex', justifyContent: 'center' }}><CountdownChip deadline={deadlineMs} /></div>
        <div className="nav-sub-bar-actions" style={{ justifySelf: 'end' }}>
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
      <div style={{ marginTop: '1.75rem' }}>
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
