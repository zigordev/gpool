import React from 'react';
import { injectOnce } from '../_shared/injectStyle.js';

injectOnce('ds-badge', `
.ds-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:var(--ds-radius-full);border:1px solid transparent;font-family:var(--ds-font-sans);font-size:var(--ds-text-xs);font-weight:var(--ds-weight-semibold);letter-spacing:.02em;white-space:nowrap;}
.ds-badge-neutral{background:var(--ds-color-surface-2);color:var(--ds-color-fg-muted);border-color:var(--ds-color-border);}
.ds-badge-accent{background:var(--ds-color-accent-soft);color:var(--ds-color-accent);border-color:transparent;}
.ds-badge-success{background:var(--ds-color-success-bg);color:var(--ds-color-success-fg);border-color:var(--ds-color-success-border);}
.ds-badge-warning{background:var(--ds-color-warning-bg);color:var(--ds-color-warning-fg);border-color:var(--ds-color-warning-border);}
.ds-badge-danger{background:var(--ds-color-danger-bg);color:var(--ds-color-danger-fg);border-color:var(--ds-color-danger-border);}
.ds-badge-info{background:var(--ds-color-info-bg);color:var(--ds-color-info-fg);border-color:var(--ds-color-info-border);}
.ds-badge-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0;}
`);

export function Badge({ variant = 'neutral', dot = false, leadingIcon, children, className = '', ...props }) {
  return (
    <span className={`ds-badge ds-badge-${variant} ${className}`.trim()} {...props}>
      {dot ? <span className="ds-badge-dot" /> : null}
      {/* Icon before the dot would read as two separate markers; a badge gets
          one or the other. */}
      {!dot && leadingIcon ? (
        <span aria-hidden="true" style={{ display: 'inline-flex', flexShrink: 0 }}>{leadingIcon}</span>
      ) : null}
      {children}
    </span>
  );
}
