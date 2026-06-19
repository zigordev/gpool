'use client';

import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  /** Optional sub-line beneath the value (e.g. date, owner email). */
  hint?: string;
  icon?: ReactNode;
  /** Visual emphasis. "accent" uses the gradient-text + glow shadow. */
  emphasis?: 'default' | 'accent';
}

export function StatTile({ label, value, hint, icon, emphasis = 'default' }: Readonly<Props>) {
  const isAccent = emphasis === 'accent';
  return (
    <div
      style={{
        position: 'relative',
        padding: '0.95rem 1rem',
        background: isAccent
          ? 'linear-gradient(135deg, rgb(var(--accent-from) / 0.10), rgb(var(--accent-to) / 0.10))'
          : 'rgb(var(--bg-subtle))',
        borderRadius: 'var(--radius-md)',
        border: isAccent ? '1px solid rgb(var(--accent-from) / 0.30)' : '1px solid rgb(var(--border))',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        {icon ? (
          <span aria-hidden style={{ display: 'inline-flex', color: isAccent ? 'rgb(var(--accent-from))' : 'rgb(var(--fg-subtle))' }}>
            {icon}
          </span>
        ) : null}
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgb(var(--fg-subtle))',
            lineHeight: 1.1,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display, inherit)',
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '-0.015em',
          color: 'rgb(var(--fg))',
          lineHeight: 1.1,
        }}
      >
        {isAccent ? <span className="gradient-text">{value}</span> : value}
      </div>
      {hint ? (
        <p style={{ fontSize: '0.78rem', color: 'rgb(var(--fg-muted))', marginTop: '0.35rem', lineHeight: 1.3 }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
