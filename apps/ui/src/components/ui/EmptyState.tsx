'use client';

import type { ReactNode } from 'react';

type Variant = 'pitch' | 'whistle' | 'icon';

interface Props {
  /** Render a custom React node (e.g. lucide icon) instead of the bundled
   *  illustration. When set, `variant` is ignored. */
  icon?: ReactNode;
  /** Default illustration to show. `pitch` is the calm aerial-view used when
   *  there's nothing to predict yet; `whistle` for "no results yet" / search
   *  scenarios; `icon` if you'd rather pass one via `icon`. */
  variant?: Variant;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Single visual style across every empty surface in the app: a calm pitch
 * line-drawing for "nothing to do yet" and a referee's whistle for "no
 * results / no matches found". One style ⇒ a coherent feel even though the
 * empty states live in very different parts of the app.
 */
export function EmptyState({ icon, variant = 'pitch', title, description, action }: Props) {
  return (
    <div
      className="surface gp-fade-in"
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
      ) : (
        <div
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.1rem',
            color: 'rgb(var(--fg-subtle))',
            opacity: 0.85,
          }}
        >
          {variant === 'whistle' ? <WhistleIllustration /> : <PitchIllustration />}
        </div>
      )}
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

/**
 * Stylised top-down pitch — the same visual language as the players-tab
 * soccer field, so the app's empty states feel like part of the same product.
 */
function PitchIllustration() {
  return (
    <svg
      width="132"
      height="88"
      viewBox="0 0 132 88"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* outer touchline */}
      <rect x="4" y="4" width="124" height="80" rx="3" />
      {/* halfway line + centre */}
      <line x1="66" y1="4" x2="66" y2="84" />
      <circle cx="66" cy="44" r="13" />
      <circle cx="66" cy="44" r="1.4" fill="currentColor" stroke="none" />
      {/* penalty areas */}
      <rect x="4" y="20" width="20" height="48" />
      <rect x="108" y="20" width="20" height="48" />
      {/* goal areas */}
      <rect x="4" y="32" width="8" height="24" />
      <rect x="120" y="32" width="8" height="24" />
      {/* penalty arcs */}
      <path d="M 24 36 A 8 8 0 0 1 24 52" />
      <path d="M 108 36 A 8 8 0 0 0 108 52" />
    </svg>
  );
}

/**
 * Referee's whistle — single-stroke geometric line art. Used for "no
 * results / nothing matches" empty states, paired with copy that nudges the
 * user toward either waiting (the whistle hasn't blown yet) or refining
 * their query.
 */
function WhistleIllustration() {
  return (
    <svg
      width="120"
      height="84"
      viewBox="0 0 120 84"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* lanyard */}
      <path d="M 12 8 C 24 22 38 30 50 36" />
      {/* whistle body */}
      <rect x="48" y="28" width="44" height="22" rx="6" />
      {/* mouthpiece */}
      <path d="M 92 36 L 102 32 L 102 46 L 92 42 Z" />
      {/* hole */}
      <circle cx="68" cy="39" r="3" />
      {/* sound waves */}
      <path d="M 104 56 L 110 64" />
      <path d="M 96 64 L 100 72" />
      <path d="M 88 70 L 88 78" />
    </svg>
  );
}
