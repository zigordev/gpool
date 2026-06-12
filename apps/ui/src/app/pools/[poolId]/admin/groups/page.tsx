'use client';

import { useI18n } from '@/i18n/client';
import { Section } from '@/components/ui/Section';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { countryIsoCode } from '@/lib/country-flags';
import ReactCountryFlag from 'react-country-flag';
import { parseConfigNumberInput, useAdminContext } from '@/contexts/AdminContext';
import { IoSettings } from 'react-icons/io5';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';

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
        background: 'rgb(var(--input-bg))',
        border: '1px solid rgb(var(--border))',
        borderRadius: 'var(--radius-md)',
        fontVariantNumeric: 'tabular-nums',
        transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
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
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 4.65rem minmax(0, 1fr)',
        alignItems: 'center',
        gap: '0.25rem 0.35rem',
        padding: '0.38rem 0.5rem',
        background: 'linear-gradient(var(--card-sheen), var(--card-sheen)), rgb(var(--bg-elevated))',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: '1px solid rgb(var(--border))',
        boxShadow: 'inset 0 1px 0 var(--card-inset-highlight), 0 3px 10px rgb(0 0 0 / 0.10)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
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
          gridColumn: '1 / -1',
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          paddingTop: '0.28rem',
          borderTop: '1px dashed rgb(var(--border) / 0.75)',
          fontSize: '0.68rem',
          lineHeight: 1.2,
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
            minWidth: 0,
          }}
        >
          {matchDate}
        </span>
      </div>
    </article>
  );
}

