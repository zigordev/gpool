'use client';

import { Avatar } from '@/components/ui/Avatar';

interface Props {
  rank: number;
  name: string;
  points: number;
  pointsLabel: string;
  isCurrentUser?: boolean;
  /** Pre-formatted prize string (e.g. "30 €"). Renders below the points
   * total when provided. Hidden when undefined or empty. */
  prizeLabel?: string;
  /** Optional read-only "spy" action — when provided, renders a small eye-icon
   * button next to the points so members can peek at this user's picks. */
  onSpy?: () => void;
  spyLabel?: string;
}

export function RankCard({
  rank,
  name,
  points,
  pointsLabel,
  isCurrentUser = false,
  prizeLabel,
  onSpy,
  spyLabel,
}: Props) {

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '0.7rem 0.9rem',
        borderRadius: 'var(--radius-md)',
        background: isCurrentUser
          ? 'linear-gradient(100deg, rgb(var(--accent-from) / 0.08), rgb(var(--accent-to) / 0.08))'
          : 'rgb(var(--bg-elevated))',
        border: isCurrentUser
          ? '1px solid rgb(var(--accent-from) / 0.30)'
          : '1px solid rgb(var(--border))',
        boxShadow: isCurrentUser ? '0 0 0 3px rgb(var(--accent-from) / 0.08)' : 'none',
      }}
    >
      {/* Rank pill — number only, no medals */}
      <div
        aria-hidden
        style={{
          flexShrink: 0,
          width: '2.4rem',
          height: '2.4rem',
          borderRadius: '999px',
          background: isCurrentUser ? 'rgb(var(--accent-from) / 0.12)' : 'rgb(var(--bg-subtle))',
          color: isCurrentUser ? 'rgb(var(--accent-from))' : 'rgb(var(--fg-muted))',
          border: isCurrentUser ? '1px solid rgb(var(--accent-from) / 0.30)' : '1px solid rgb(var(--border))',
          fontFamily: 'var(--font-display, inherit)',
          fontSize: '0.95rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {`#${rank}`}
      </div>

      <Avatar label={name} size="sm" gradient={false} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'rgb(var(--fg))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: 0,
          }}
        >
          {name}
        </p>
        {isCurrentUser ? (
          <span className="eyebrow" style={{ fontSize: '0.65rem' }}>
            You
          </span>
        ) : null}
      </div>

      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'rgb(var(--fg))',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {points}
        </div>
        <div className="eyebrow" style={{ fontSize: '0.6rem' }}>{pointsLabel}</div>
        {prizeLabel ? (
          <div
            style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'rgb(var(--gold))',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
              marginTop: '0.1rem',
            }}
          >
            {prizeLabel}
          </div>
        ) : null}
      </div>

      {onSpy ? (
        <button
          type="button"
          onClick={onSpy}
          aria-label={spyLabel ?? 'Spy'}
          title={spyLabel ?? 'Spy'}
          className="btn btn-ghost btn-icon"
          style={{
            width: '2.1rem',
            height: '2.1rem',
            flexShrink: 0,
            color: 'rgb(var(--fg-muted))',
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
