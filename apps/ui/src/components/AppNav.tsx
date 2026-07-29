'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePools } from '@/contexts/PoolsContext';
import { LanguageButton, ThemeButton, UserButton } from './NavigationBar';
// design-system, copied in (no npm package / build step) — see
// apps/ui/design-system/. Do not hand-edit the .jsx files there; re-copy
// from the sibling design-system repo instead.
import { AppShell } from '../../design-system/components/navigation/AppShell.jsx';
import { Icon } from '../../design-system/components/icons/Icon.jsx';
import { Logo } from '../../design-system/components/navigation/Logo.jsx';
import { ScopeSwitcher } from '../../design-system/components/navigation/ScopeSwitcher.jsx';
import { SegmentedControl } from '../../design-system/components/navigation/SegmentedControl.jsx';
import { MenuItem } from '../../design-system/components/overlay/Menu.jsx';
import { Button } from '../../design-system/components/core/Button.jsx';

/**
 * Navigation follows the design-system taxonomy (see its readme):
 *   scope       -> which pool (ScopeSwitcher, top of Sidebar)
 *   destination -> that pool's sections (Sidebar items)
 *   mode        -> View vs Manage (SegmentedControl, Topbar's `mode` slot)
 *
 * The phase axis (Groups / Final / Players) is meaningful at three levels
 * — the real tournament, this pool's rules, my predictions — so it is NOT
 * repeated once per level. It is the section axis, and the level is a mode:
 * View reads /pools/[id]/<section>, Manage reads /pools/[id]/admin/<section>.
 * Tournament admin is a separate surface entirely (own sections, reached
 * from the account menu), not a third copy of the same tabs.
 */
