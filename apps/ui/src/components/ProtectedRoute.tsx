'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const redirectPath = `${window.location.pathname || '/pools'}${window.location.search || ''}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
