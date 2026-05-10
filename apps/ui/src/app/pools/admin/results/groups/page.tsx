'use client';

import { useI18n } from '@/i18n/client';
import { Section } from '@/components/ui/Section';
import { countryIsoCode } from '@/lib/country-flags';
import ReactCountryFlag from 'react-country-flag';
import { useAdminContext } from '@/contexts/AdminContext';

function ScoreInput({
  value,
  onChange,
  ariaLabel,
}: Readonly<{
  value: number | '';
  onChange: (next: string) => void;
  ariaLabel: string;
}>) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value === '' ? '' : String(value)}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '' || /^\d+$/.test(v)) onChange(v);
      }}
      onKeyDown={(e) => {
        if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === 'E') e.preventDefault();
      }}
      aria-label={ariaLabel}
      style={{
        width: '2rem',
        padding: '0.18rem 0.1rem',
        textAlign: 'center',
        fontFamily: 'var(--font-display, inherit)',
        fontSize: '0.98rem',
        fontWeight: 700,
        color: 'rgb(var(--fg))',
        background: 'rgb(var(--bg-elevated))',
        border: '1px solid rgb(var(--border))',
        borderRadius: 'var(--radius-sm)',
        fontVariantNumeric: 'tabular-nums',
      }}
    />
  );
}

interface ResultEntryRowProps {
  match: Match;
  locale: string;
  result: { homeResult: number | ''; awayResult: number | '' };
  onChange: (matchId: string, side: 'home' | 'away', value: string) => void;
}

function ResultEntryRow({ match, locale, result, onChange }: Readonly<ResultEntryRowProps>) {
  const formattedDate = new Date(match.scheduledAt).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const matchDate = match.matchNumber ? `P${match.matchNumber} · ${formattedDate}` : formattedDate;

  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 4.65rem minmax(0, 1fr) 9rem',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.38rem 0.5rem',
        background: 'rgb(var(--bg-elevated))',
        border: '1px solid rgb(var(--border))',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div style={{ minWidth: 0 }}>
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
          <ReactCountryFlag countryCode={countryIsoCode(match.homeTeamName)} svg style={{ width: '2em', height: '2em' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.homeTeamName}</span>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2rem 0.45rem 2rem', alignItems: 'center' }}>
        <ScoreInput
          value={result.homeResult ?? ''}
          onChange={(v) => onChange(match.matchId, 'home', v)}
          ariaLabel={`${match.homeTeamName} result`}
        />
        <span
          aria-hidden
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: '1.1rem',
            color: 'rgb(var(--fg-subtle))',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          –
        </span>
        <ScoreInput
          value={result.awayResult ?? ''}
          onChange={(v) => onChange(match.matchId, 'away', v)}
          ariaLabel={`${match.awayTeamName} result`}
        />
      </div>

      <div style={{ minWidth: 0, textAlign: 'right' }}>
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
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.awayTeamName}</span>
          <ReactCountryFlag countryCode={countryIsoCode(match.awayTeamName)} svg style={{ width: '2em', height: '2em' }} />
        </p>
      </div>

      <div
        style={{
          minWidth: 0,
          display: 'grid',
          justifyItems: 'end',
          gap: '0.15rem',
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
      </div>
    </article>
  );
}

export default function AdminGroupsPage() {
  const { t, locale } = useI18n();
  const { groups, matchesByGroup, results, handleResultChange } = useAdminContext();

  return (
    <div className="content-panel">
      {groups.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {groups.map((group) => {
            const groupMatches = matchesByGroup[group] || [];
            return (
              <Section
                key={group}
                title={t('adminResults.groupPhase.group', { group })}
                collapsible
                defaultExpanded
                density="compact"
                tone="subtle"
                contentStyle={{ marginTop: '0.35rem', paddingTop: '0.35rem' }}
                style={{ padding: '0.45rem 0.55rem' }}
              >
                {groupMatches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {groupMatches.map((match) => (
                      <ResultEntryRow
                        key={match.matchId}
                        match={match}
                        locale={locale}
                        result={results[match.matchId] || { homeResult: '', awayResult: '' }}
                        onChange={handleResultChange}
                      />
                    ))}
                  </div>
                ) : null}
              </Section>
            );
          })}
        </div>
      ) : (
        <p
          style={{
            color: 'rgb(var(--fg-muted))',
            fontSize: '0.875rem',
            textAlign: 'center',
            padding: '1.5rem',
            margin: 0,
          }}
        >
          {t('adminResults.groupPhase.empty')}
        </p>
      )}
    </div>
  );
}
