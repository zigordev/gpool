'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminShortcutLink, LanguageButton, ThemeButton, UserButton } from './NavigationBar';
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
 *   - ThemeButton/LanguageButton/UserButton/AdminShortcutLink -> topbar.utilities
 *
 * Primary nav (Home/Pools/Admin) is genuinely new — gpool had no sidebar or
 * bottom nav before this migration.
 */
export function AppNav({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuth();
  const { center, subBar } = useNavCenter();
  const { t } = useI18n();
  const pathname = usePathname();

  // The old NavigationBar hid itself entirely on /login; AppShell should too
  // (login has its own centered, sidebar-less layout).
  if (pathname === '/login') return <>{children}</>;

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { href: '/', label: t('nav.home'), icon: <Icon name="home" /> },
    { href: '/pools', label: t('nav.pools'), icon: <Icon name="trophy" /> },
    ...(isAdmin
      ? [{ href: '/admin', label: t('nav.adminLabel'), icon: <Icon name="shield" /> }]
      : []),
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
            <AdminShortcutLink />
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
