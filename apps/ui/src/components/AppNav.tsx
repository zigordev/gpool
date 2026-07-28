'use client';

import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageButton, ThemeButton, UserButton } from './NavigationBar';
// design-system v0.1.4, copied in (no npm package / build step) — see
// apps/ui/design-system/. Do not hand-edit the .jsx files there; re-copy
// from the sibling design-system repo instead.
import { AppShell } from '../../design-system/components/navigation/AppShell.jsx';
import { Icon } from '../../design-system/components/icons/Icon.jsx';
import { Logo } from '../../design-system/components/navigation/Logo.jsx';

/**
 * Wires gpool's existing NavCenterContext (center/subBar/poolActions, set by
 * PoolNav/PoolBreadcrumbs/SystemAdminNav — all unchanged) into the shared
 * AppShell's Sidebar + Topbar + BottomNav chrome:
 *   - center  -> topbar.tabs   (pool tab strip / admin section tabs)
 *   - subBar  -> topbar.subBar (pool name + countdown + poolActions)
 *   - ThemeButton/LanguageButton/UserButton -> topbar.utilities
 *
 * Primary nav is just "Pools" — Home was a bare redirect to /pools (no
 * content of its own), and system admin now lives in UserButton's menu
 * (see NavigationBar.tsx) rather than as a sidebar peer, since it's a
 * secondary/account-level action for the rare admin user, not a feature
 * area every user navigates to. Per-pool admin ("Manage") is contextual
 * to a specific pool and lives in that pool's own tab strip (PoolNav),
 * not here.
 */
export function AppNav({ children }: Readonly<{ children: React.ReactNode }>) {
  const { center, subBar } = useNavCenter();
  const { t } = useI18n();
  const pathname = usePathname();

  // The old NavigationBar hid itself entirely on /login; AppShell should too
  // (login has its own centered, sidebar-less layout).
  if (pathname === '/login') return <>{children}</>;

  const navItems = [
    { href: '/pools', label: t('nav.pools'), icon: <Icon name="trophy" /> },
  ];

  const brand = (
    <Logo
      initials="GP"
      wordmark="GPool"
      tagline="Football pools, with friends"
      shape="circle"
      size="sm"
      href="/"
      linkComponent={Link}
    />
  );

  return (
    <AppShell
      brand={brand}
      sidebarItems={navItems}
      bottomNavItems={navItems}
      activeHref={pathname}
      linkComponent={Link}
      topbar={{
        tabs: center,
        subBar: subBar,
        utilities: (
          <>
            <ThemeButton />
            <LanguageButton />
            <UserButton />
          </>
        ),
      }}
    >
      <div className="container-app" style={{ position: 'relative' }}>
        {children}
      </div>
    </AppShell>
  );
}
