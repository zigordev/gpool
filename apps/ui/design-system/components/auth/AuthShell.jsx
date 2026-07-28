import React from 'react';
import { injectOnce } from '../_shared/injectStyle.js';

injectOnce('ds-auth-shell', `
.ds-auth-shell{position:relative;min-height:100vh;display:grid;place-items:center;padding:28px;overflow:hidden;
  background:linear-gradient(145deg, color-mix(in oklch, var(--ds-color-accent) 12%, transparent), transparent 45%), var(--ds-color-bg);}
`);

/** Full-viewport centering shell for auth screens (login, invite-accept,
 * etc). Background wash is tinted from `--ds-color-accent`, so it's on-brand
 * per theme automatically — no per-app gradient to hand-tune. */
export function AuthShell({ children, utilities, className = '', style }) {
  return (
    <main className={`ds-auth-shell ${className}`.trim()} style={style}>
      {utilities ? (
        <div
          style={{
            position: 'absolute', top: '1rem', right: '1rem', zIndex: 2,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          {utilities}
        </div>
      ) : null}
      {children}
    </main>
  );
}
