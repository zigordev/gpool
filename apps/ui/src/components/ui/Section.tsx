'use client';

import { useState, type ReactNode } from 'react';

type Density = 'default' | 'compact';
type Tone = 'surface' | 'subtle' | 'muted';

interface Props {
  title: ReactNode;
  /** Small label rendered above the title. */
  eyebrow?: ReactNode;
  /** Right-side area (counts, actions) shown next to the title. */
  trailing?: ReactNode;
  /** Short description rendered under the title row. */
  description?: ReactNode;
  /** Wraps the children in the standard inner padding. Default true. */
  collapsible?: boolean;
  defaultExpanded?: boolean;
  /** Override expanded state (controlled). */
  expanded?: boolean;
  onExpandedChange?: (next: boolean) => void;
  density?: Density;
  tone?: Tone;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children: ReactNode;
}

export function Section({
  title,
  eyebrow,
  trailing,
  description,
  collapsible = false,
  defaultExpanded = true,
  expanded,
  onExpandedChange,
  density = 'default',
  tone = 'surface',
  style,
  contentStyle,
  children,
}: Props) {
  const [internal, setInternal] = useState(defaultExpanded);
  const isOpen = expanded ?? internal;

  const toggle = () => {
    if (!collapsible) return;
    if (expanded === undefined) setInternal((v) => !v);
    onExpandedChange?.(!isOpen);
  };

  const padX = density === 'compact' ? '0.75rem' : '1.5rem';
  const padY = density === 'compact' ? '0.65rem' : '1.5rem';

  const headerRow = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        cursor: collapsible ? 'pointer' : 'default',
        userSelect: collapsible ? 'none' : 'auto',
      }}
      onClick={collapsible ? toggle : undefined}
      role={collapsible ? 'button' : undefined}
      tabIndex={collapsible ? 0 : undefined}
      onKeyDown={
        collapsible
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
              }
            }
          : undefined
      }
      aria-expanded={collapsible ? isOpen : undefined}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        {eyebrow ? (
          <div className="eyebrow" style={{ marginBottom: '0.35rem' }}>
            {eyebrow}
          </div>
        ) : null}
        <h2
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: density === 'compact' ? '0.875rem' : '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'rgb(var(--fg))',
            margin: 0,
          }}
        >
          {title}
        </h2>
        {description ? (
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'rgb(var(--fg-muted))',
              marginTop: '0.35rem',
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        {trailing}
        {collapsible ? (
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: '999px',
              background: 'rgb(var(--bg-subtle))',
              color: 'rgb(var(--fg-muted))',
              transition: 'transform 0.18s ease, background 0.18s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        ) : null}
      </div>
    </div>
  );

  return (
    <section
      className={tone === 'surface' ? 'surface' : ''}
      style={{
        padding: `${padY} ${padX}`,
        background: tone === 'subtle' || tone === 'muted' ? 'var(--panel-muted-bg)' : undefined,
        border: tone === 'subtle' || tone === 'muted' ? '1px solid rgb(var(--border) / 0.5)' : undefined,
        borderRadius: tone === 'subtle' || tone === 'muted' ? 'var(--radius-lg)' : undefined,
        ...style,
      }}
    >
      {headerRow}
      {(!collapsible || isOpen) ? (
        <div
          style={{
            marginTop: density === 'compact' ? '0.5rem' : '1.25rem',
            paddingTop: density === 'compact' ? '0.5rem' : '1.25rem',
            borderTop: '1px solid rgb(var(--border-subtle))',
            ...contentStyle,
          }}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
