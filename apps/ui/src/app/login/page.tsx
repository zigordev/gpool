'use client';

import { Loading } from '@/components/Loading';
import { LanguageButton, ThemeButton } from '@/components/NavigationBar';
import { AuthCard } from 'design-system/components/auth/AuthCard.jsx';
import { AuthShell } from 'design-system/components/auth/AuthShell.jsx';
import { Button } from 'design-system/components/core/Button.jsx';
import { GoogleMark } from 'design-system/components/icons/GoogleMark.jsx';
import { Logo } from 'design-system/components/navigation/Logo.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function sanitizeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

function LoginPageContent() {
  const { login, isAuthenticated, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = sanitizeRedirectPath(searchParams.get('redirect'));
  const errorParam = searchParams.get('error');
  const error = errorParam ? decodeURIComponent(errorParam) : null;

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, loading, redirectPath, router]);

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-2xl)', minHeight: '60vh' }}>
        <Loading message={t('common.loading')} />
      </main>
    );
  }

  return (
    <AuthShell utilities={<><ThemeButton /><LanguageButton /></>}>
      <AuthCard
        logo={<Logo initials="GP" size="lg" shape="circle" href="/" linkComponent={Link} />}
        eyebrow={t('login.eyebrow')}
        title={t('login.title')}
        description={t('login.tagline')}
        error={error ? <><strong>{t('common.errorLabel')}</strong> {error}</> : null}
        footer={t('login.terms')}
      >
        <Button variant="primary" size="lg" style={{ width: '100%' }} type="button" onClick={() => login(redirectPath)}>
          <GoogleMark />
          {t('login.signInWithGoogle')}
        </Button>
      </AuthCard>
    </AuthShell>
  );
}

export default function LoginPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'rgb(var(--bg))',
          }}
        >
          <p style={{ color: 'rgb(var(--fg-muted))' }}>{t('common.loading')}</p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
