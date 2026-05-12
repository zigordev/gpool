'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useI18n } from '@/i18n/client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Hide the wordmark (icon only). Default false. */
  iconOnly?: boolean;
}

export function Logo({ size = 'md', iconOnly = false }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  const { t } = useI18n();

  const dim = {
    sm: { mark: 36, font: '1rem', wordmark: '1rem' },
    md: { mark: 48, font: '1.25rem', wordmark: '1.25rem' },
    lg: { mark: 96, font: '2rem', wordmark: '1.875rem' },
  }[size];

  return (
    <Link
      href="/"
      aria-label="GPool"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <span
        style={{
          position: 'relative',
          width: dim.mark,
          height: dim.mark,
          flexShrink: 0,
          borderRadius: '999px',
          overflow: 'hidden',
          background: 'rgb(var(--pitch) / 0.92)',
          boxShadow: 'var(--shadow-sm)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'var(--font-display, inherit)',
          fontWeight: 800,
          fontSize: dim.font,
          letterSpacing: '-0.02em',
        }}
      >
        {!imageError ? (
          <Image
            src="/logo.png"
            alt={t('logo.alt')}
            width={dim.mark}
            height={dim.mark}
            style={{
              objectFit: 'contain',
              width: '100%',
              height: '100%',
              position: 'relative',
              zIndex: 1,
            }}
            priority
            onError={() => setImageError(true)}
          />
        ) : (
          <span style={{ position: 'relative', zIndex: 1 }}>GP</span>
        )}
      </span>

      {!iconOnly ? (
        <span
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            lineHeight: 1.05,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display, inherit)',
              fontWeight: 700,
              fontSize: dim.wordmark,
              color: 'rgb(var(--fg))',
              letterSpacing: '-0.02em',
            }}
          >
            GPool
          </span>
          {size === 'lg' ? (
            <span className="eyebrow" style={{ marginTop: '0.25rem' }}>
              Football pools, with friends
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
