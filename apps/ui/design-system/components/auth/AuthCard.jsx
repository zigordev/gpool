import React from 'react';

/** Centered card for an auth screen: logo, eyebrow, title, description,
 * an optional inline error, the action (typically a Button), and optional
 * fine print. Use inside AuthShell. */
export function AuthCard({ logo, eyebrow, title, description, error, children, footer, className = '', style }) {
  return (
    <section
      className={`ds-auth-card ${className}`.trim()}
      style={{
        position: 'relative', zIndex: 1, display: 'grid', justifyItems: 'center', gap: 24,
        width: 'min(460px, 100%)', padding: 'clamp(32px, 7vw, 58px)', textAlign: 'center',
        background: 'var(--ds-color-surface)', border: '1px solid var(--ds-color-border)',
        borderRadius: 'var(--ds-radius-lg)', boxShadow: 'var(--ds-shadow-md)',
        fontFamily: 'var(--ds-font-sans)',
        ...style,
      }}
    >
      <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
        {logo}
        {eyebrow ? (
          <p style={{ margin: 0, fontSize: 'var(--ds-text-xs)', fontWeight: 'var(--ds-weight-bold)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ds-color-accent)' }}>
            {eyebrow}
          </p>
        ) : null}
        <h1 style={{ margin: 0, fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 'var(--ds-weight-bold)', letterSpacing: '-0.02em', color: 'var(--ds-color-fg)', maxWidth: '20ch' }}>
          {title}
        </h1>
        {description ? (
          <p style={{ margin: 0, fontSize: 'var(--ds-text-sm)', color: 'var(--ds-color-fg-muted)', lineHeight: 1.55, maxWidth: '36ch' }}>
            {description}
          </p>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          style={{
            width: '100%', padding: '10px 14px', textAlign: 'left',
            background: 'var(--ds-color-danger-bg)', color: 'var(--ds-color-danger-fg)',
            border: '1px solid var(--ds-color-danger-border)', borderRadius: 'var(--ds-radius-md)',
            fontSize: 'var(--ds-text-sm)', fontWeight: 'var(--ds-weight-medium)',
          }}
        >
          {error}
        </div>
      ) : null}

      {children ? <div style={{ width: '100%', display: 'grid', gap: 12 }}>{children}</div> : null}

      {footer ? (
        <p style={{ margin: 0, fontSize: 'var(--ds-text-xs)', color: 'var(--ds-color-fg-subtle)', lineHeight: 1.5 }}>
          {footer}
        </p>
      ) : null}
    </section>
  );
}
