'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import { usePathname } from 'next/navigation';
import { FaHouse, FaShieldHalved, FaTrophy } from 'react-icons/fa6';
import { AdminShortcutLink, LanguageButton, ThemeButton, UserButton } from './NavigationBar';
// design-system v0.1.2, copied in (no npm package / build step) — see
// apps/ui/design-system/. Do not hand-edit the .jsx files there; re-copy
// from the sibling design-system repo instead.
import { AppShell } from '../../design-system/components/navigation/AppShell.jsx';
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
    { href: '/', label: t('nav.home'), icon: <FaHouse size={16} aria-hidden /> },
    { href: '/pools', label: t('nav.pools'), icon: <FaTrophy size={16} aria-hidden /> },
    ...(isAdmin
      ? [{ href: '/admin', label: t('nav.adminLabel'), icon: <FaShieldHalved size={16} aria-hidden /> }]
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
    />
  );

  return (
    <AppShell
      brand={brand}
      sidebarItems={navItems}
      bottomNavItems={navItems}
      activeHref={pathname}
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
