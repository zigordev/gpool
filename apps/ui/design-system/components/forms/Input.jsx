import React from 'react';
import { injectOnce } from '../_shared/injectStyle.js';

injectOnce('ds-input', `
.ds-input{display:block;box-sizing:border-box;width:100%;height:38px;padding:0 12px;background:var(--ds-color-surface);border:1px solid var(--ds-color-border);border-radius:var(--ds-radius-md);font-family:var(--ds-font-sans);font-size:var(--ds-text-base);color:var(--ds-color-fg);transition:border-color var(--ds-duration-fast) var(--ds-ease-out),box-shadow var(--ds-duration-fast) var(--ds-ease-out);}
.ds-input::placeholder{color:var(--ds-color-fg-faint);}
.ds-input:hover:not(:disabled):not(:focus){border-color:var(--ds-color-border-strong);}
.ds-input:focus{outline:none;border-color:var(--ds-color-accent);box-shadow:0 0 0 3px var(--ds-color-accent-soft);}
.ds-input:disabled{background:var(--ds-color-surface-2);color:var(--ds-color-fg-faint);cursor:not-allowed;}
.ds-input-invalid{border-color:var(--ds-color-danger) !important;box-shadow:0 0 0 3px var(--ds-color-danger-soft);}
.ds-input-attention{border-color:var(--ds-color-warning) !important;box-shadow:0 0 0 3px var(--ds-color-warning-soft);}
`);

/** `invalid` is "this is wrong" and carries `aria-invalid`, so a screen
 * reader announces it. `attention` is the softer state a required field
 * sits in before it has been filled — worth pointing at, but not an error
 * yet, and deliberately not announced as one. */
export function Input({ invalid = false, attention = false, className = '', ...props }) {
  const cls = ['ds-input',
    invalid && 'ds-input-invalid',
    attention && !invalid && 'ds-input-attention',
    className].filter(Boolean).join(' ');
  return <input className={cls} aria-invalid={invalid || undefined} {...props} />;
}
