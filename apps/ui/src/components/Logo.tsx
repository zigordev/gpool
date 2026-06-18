'use client';

import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Hide the wordmark (icon only). Default false. */
  iconOnly?: boolean;
}

export function Logo({ size = 'md', iconOnly = false }: Readonly<LogoProps>) {
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
        <span style={{ position: 'relative', zIndex: 1 }}>GP</span>
      </span>

      {iconOnly ? null : (
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
      )}
    </Link>
  );
}
