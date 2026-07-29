import React from 'react';
import { injectOnce } from '../_shared/injectStyle.js';

injectOnce('ds-checkbox', `
.ds-checkbox{width:18px;height:18px;accent-color:var(--ds-color-accent);border-radius:4px;cursor:pointer;flex-shrink:0;}
.ds-checkbox:disabled{cursor:not-allowed;opacity:.55;}
.ds-checkbox-row{display:inline-flex;align-items:center;gap:8px;font-family:var(--ds-font-sans);font-size:var(--ds-text-sm);color:var(--ds-color-fg);cursor:pointer;}
`);

export function Checkbox({ label, className = '', style, id, ...props }) {
  // See Field: a module counter desynchronises between server and client.
  const generated = React.useId();
  const inputId = id || generated;
  return (
    <label className="ds-checkbox-row" htmlFor={inputId} style={style}>
      <input id={inputId} type="checkbox" className={`ds-checkbox ${className}`.trim()} {...props} />
      {label}
    </label>
  );
}
