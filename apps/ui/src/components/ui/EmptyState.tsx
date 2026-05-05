'use client';

import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div
      className="surface"
      style={{
        padding: '2.5rem 1.75rem',
        textAlign: 'center',
        background: 'rgb(var(--bg-elevated) / 0.7)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {icon ? (
        <div
          aria-hidden
          style={{
            width: 56,
            height: 56,
            borderRadius: '999px',
            background:
              'linear-gradient(135deg, rgb(var(--accent-from) / 0.15), rgb(var(--accent-to) / 0.15))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            color: 'rgb(var(--accent-from))',
          }}
        >
          {icon}
        </div>
      ) : null}
      <p style={{ color: 'rgb(var(--fg))', fontWeight: 600, marginBottom: description ? '0.4rem' : 0, fontSize: '0.95rem' }}>
        {title}
      </p>
      {description ? (
        <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', maxWidth: '36ch', margin: '0 auto', lineHeight: 1.5 }}>
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: '1.25rem' }}>{action}</div> : null}
    </div>
  );
}