function FairPlayTable({
  teams,
  updatingTeamId,
  onSave,
}: Readonly<{
  teams: Team[];
  updatingTeamId: string | null;
  onSave: (teamId: string, fairPlay: number) => Promise<void>;
}>) {
  const { t } = useI18n();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const previousRowPositions = useRef(new Map<string, DOMRect>());

  useEffect(() => {
    setDrafts(Object.fromEntries(teams.map((team) => [team.teamId, String(team.fairPlay ?? 0)])));
  }, [teams]);

  const orderedTeams = useMemo(() => {
    const draftScore = (team: Team) => {
      const draft = drafts[team.teamId];
      if (draft && /^-?\d+$/.test(draft)) {
        return Math.min(0, Number.parseInt(draft, 10));
      }
      return team.fairPlay ?? 0;
    };

    return teams
      .map((team, originalIndex) => ({ team, originalIndex }))
      .sort((a, b) => (
        draftScore(b.team) - draftScore(a.team) ||
        (a.team.fifaRanking ?? Number.MAX_SAFE_INTEGER) - (b.team.fifaRanking ?? Number.MAX_SAFE_INTEGER) ||
        a.originalIndex - b.originalIndex
      ))
      .map(({ team }) => team);
  }, [drafts, teams]);

  useLayoutEffect(() => {
    const nextPositions = new Map<string, DOMRect>();
    orderedTeams.forEach((team) => {
      const row = rowRefs.current.get(team.teamId);
      if (!row) return;
      const nextPosition = row.getBoundingClientRect();
      nextPositions.set(team.teamId, nextPosition);
      const previousPosition = previousRowPositions.current.get(team.teamId);
      const deltaY = previousPosition ? previousPosition.top - nextPosition.top : 0;
      if (deltaY && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        row.animate(
          [
            { transform: `translateY(${deltaY}px)` },
            { transform: 'translateY(0)' },
          ],
          { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
      }
    });
    previousRowPositions.current = nextPositions;
  }, [orderedTeams]);

  const saveDraft = async (team: Team) => {
    const draft = drafts[team.teamId] ?? String(team.fairPlay ?? 0);
    if (!/^-?\d+$/.test(draft)) {
      setDrafts((prev) => ({ ...prev, [team.teamId]: String(team.fairPlay ?? 0) }));
      return;
    }
    const next = Math.min(0, Number.parseInt(draft, 10));
    setDrafts((prev) => ({ ...prev, [team.teamId]: String(next) }));
    if (next === (team.fairPlay ?? 0)) return;
    try {
      await onSave(team.teamId, next);
    } catch {
      setDrafts((prev) => ({ ...prev, [team.teamId]: String(team.fairPlay ?? 0) }));
    }
  };

  return (
    <Section
      title={t('adminResults.groupPhase.fairPlay.title')}
      collapsible
      defaultExpanded
      density="compact"
      tone="muted"
    >
      <p style={{ margin: '0 0 0.65rem', color: 'rgb(var(--fg-muted))', fontSize: '0.84rem', lineHeight: 1.45 }}>
        <span>
          {t('adminResults.groupPhase.fairPlay.description')}{' '}
          <a
            href="https://www.transfermarkt.co.uk/weltmeisterschaft/fairnesstabelle/pokalwettbewerb/FIWC/saison_id/2025"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'rgb(var(--fg))', fontWeight: 600 }}
          >
            {t('adminResults.groupPhase.fairPlay.fairPlaySourceLink')}
            <FaExternalLinkAlt size={11} aria-hidden />
          </a>
        </span>
      </p>
      <div
        style={{
          overflowX: 'auto',
          background: 'rgb(var(--bg-elevated))',
          border: '1px solid rgb(var(--border))',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead style={{ background: 'rgb(var(--panel-muted-bg-solid))' }}>
            <tr>
              <th scope="col" style={{ width: '3.5rem', padding: '0.55rem 0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
                {t('adminResults.groupPhase.fairPlay.rank')}
              </th>
              <th scope="col" style={{ padding: '0.55rem 0.7rem', textAlign: 'left', fontSize: '0.75rem' }}>
                {t('adminResults.groupPhase.fairPlay.team')}
              </th>
              <th scope="col" style={{ width: '6.5rem', padding: '0.55rem 0.5rem', textAlign: 'right', fontSize: '0.75rem' }}>
                {t('adminResults.groupPhase.fairPlay.points')}
              </th>
            </tr>
          </thead>
          <tbody style={{ background: 'rgb(var(--bg-elevated))' }}>
            {orderedTeams.map((team, index) => (
              <tr
                key={team.teamId}
                ref={(row) => {
                  if (row) rowRefs.current.set(team.teamId, row);
                  else rowRefs.current.delete(team.teamId);
                }}
                style={{ borderTop: '1px solid rgb(var(--border-subtle))' }}
              >
                <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: 'rgb(var(--fg-muted))', fontSize: '0.82rem', fontWeight: 700 }}>
                  {index + 1}
                </td>
                <td style={{ minWidth: 0, padding: '0.45rem 0.5rem' }}>
                  <span style={{ display: 'flex', minWidth: 0, alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', fontWeight: 600 }}>
                    <ReactCountryFlag countryCode={countryIsoCode(team.name)} svg style={{ width: '1.5em', height: '1.5em' }} />
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
                  </span>
                </td>
                <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={drafts[team.teamId] ?? String(team.fairPlay ?? 0)}
                    disabled={updatingTeamId === team.teamId}
                    aria-label={t('adminResults.groupPhase.fairPlay.inputLabel', { team: team.name })}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (/^-?\d*$/.test(value)) {
                        setDrafts((prev) => ({ ...prev, [team.teamId]: value }));
                      }
                    }}
                    onBlur={() => void saveDraft(team)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                      if (event.key === '+' || event.key === '.' || event.key === 'e' || event.key === 'E') event.preventDefault();
                    }}
                    style={{
                      width: '4.5rem',
                      minHeight: '2rem',
                      padding: '0.3rem 0.45rem',
                      textAlign: 'right',
                      color: 'rgb(var(--fg))',
                      background: 'rgb(var(--input-bg))',
                      border: '1px solid rgb(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export default function AdminGroupsPage() {
  const { t, locale } = useI18n();
  const {
    systemMode,
    scoringConfig, setScoringConfig,
    groups, matchesByGroup, results, handleResultChange,
    teams, updatingTeamFairPlay, handleTeamFairPlayChange,
  } = useAdminContext();

  return (
    <div className="content-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Group phase scoring */}
      {!systemMode ? <Section title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><IoSettings size={13} aria-hidden />{t('adminResults.scoring.title')}</span>} collapsible defaultExpanded density="compact" tone="muted">
        <div className="config-area" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
          <FormField label={t('adminResults.scoring.groupPhaseWinner')}>
            <Input type="number" inputMode="numeric" min="0" value={scoringConfig.winnerPoints} attention={scoringConfig.winnerPoints === ''} onChange={(e) => setScoringConfig((prev) => ({ ...prev, winnerPoints: parseConfigNumberInput(e.target.value) }))} />
          </FormField>
          <FormField label={t('adminResults.scoring.groupPhaseExact')}>
            <Input type="number" inputMode="numeric" min="0" value={scoringConfig.exactResultPoints} attention={scoringConfig.exactResultPoints === ''} onChange={(e) => setScoringConfig((prev) => ({ ...prev, exactResultPoints: parseConfigNumberInput(e.target.value) }))} />
          </FormField>
        </div>
      </Section> : null}

      {/* Match results */}
      {systemMode && groups.length > 0 ? (
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
      ) : systemMode ? (
        <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
          {t('adminResults.groupPhase.empty')}
        </p>
      ) : null}

      {systemMode && teams.length > 0 ? (
        <FairPlayTable
          teams={teams}
          updatingTeamId={updatingTeamFairPlay}
          onSave={handleTeamFairPlayChange}
        />
      ) : null}

    </div>
  );
}
