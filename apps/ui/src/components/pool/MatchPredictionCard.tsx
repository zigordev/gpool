'use client';

import { useId } from 'react';
import { countryIsoCode } from '@/lib/country-flags';
import ReactCountryFlag from 'react-country-flag';
import { useI18n } from '@/i18n/client';
import { MatchPredictionState } from '@/types/matchPredictionState.type';
import { PointsBadge } from '../PointsBadge';
interface Props {
  matchDate: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | '';
  awayScore: number | '';
  homeResult?: number;
  awayResult?: number;
  pointsEarned?: number;
  state: MatchPredictionState;
  badgeLabel?: string;
  disabled?: boolean;
  onChange?: (side: 'home' | 'away', value: string) => void;
  isPastDeadline?: boolean;
  onOpenInsights?: () => void;
  showTeams?: boolean;
  showMatchDate?: boolean;
  showRealResult?: boolean;
}

const STATE_TONES: Record<
  MatchPredictionState,
  { border: string; tint: string; statusBadge: 'pitch' | 'sunset' | 'live' | 'info' | 'neutral' | 'gold' | null }
> = {
  open:           { border: 'rgb(var(--border))',          tint: 'rgb(var(--bg-elevated))',                   statusBadge: null },
  incomplete:     { border: 'rgb(var(--gold) / 0.55)',     tint: 'rgb(var(--gold) / 0.08)',                   statusBadge: 'gold' },
  locked:         { border: 'rgb(var(--border))',          tint: 'rgb(var(--bg-subtle))',                     statusBadge: 'neutral' },
  exact:          { border: 'rgb(var(--pitch) / 0.55)',    tint: 'rgb(var(--pitch) / 0.08)',                  statusBadge: 'pitch' },
  'correct-winner':{ border: 'rgb(var(--info) / 0.55)',   tint: 'rgb(var(--info) / 0.08)',                   statusBadge: 'info' },
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
  pointsEarned,
  state,
  badgeLabel,
  disabled = false,
  onChange,
  isPastDeadline,
  onOpenInsights,
  showTeams = true,
  showMatchDate = true,
  showRealResult = true,
}: Readonly<Props>) {
  const hasRealResult = isPastDeadline && typeof homeResult === 'number' && typeof awayResult === 'number';
  const baseId = useId();
  const tone = STATE_TONES[state];
  const hasStatusBorder = state === 'incomplete' || state === 'exact' || state === 'correct-winner' || state === 'incorrect';

  const { t } = useI18n()

  const handleScoreInput = (side: 'home' | 'away', raw: string) => {
    if (raw === '' || /^\d+$/.test(raw)) {
      onChange?.(side, raw);
    }
  };

  return (
    <article
      role={onOpenInsights ? 'button' : undefined}
      tabIndex={onOpenInsights ? 0 : undefined}
      onClick={onOpenInsights}
      onKeyDown={(event) => {
        if (onOpenInsights && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onOpenInsights();
        }
      }}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: showTeams
          ? 'minmax(0, 1fr) 4.65rem minmax(0, 1fr)'
          : 'minmax(0, 1fr)',
        alignItems: 'center',
        gap: '0.25rem 0.35rem',
        padding: '0.38rem 0.5rem',
        borderRadius: 'var(--radius-sm)',
        background: `linear-gradient(var(--card-sheen), var(--card-sheen)), ${tone.tint}`,
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: `${hasStatusBorder ? 3 : 1}px solid ${tone.border}`,
        boxShadow: 'inset 0 1px 0 var(--card-inset-highlight), 0 3px 10px rgb(0 0 0 / 0.10)',
        opacity: disabled && state !== 'incorrect' && state !== 'exact' && state !== 'correct-winner' ? 0.85 : 1,
        cursor: onOpenInsights ? 'pointer' : undefined,
      }}
    >
      {onOpenInsights ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            borderRadius: 'inherit',
            cursor: 'pointer',
          }}
        />
      ) : null}
      {isPastDeadline && pointsEarned ? (
        <PointsBadge
          points={pointsEarned}
          label={t('poolDetail.match.points', { points: pointsEarned })}
        />
      ) : null
      }
      {showTeams ? (
        <p
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'rgb(var(--fg))',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <ReactCountryFlag countryCode={countryIsoCode(homeTeamName)} svg style={{ width: '2em', height: '2em' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{homeTeamName}</span>
        </p>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '2rem 0.45rem 2rem', alignItems: 'center', justifyContent: 'center' }}>
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
            background: disabled ? 'rgb(var(--bg-subtle))' : 'rgb(var(--input-bg))',
            border: '1px solid rgb(var(--border))',
            borderRadius: 'var(--radius-md)',
            fontVariantNumeric: 'tabular-nums',
            transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
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
            background: disabled ? 'rgb(var(--bg-subtle))' : 'rgb(var(--input-bg))',
            border: '1px solid rgb(var(--border))',
            borderRadius: 'var(--radius-md)',
            fontVariantNumeric: 'tabular-nums',
            transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
      </div>

      {showTeams ? (
        <p
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'rgb(var(--fg))',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{awayTeamName}</span>
          <ReactCountryFlag countryCode={countryIsoCode(awayTeamName)} svg style={{ width: '2em', height: '2em' }} />
        </p>
      ) : null}

      <div
        style={{
          gridColumn: '1 / -1',
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: showMatchDate ? 'space-between' : 'flex-end',
          gap: '0.5rem',
          paddingTop: '0.28rem',
          borderTop: '1px dashed rgb(var(--border) / 0.75)',
          fontSize: '0.68rem',
          lineHeight: 1.2,
          color: 'rgb(var(--fg-muted))',
        }}
      >
        {showMatchDate ? (
          <span
            style={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              color: 'rgb(var(--fg-subtle))',
              minWidth: 0,
            }}
          >
            {matchDate}
          </span>
        ) : null}
        <span
          style={{
            maxWidth: '100%',
            minWidth: 0,
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color:
              state === 'exact'
                ? 'rgb(var(--pitch))'
                : state === 'correct-winner'
                ? 'rgb(var(--info))'
                : state === 'incorrect'
                ? 'rgb(var(--live))'
                : 'rgb(var(--fg-muted))',
          }}
        >
          {showRealResult && hasRealResult
            ? `${homeResult} – ${awayResult}${badgeLabel ? ' · ' : ''}`
            : ''}
          {badgeLabel}
        </span>
      </div>
    </article>
  );
}
