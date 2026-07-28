import React from 'react';
import { injectOnce } from '../_shared/injectStyle.js';

injectOnce('ds-button', `
.ds-btn{display:inline-flex;text-decoration:none;align-items:center;justify-content:center;gap:8px;border:1px solid transparent;border-radius:var(--ds-radius-md);font-family:var(--ds-font-sans);font-weight:var(--ds-weight-semibold);white-space:nowrap;cursor:pointer;transition:background var(--ds-duration-fast) var(--ds-ease-out),border-color var(--ds-duration-fast) var(--ds-ease-out),color var(--ds-duration-fast) var(--ds-ease-out),transform var(--ds-duration-fast) var(--ds-ease-out),box-shadow var(--ds-duration-fast) var(--ds-ease-out);}
.ds-btn:active:not(:disabled){transform:translateY(1px);}
.ds-btn:disabled{opacity:.55;cursor:not-allowed;}
.ds-btn:focus-visible{outline:2px solid var(--ds-color-accent);outline-offset:2px;}
.ds-btn-sm{height:32px;padding:0 12px;font-size:var(--ds-text-xs);}
.ds-btn-md{height:38px;padding:0 16px;font-size:var(--ds-text-sm);}
.ds-btn-lg{height:46px;padding:0 22px;font-size:var(--ds-text-base);}
.ds-btn-icon{width:38px;height:38px;padding:0;}
.ds-btn-primary{background:var(--ds-color-accent);color:var(--ds-color-accent-fg);box-shadow:var(--ds-shadow-xs);}
.ds-btn-primary:hover:not(:disabled){background:var(--ds-color-accent-hover);}
.ds-btn-secondary{background:var(--ds-color-surface-2);color:var(--ds-color-fg);border-color:var(--ds-color-border);}
.ds-btn-secondary:hover:not(:disabled){background:var(--ds-color-surface-3);}
.ds-btn-outline{background:var(--ds-color-surface);color:var(--ds-color-fg);border-color:var(--ds-color-border);}
.ds-btn-outline:hover:not(:disabled){background:var(--ds-color-surface-2);}
.ds-btn-ghost{background:transparent;color:var(--ds-color-fg-muted);}
.ds-btn-ghost:hover:not(:disabled){background:var(--ds-color-surface-2);color:var(--ds-color-fg);}
.ds-btn-danger{background:var(--ds-color-danger);color:var(--ds-color-accent-fg);}
.ds-btn-danger:hover:not(:disabled){filter:brightness(0.92);}
.ds-btn-spinner{display:inline-block;width:.95em;height:.95em;border:2px solid currentColor;border-bottom-color:transparent;border-radius:999px;animation:ds-btn-spin .7s linear infinite;flex-shrink:0;}
@keyframes ds-btn-spin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion: reduce){.ds-btn-spinner{animation:none;}}
`);

export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  children,
  className = '',
  style,
  ...props
}) {
  const cls = `ds-btn ds-btn-${variant} ds-btn-${size} ${className}`.trim();
  // `as` lets a navigation that looks like an action render as a real link
  // (next/link, <a>) instead of a button with an onClick router.push — it
  // keeps middle-click, open-in-new-tab and the status bar working.
  // The spinner replaces the leading icon rather than sitting beside it, so
  // the button keeps its width and the row above it doesn't reflow on submit.
  return (
    <Component
      className={cls}
      style={style}
      disabled={Component === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="ds-btn-spinner" aria-hidden="true" />
        : leadingIcon ? <span aria-hidden="true" style={{ display: 'inline-flex' }}>{leadingIcon}</span>
        : null}
      {children}
      {trailingIcon && !loading ? <span aria-hidden="true" style={{ display: 'inline-flex' }}>{trailingIcon}</span> : null}
    </Component>
  );
}
