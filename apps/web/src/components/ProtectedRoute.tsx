'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { useRouter } from 'next/navigation';
import { Loading } from './Loading';

export function ProtectedRoute({ children }: Readonly<{ children: ReactNode }>) {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const redirectPath = `${globalThis.location.pathname || '/pools'}${globalThis.location.search || ''}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <Loading message={t('common.loading')} />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
