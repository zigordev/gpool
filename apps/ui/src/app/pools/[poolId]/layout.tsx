'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import { Badge } from '@/components/ui/Badge';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { Loading } from '@/components/Loading';
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
            <a
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
            </a>
          );
        })}
      </nav>,
    );
    return () => setCenter(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isPastPoolDeadline, groupMissingCount, finalMissingCount, playersMissingCount, poolId]);

  return null;
}

function PoolLayoutInner({ children }: Readonly<{ children: React.ReactNode }>) {
  const { t } = useI18n();
  const {
    loading,
    poolDeadline,
  } = usePoolContext();

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

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ alignSelf: 'flex-start' }}>
          <CountdownChip
            deadline={poolDeadline}
          />
        </div>
      </header>

      {children}
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
