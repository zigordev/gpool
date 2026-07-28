import React from 'react';

export function EmptyState({ icon, title, description, action, size = 'md', className = '', style }) {
  const pad = size === 'sm' ? '28px 20px' : '48px 32px';
  const iconSize = size === 'sm' ? 36 : 48;
  return (
    <div
      className={`ds-empty-state ${className}`.trim()}
      style={{
        display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 6,
        padding: pad, border: '1px dashed var(--ds-color-border)', borderRadius: 'var(--ds-radius-lg)',
        background: 'var(--ds-color-surface)', fontFamily: 'var(--ds-font-sans)', ...style,
      }}
    >
      <div style={{
        width: iconSize, height: iconSize, display: 'grid', placeItems: 'center', borderRadius: '50%',
        background: 'var(--ds-color-surface-2)', color: 'var(--ds-color-fg-subtle)', marginBottom: 4,
      }}>
        {icon ?? '—'}
      </div>
      <h3 style={{ margin: 0, fontSize: 'var(--ds-text-lg)', fontWeight: 'var(--ds-weight-bold)', color: 'var(--ds-color-fg)' }}>{title}</h3>
      {description ? (
        <p style={{ margin: 0, maxWidth: 420, color: 'var(--ds-color-fg-muted)', fontSize: 'var(--ds-text-sm)' }}>{description}</p>
      ) : null}
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  );
}
