import React from 'react';
import { injectOnce } from '../_shared/injectStyle.js';

injectOnce('ds-switch', `
.ds-switch{position:relative;display:inline-flex;align-items:center;width:38px;height:22px;border-radius:999px;background:var(--ds-color-border-strong);border:none;padding:0;cursor:pointer;transition:background var(--ds-duration-fast) var(--ds-ease-out);flex-shrink:0;}
.ds-switch[data-checked="true"]{background:var(--ds-color-accent);}
.ds-switch:disabled{opacity:.55;cursor:not-allowed;}
.ds-switch-thumb{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:var(--ds-shadow-sm);transition:transform var(--ds-duration-fast) var(--ds-ease-out);}
.ds-switch[data-checked="true"] .ds-switch-thumb{transform:translateX(16px);}
.ds-switch-row{display:inline-flex;align-items:center;gap:8px;font-family:var(--ds-font-sans);font-size:var(--ds-text-sm);color:var(--ds-color-fg);}
.ds-switch-label{cursor:pointer;}
.ds-switch-row:has(.ds-switch:disabled) .ds-switch-label{opacity:.55;cursor:not-allowed;}
`);

let seq = 0;

export function Switch({ checked = false, onChange, disabled, label, className = '', ...props }) {
  const labelId = React.useRef(`ds-switch-${++seq}`).current;
  const toggle = () => onChange && onChange(!checked);

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      // A role="switch" button has no text of its own, so without this it
      // reaches a screen reader unlabelled. Checkbox already took a `label`;
      // this is the same affordance rather than a second convention.
      aria-labelledby={label ? labelId : undefined}
      data-checked={checked}
      disabled={disabled}
      className={`ds-switch ${label ? '' : className}`.trim()}
      onClick={toggle}
      {...props}
    >
      <span className="ds-switch-thumb" />
    </button>
  );

  if (!label) return control;

  return (
    <span className={`ds-switch-row ${className}`.trim()}>
      {control}
      <span
        id={labelId}
        className="ds-switch-label"
        onClick={disabled ? undefined : toggle}
      >
        {label}
      </span>
    </span>
  );
}
