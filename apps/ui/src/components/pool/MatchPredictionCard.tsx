'use client';

import { useId } from 'react';
import { Badge } from '@/components/ui/Badge';

export type MatchPredictionState =
  | 'open'           // accepting predictions, no result yet
  | 'incomplete'     // open, but user prediction is empty/invalid
  | 'locked'         // deadline passed, no result yet
  | 'exact'          // user predicted exact score
  | 'correct-winner' // user predicted correct winner but not exact score
  | 'incorrect'      // result in, user prediction was wrong
  | 'pending';       // result in, but no user prediction

interface Props {
  matchDate: string;
  homeTeamName: string;
  awayTeamName: string;
  /** User prediction (controlled). */
  homeScore: number | '';
  awayScore: number | '';
  /** Final result, when available. */
  homeResult?: number;
  awayResult?: number;
  /** Points earned for this match (if state is exact/correct-winner). */
  pointsEarned?: number;
  state: MatchPredictionState;
  /** Human-readable status badge text. */
  badgeLabel?: string;
  /** Disabled state — typically when deadline passed. */
  disabled?: boolean;
  saving?: boolean;
  compact?: boolean;
  onChange?: (side: 'home' | 'away', value: string) => void;
  /** Localised labels. */
  labels: {
    saving: string;
    incomplete: string;
    exactPoints: (points: number) => string;
    correctWinnerPoints: (points: number) => string;
    incorrect: string;
    result: (home: number | string, away: number | string) => string;
    locked: string;
  };
}

const STATE_TONES: Record<
  MatchPredictionState,
  { border: string; tint: string; statusBadge: 'pitch' | 'sunset' | 'live' | 'info' | 'neutral' | 'gold' | null }
> = {
  open:           { border: 'rgb(var(--border))',          tint: 'rgb(var(--bg-elevated))',                   statusBadge: null },
  incomplete:     { border: 'rgb(var(--gold) / 0.55)',     tint: 'rgb(var(--gold) / 0.08)',                   statusBadge: 'gold' },
  locked:         { border: 'rgb(var(--border))',          tint: 'rgb(var(--bg-subtle))',                     statusBadge: 'neutral' },
  exact:          { border: 'rgb(var(--info) / 0.55)',     tint: 'rgb(var(--info) / 0.08)',                   statusBadge: 'info' },
  'correct-winner':{ border: 'rgb(var(--pitch) / 0.55)',   tint: 'rgb(var(--pitch) / 0.08)',                  statusBadge: 'pitch' },
  incorrect:      { border: 'rgb(var(--live) / 0.45)',     tint: 'rgb(var(--live) / 0.07)',                   statusBadge: 'live' },
  pending:        { border: 'rgb(var(--border))',          tint: 'rgb(var(--bg-subtle))',                     statusBadge: 'neutral' },
};

