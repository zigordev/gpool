import React from 'react';
import { injectOnce } from '../_shared/injectStyle.js';

injectOnce('ds-select', `
.ds-select-wrap{position:relative;display:inline-block;width:100%;}
.ds-select{appearance:none;-webkit-appearance:none;box-sizing:border-box;display:block;width:100%;height:38px;padding:0 34px 0 12px;background:var(--ds-color-surface);border:1px solid var(--ds-color-border);border-radius:var(--ds-radius-md);font-family:var(--ds-font-sans);font-size:var(--ds-text-base);color:var(--ds-color-fg);}
.ds-select:hover:not(:disabled){border-color:var(--ds-color-border-strong);}
.ds-select:focus{outline:none;border-color:var(--ds-color-accent);box-shadow:0 0 0 3px var(--ds-color-accent-soft);}
.ds-select:disabled{background:var(--ds-color-surface-2);color:var(--ds-color-fg-faint);cursor:not-allowed;}
.ds-select-chevron{position:absolute;right:11px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--ds-color-fg-subtle);display:inline-flex;}
`);

export function Select({ children, className = '', style, ...props }) {
  return (
    <span className="ds-select-wrap" style={style}>
      <select className={`ds-select ${className}`.trim()} {...props}>
        {children}
      </select>
      {/* Real icon rather than a "▾" text glyph, which rendered at a
          different weight and baseline than every other chevron in the UI. */}
      <span className="ds-select-chevron" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </span>
  );
}
