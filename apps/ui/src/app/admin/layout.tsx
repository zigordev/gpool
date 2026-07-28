'use client';

import { Loading } from '@/components/Loading';
import { AdminProvider, useAdminContext } from '@/contexts/AdminContext';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect } from 'react';
import { TopbarTabs } from '../../../design-system/components/navigation/TopbarTabs.jsx';
import { BsFillDiagram3Fill } from 'react-icons/bs';
import { FaLayerGroup } from 'react-icons/fa6';
import { GiSoccerKick } from 'react-icons/gi';

function SystemAdminNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { setCenter, setSubBar } = useNavCenter();
  const items = [
    { href: '/admin/groups', label: t('poolDetail.tabs.groupPhase'), icon: <FaLayerGroup aria-hidden /> },
    { href: '/admin/final', label: t('poolDetail.tabs.finalPhase'), icon: <BsFillDiagram3Fill aria-hidden /> },
    { href: '/admin/players', label: t('poolDetail.tabs.players'), icon: <GiSoccerKick aria-hidden /> },
  ];

  useLayoutEffect(() => {
    setCenter(
      <TopbarTabs items={items} activeHref={pathname} linkComponent={Link} ariaLabel={t('systemAdmin.tabsLabel')} />,
    );
    return () => {
      setCenter(null);
      setSubBar(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

function SystemAdminContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const { loading } = useAdminContext();
  const { t } = useI18n();

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-2xl)', minHeight: '60vh' }}>
        <Loading message={t('common.loading')} />
      </main>
    );
  }

  return (
    <>
      <SystemAdminNav />
      <div style={{ marginTop: '0.65rem' }}>{children}</div>
    </>
  );
}

export default function SystemAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdminProvider poolId="all-pools" systemMode>
      <SystemAdminContent>{children}</SystemAdminContent>
    </AdminProvider>
  );
}