export function MatchPredictionCard({
  matchDate,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  homeResult,
  awayResult,
  pointsEarned = 0,
  state,
  badgeLabel,
  disabled = false,
  saving = false,
  compact = false,
  onChange,
  labels,
}: Props) {
  const baseId = useId();
  const tone = STATE_TONES[state];
  const hasResults = homeResult !== undefined && awayResult !== undefined;

  const handleScoreInput = (side: 'home' | 'away', raw: string) => {
    if (raw === '' || /^\d+$/.test(raw)) {
      onChange?.(side, raw);
    }
  };

  if (compact) {
    const compactStatus = hasResults
      ? labels.result(homeResult!, awayResult!)
      : state === 'locked'
      ? labels.locked
      : state === 'incomplete'
      ? labels.incomplete
      : '';
    const compactPoints =
      state === 'exact'
        ? labels.exactPoints(pointsEarned)
        : state === 'correct-winner'
        ? labels.correctWinnerPoints(pointsEarned)
        : state === 'incorrect'
        ? labels.incorrect
        : '';

    return (
      <article
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 4.65rem minmax(0, 1fr) 8.5rem',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.38rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          background: tone.tint,
          border: `1px solid ${tone.border}`,
          opacity: disabled && state !== 'incorrect' && state !== 'exact' && state !== 'correct-winner' ? 0.85 : 1,
        }}
      >
        <p
          style={{
            minWidth: 0,
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'rgb(var(--fg))',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {homeTeamName}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '2rem 0.45rem 2rem', alignItems: 'center' }}>
          <input
            id={`${baseId}-home`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={homeScore === '' ? '' : String(homeScore)}
            onChange={(e) => handleScoreInput('home', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === 'E') e.preventDefault();
            }}
            disabled={disabled}
            aria-label={`${homeTeamName} score`}
            style={{
              width: '2rem',
              padding: '0.18rem 0.1rem',
              textAlign: 'center',
              fontFamily: 'var(--font-display, inherit)',
              fontSize: '0.98rem',
              fontWeight: 700,
              color: 'rgb(var(--fg))',
              background: disabled ? 'rgb(var(--bg-subtle))' : 'rgb(var(--bg-elevated))',
              border: '1px solid rgb(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontVariantNumeric: 'tabular-nums',
              cursor: disabled ? 'not-allowed' : 'text',
            }}
          />
          <span
            aria-hidden
            style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: '0.9rem',
              color: 'rgb(var(--fg-subtle))',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            –
          </span>
          <input
            id={`${baseId}-away`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={awayScore === '' ? '' : String(awayScore)}
            onChange={(e) => handleScoreInput('away', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === 'E') e.preventDefault();
            }}
            disabled={disabled}
            aria-label={`${awayTeamName} score`}
            style={{
              width: '2rem',
              padding: '0.18rem 0.1rem',
              textAlign: 'center',
              fontFamily: 'var(--font-display, inherit)',
              fontSize: '0.98rem',
              fontWeight: 700,
              color: 'rgb(var(--fg))',
              background: disabled ? 'rgb(var(--bg-subtle))' : 'rgb(var(--bg-elevated))',
              border: '1px solid rgb(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontVariantNumeric: 'tabular-nums',
              cursor: disabled ? 'not-allowed' : 'text',
            }}
          />
        </div>

        <p
          style={{
            minWidth: 0,
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'rgb(var(--fg))',
            margin: 0,
            textAlign: 'right',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {awayTeamName}
        </p>

        <div
          style={{
            minWidth: 0,
            display: 'grid',
            justifyItems: 'end',
            gap: '0.1rem',
            fontSize: '0.65rem',
            lineHeight: 1.1,
            color: 'rgb(var(--fg-muted))',
          }}
        >
          <span
            style={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              color: 'rgb(var(--fg-subtle))',
            }}
          >
            {matchDate}
          </span>
          <span
            style={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 700,
              color:
                state === 'exact'
                  ? 'rgb(var(--info))'
                  : state === 'correct-winner'
                  ? 'rgb(var(--pitch))'
                  : state === 'incorrect'
                  ? 'rgb(var(--live))'
                  : 'rgb(var(--fg-muted))',
            }}
          >
            {saving
              ? labels.saving
              : compactPoints || compactStatus || badgeLabel || ''}
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: compact ? '0.45rem 0.65rem' : '0.85rem',
        padding: compact ? '0.55rem 0.7rem' : '0.95rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: tone.tint,
        border: `1px solid ${tone.border}`,
        opacity: disabled && state !== 'incorrect' && state !== 'exact' && state !== 'correct-winner' ? 0.85 : 1,
        transition: 'background 0.18s ease, border-color 0.18s ease',
      }}
    >
      {/* Date eyebrow + status badge — top row spanning full width */}
      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: compact ? 0 : '0.25rem',
        }}
      >
        <span
          style={{
            fontSize: compact ? '0.65rem' : '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgb(var(--fg-subtle))',
          }}
        >
          {matchDate}
        </span>
        {tone.statusBadge && badgeLabel ? (
          <Badge variant={tone.statusBadge}>{badgeLabel}</Badge>
        ) : saving ? (
          <span
            style={{
              fontSize: '0.7rem',
              color: 'rgb(var(--fg-subtle))',
              fontStyle: 'italic',
              fontWeight: 500,
            }}
          >
            {labels.saving}
          </span>
        ) : null}
      </div>

      {/* Home team — left */}
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: compact ? '0.86rem' : '0.95rem',
            fontWeight: 600,
            color: 'rgb(var(--fg))',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {homeTeamName}
        </p>
      </div>

      {/* Score inputs / display — center */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        <input
          id={`${baseId}-home`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={homeScore === '' ? '' : String(homeScore)}
          onChange={(e) => handleScoreInput('home', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === 'E') e.preventDefault();
          }}
          disabled={disabled}
          aria-label={`${homeTeamName} score`}
          style={{
            width: compact ? '2.45rem' : '3rem',
            padding: compact ? '0.28rem 0.2rem' : '0.45rem 0.25rem',
            textAlign: 'center',
            fontFamily: 'var(--font-display, inherit)',
            fontSize: compact ? '1.08rem' : '1.4rem',
            fontWeight: 700,
            color: 'rgb(var(--fg))',
            background: disabled ? 'rgb(var(--bg-subtle))' : 'rgb(var(--bg-elevated))',
            border: `1px solid rgb(var(--border))`,
            borderRadius: 'var(--radius-sm)',
            fontVariantNumeric: 'tabular-nums',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
        <span
          aria-hidden
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: '1.1rem',
            color: 'rgb(var(--fg-subtle))',
            fontWeight: 600,
          }}
        >
          –
        </span>
        <input
          id={`${baseId}-away`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={awayScore === '' ? '' : String(awayScore)}
          onChange={(e) => handleScoreInput('away', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === 'E') e.preventDefault();
          }}
          disabled={disabled}
          aria-label={`${awayTeamName} score`}
          style={{
            width: compact ? '2.45rem' : '3rem',
            padding: compact ? '0.28rem 0.2rem' : '0.45rem 0.25rem',
            textAlign: 'center',
            fontFamily: 'var(--font-display, inherit)',
            fontSize: compact ? '1.08rem' : '1.4rem',
            fontWeight: 700,
            color: 'rgb(var(--fg))',
            background: disabled ? 'rgb(var(--bg-subtle))' : 'rgb(var(--bg-elevated))',
            border: `1px solid rgb(var(--border))`,
            borderRadius: 'var(--radius-sm)',
            fontVariantNumeric: 'tabular-nums',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
      </div>

      {/* Away team — right */}
      <div style={{ minWidth: 0, textAlign: 'right' }}>
        <p
          style={{
            fontSize: compact ? '0.86rem' : '0.95rem',
            fontWeight: 600,
            color: 'rgb(var(--fg))',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {awayTeamName}
        </p>
      </div>

      {/* Footer — official result + points or state hint, full width */}
      {hasResults || state === 'incomplete' || state === 'locked' ? (
        <div
          style={{
            gridColumn: '1 / -1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: compact ? '0.1rem' : '0.4rem',
            paddingTop: compact ? '0.35rem' : '0.55rem',
            borderTop: '1px dashed rgb(var(--border))',
            fontSize: compact ? '0.72rem' : '0.8rem',
            color: 'rgb(var(--fg-muted))',
          }}
        >
          <span>
            {hasResults ? (
              <>
                <span style={{ color: 'rgb(var(--fg-subtle))', fontWeight: 600, marginRight: '0.4rem' }}>FT</span>
                <span style={{ color: 'rgb(var(--fg))', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {labels.result(homeResult!, awayResult!)}
                </span>
              </>
            ) : state === 'locked' ? (
              labels.locked
            ) : state === 'incomplete' ? (
              labels.incomplete
            ) : null}
          </span>
          <span style={{ fontWeight: 600 }}>
            {state === 'exact' ? (
              <span style={{ color: 'rgb(var(--info))' }}>{labels.exactPoints(pointsEarned)}</span>
            ) : state === 'correct-winner' ? (
              <span style={{ color: 'rgb(var(--pitch))' }}>{labels.correctWinnerPoints(pointsEarned)}</span>
            ) : state === 'incorrect' ? (
              <span style={{ color: 'rgb(var(--live))' }}>{labels.incorrect}</span>
            ) : null}
          </span>
        </div>
      ) : null}
    </article>
  );
}