export function AppNav({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { pools, activePool, activePoolId } = usePools();

  // The old NavigationBar hid itself entirely on /login; AppShell should too
  // (login has its own centered, sidebar-less layout).
  if (pathname === '/login') return <>{children}</>;

  // Dev-only design-system preview (see app/dev/preview). Renders outside the
  // shell so primitives can be inspected without a session; the route itself
  // 404s in production builds.
  if (process.env.NODE_ENV !== 'production' && pathname.startsWith('/dev/')) {
    return <>{children}</>;
  }

  const isTournamentAdmin = pathname.startsWith('/admin');
  const isManage = pathname.includes('/admin');
  const isPoolAdmin = activePool?.userMembership?.role === 'admin';

  // Tournament administration — a distinct surface with its own sections,
  // editing the real results every pool is graded against.
  if (isTournamentAdmin) {
    const adminItems = [
      { href: '/admin/groups', label: t('poolDetail.tabs.groupPhase'), icon: <Icon name="layout-dashboard" /> },
      { href: '/admin/final', label: t('poolDetail.tabs.finalPhase'), icon: <Icon name="trophy" /> },
      { href: '/admin/players', label: t('poolDetail.tabs.players'), icon: <Icon name="users" /> },
    ];

    return (
      <AppShell
        brand={<Brand />}
        sidebarItems={adminItems}
        activeHref={pathname}
        linkComponent={Link}
        topbar={{
          title: t('systemAdmin.tabsLabel'),
          description: t('systemAdmin.title'),
          actions: (
            <Button as={Link} variant="outline" size="sm" href="/pools" style={{ textDecoration: 'none' }}>
              {t('common.backToPools')}
            </Button>
          ),
          utilities: <Utilities />,
        }}
      >
        <div className="container-app" style={{ position: 'relative' }}>{children}</div>
      </AppShell>
    );
  }

  const sections = isManage
    ? [
        { key: 'settings', label: t('adminResults.config.general.title'), icon: <Icon name="settings" /> },
        { key: 'groups', label: t('poolDetail.tabs.groupPhase'), icon: <Icon name="layout-dashboard" /> },
        { key: 'final', label: t('poolDetail.tabs.finalPhase'), icon: <Icon name="trophy" /> },
        { key: 'players', label: t('poolDetail.tabs.players'), icon: <Icon name="users" /> },
      ]
    : [
        { key: 'ranking', label: t('poolDetail.tabs.ranking'), icon: <Icon name="trending-up" /> },
        { key: 'groups', label: t('poolDetail.tabs.groupPhase'), icon: <Icon name="layout-dashboard" /> },
        { key: 'final', label: t('poolDetail.tabs.finalPhase'), icon: <Icon name="trophy" /> },
        { key: 'players', label: t('poolDetail.tabs.players'), icon: <Icon name="users" /> },
      ];

  const base = activePoolId ? `/pools/${activePoolId}${isManage ? '/admin' : ''}` : null;

  // Two permanent destinations, then the active pool's sections. Before this
  // the sidebar was empty whenever no pool was selected — including on the
  // pools directory itself, which is where you land.
  const sidebarItems = [
    { href: '/', label: t('pools.filters.mine'), icon: <Icon name="trophy" /> },
    // exact: /pools/123/... is a pool's own section, not the directory.
    { href: '/pools', exact: true, label: t('pools.filters.all'), icon: <Icon name="layout-dashboard" /> },
    ...(base
      ? sections.map((section) => ({ href: `${base}/${section.key}`, label: section.label, icon: section.icon }))
      : []),
  ];

  const isPoolsList = pathname === '/' || pathname === '/pools';

  // Switching mode keeps you on the same section when it exists on both
  // sides; Ranking (a leaderboard) has no Manage twin, so it lands on
  // Settings instead of dead-ending.
  const currentSection = pathname.split('/').filter(Boolean).pop();
  const twin = (target: 'view' | 'manage') => {
    if (!activePoolId) return '/pools';
    const shared = ['groups', 'final', 'players'];
    const section = shared.includes(currentSection ?? '')
      ? currentSection
      : target === 'manage' ? 'settings' : 'ranking';
    return target === 'manage'
      ? `/pools/${activePoolId}/admin/${section}`
      : `/pools/${activePoolId}/${section}`;
  };

  return (
    <AppShell
      brand={<Brand />}
      scope={
        <ScopeSwitcher
          label={t('poolDetail.title')}
          value={activePool?.name}
          placeholder={t('pools.title')}
          // Only pools you can actually enter. /pools returns the whole
          // directory including ones you are not in — offering those here
          // would switch scope to a pool that renders disabled.
          items={pools
            .filter((pool) => pool.isMember || pool.adminUserId === user?.userId)
            .map((pool) => ({
              id: pool.poolId,
              label: pool.name,
              active: pool.poolId === activePoolId,
              onSelect: (id: string) => router.push(`/pools/${id}/ranking`),
            }))}
          footer={({ close }: { close: () => void }) => (
            <>
              <MenuItem onClick={() => { close(); router.push('/pools'); }}>
                <Icon name="layout-dashboard" /> {t('pools.filters.all')}
              </MenuItem>
              {user?.role === 'admin' ? (
                <MenuItem onClick={() => { close(); router.push('/admin/groups'); }}>
                  <Icon name="shield" /> {t('systemAdmin.tabsLabel')}
                </MenuItem>
              ) : null}
            </>
          )}
        />
      }
      sidebarItems={sidebarItems}
      activeHref={pathname}
      linkComponent={Link}
      topbar={{
        actions: isPoolsList && user?.role === 'admin' ? (
          <Button
            as={Link}
            variant="primary"
            size="sm"
            href={`${pathname}?create=1`}
            style={{ textDecoration: 'none' }}
          >
            <Icon name="plus" size={14} /> {t('pools.actions.create')}
          </Button>
        ) : null,
        mode: isPoolAdmin && activePoolId ? (
          <SegmentedControl
            ariaLabel={t('poolDetail.mode.label')}
            linkComponent={Link}
            value={isManage ? 'manage' : 'view'}
            options={[
              { value: 'view', label: t('poolDetail.mode.member'), href: twin('view') },
              { value: 'manage', label: t('poolDetail.mode.admin'), href: twin('manage') },
            ]}
          />
        ) : null,
        utilities: <Utilities />,
      }}
    >
      <div className="container-app" style={{ position: 'relative' }}>{children}</div>
    </AppShell>
  );
}

function Brand() {
  return (
    <Logo
      initials="GP"
      wordmark="GPool"
      tagline="Football pools, with friends"
      shape="circle"
      size="sm"
      href="/pools"
      linkComponent={Link}
    />
  );
}

function Utilities() {
  return (
    <>
      <ThemeButton />
      <LanguageButton />
      <UserButton />
    </>
  );
}
