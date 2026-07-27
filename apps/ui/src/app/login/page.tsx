'use client';

import { Loading } from '@/components/Loading';
import { LanguageButton, ThemeButton } from '@/components/NavigationBar';
import { Logo } from '../../../design-system/components/navigation/Logo.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function sanitizeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

function LoginPageContent() {
  const { login, isAuthenticated, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const redirectPath = sanitizeRedirectPath(searchParams.get('redirect'));

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, loading, redirectPath, router]);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-2xl)', minHeight: '60vh' }}>
        <Loading message={t('common.loading')} />
      </main>
    );
  }

  return (
    <main
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '1.5rem',
        background: 'rgb(var(--bg))',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        className="bg-mesh"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
        }}
      >
        <ThemeButton />
        <LanguageButton />
      </div>

      <div
        className="glass-strong"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <Logo initials="GP" size="lg" shape="circle" href="/" linkComponent={Link} />
          <p className="eyebrow" style={{ marginTop: '0.25rem' }}>
            {t('login.eyebrow')}
          </p>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              maxWidth: '20ch',
            }}
          >
            {t('login.title')}
          </h1>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'rgb(var(--fg-muted))',
              lineHeight: 1.55,
              maxWidth: '36ch',
            }}
          >
            {t('login.tagline')}
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            style={{
              width: '100%',
              padding: '0.7rem 0.9rem',
              background: 'rgb(var(--live) / 0.08)',
              color: 'rgb(var(--live))',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgb(var(--live) / 0.30)',
              fontSize: '0.875rem',
              fontWeight: 500,
              textAlign: 'left',
            }}
          >
            <strong>{t('common.errorLabel')}</strong> {error}
          </div>
        ) : null}

        <button type="button" onClick={() => login(redirectPath)} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path
              fill="#fff"
              d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844c-.209 1.18-.843 2.18-1.796 2.85v2.26h2.908c1.702-1.567 2.684-3.874 2.684-6.75z"
            />
            <path
              fill="#fff"
              opacity="0.85"
              d="M9 18c2.43 0 4.467-.806 5.965-2.18l-2.908-2.26c-.806.54-1.837.86-3.057.86-2.35 0-4.34-1.587-5.053-3.72H.957v2.332C2.438 15.983 5.482 18 9 18z"
            />
            <path
              fill="#fff"
              opacity="0.7"
              d="M3.947 10.72c-.18-.54-.282-1.117-.282-1.72 0-.603.102-1.18.282-1.72V4.948H.957C.348 6.173 0 7.548 0 9s.348 2.827.957 4.052l2.99-2.332z"
            />
            <path
              fill="#fff"
              opacity="0.85"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.948L3.947 7.28C4.66 5.145 6.65 3.58 9 3.58z"
            />
          </svg>
          {t('login.signInWithGoogle')}
        </button>

        <p
          style={{
            fontSize: '0.75rem',
            color: 'rgb(var(--fg-subtle))',
            lineHeight: 1.5,
          }}
        >
          {t('login.terms')}
        </p>
      </div>
    </main>
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
