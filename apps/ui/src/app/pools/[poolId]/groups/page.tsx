'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useI18n } from '@/i18n/client';
import { usePoolContext, resolveGroupScoring } from '@/contexts/PoolContext';
import { Section } from '@/components/ui/Section';
import { MatchPredictionCard } from '@/components/pool/MatchPredictionCard';
import {
  MatchInsightsModal,
  type MatchInsightsTarget,
} from '@/components/pool/MatchInsightsModal';
import { MatchPredictionState } from '@/types/matchPredictionState.type';
import {
  GroupScoringInfoSection,
  resolvePlayerInfoScoring,
} from '@/components/pool/PoolInfoSections';
import { compareThirdPlaceRows, computeGroupStandings, computeRealGroupStandings } from '@/lib/bracket-projection';
import { countryDisplayName, countryIsoCode } from '@/lib/country-flags';
import ReactCountryFlag from 'react-country-flag';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { IoWarning } from 'react-icons/io5';

export default function GroupsPage() {
  const { t, locale } = useI18n();
  const {
    groups,
    matchesByGroup,
    predictions,
    poolDeadline,
    pool,
    poolId,
    teams,
    handleScoreChange,
  } = usePoolContext();
  const [insightsTarget, setInsightsTarget] = useState<MatchInsightsTarget | null>(null);
  const groupScoringConfig = resolveGroupScoring(pool?.config?.scoring);
  const playerScoringConfig = resolvePlayerInfoScoring(pool?.config?.playerScoring);
  const groupStandings = useMemo(
    () => computeGroupStandings(matchesByGroup, predictions, teams),
    [matchesByGroup, predictions, teams],
  );
  const realGroupStandings = useMemo(
    () => computeRealGroupStandings(matchesByGroup, teams),
    [matchesByGroup, teams],
  );
  const bestThirdsRanking = useMemo(
    () => Object.values(groupStandings)
      .map((standings) => standings[2])
      .filter(Boolean)
      .sort(compareThirdPlaceRows),
    [groupStandings],
  );

  return (
    <div className="content-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <GroupScoringInfoSection
        groupScoring={groupScoringConfig}
        defaultExpanded
      />

      {groups.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {groups.map((group) => {
            const groupMatches = matchesByGroup[group] || [];
            const standings = groupStandings[group] || [];
            const realStandings = realGroupStandings[group] || [];
            return (
              <Section
                key={group}
                title={t('poolDetail.groupPhase.group', { group })}
                collapsible
                defaultExpanded
                density="compact"
                tone="subtle"
                contentStyle={{ marginTop: '0.35rem', paddingTop: '0.35rem' }}
                style={{ padding: '0.45rem 0.55rem' }}
              >
                {groupMatches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {standings.length > 0 ? (
                      <>
                        <p
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.25rem minmax(0, 1fr)',
                            gap: '0.45rem',
                            alignItems: 'start',
                            margin: '0.15rem 0 0',
                            color: 'rgb(var(--fg-muted))',
                            fontSize: '0.84rem',
                            lineHeight: 1.45,
                          }}
                        >
                          <IoWarning aria-hidden style={{ color: 'rgb(var(--gold))', marginTop: '0.1rem' }} />
                          <span>
                            {t('poolDetail.rules.points.notRealStanding')}{' '}
                          </span>
                        </p>
                        <PredictionStandingsTable
                          rows={standings}
                          t={t}
                          minWidth={460}
                          qualificationCutoff={2}
                          style={{ marginBottom: '0.4rem' }}
                        />
                      </>
                    ) : null}
                    {realStandings.length > 0 ? (
                      <>
                        <p
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.25rem minmax(0, 1fr)',
                            gap: '0.45rem',
                            alignItems: 'start',
                            margin: '0.15rem 0 0',
                            color: 'rgb(var(--fg-muted))',
                            fontSize: '0.84rem',
                            lineHeight: 1.45,
                          }}
                        >
                          <IoWarning aria-hidden style={{ color: 'rgb(var(--gold))', marginTop: '0.1rem' }} />
                          <span>
                            {t('poolDetail.rules.points.realVirtualStanding')}{' '}
                          </span>
                        </p>
                        <PredictionStandingsTable
                          rows={realStandings}
                          t={t}
                          minWidth={460}
                          qualificationCutoff={2}
                          style={{ marginBottom: '0.4rem' }}
                        />
                      </>
                    ) : null}
                    {groupMatches.map((match) => {
                      const prediction = predictions[match.matchId] || ({ homeScore: '', awayScore: '' } as Prediction);
                      const isPastDeadline = Date.now() >= poolDeadline;
                      const formattedDate = new Date(match.scheduledAt).toLocaleString(locale, {
                        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                      });
                      const matchDate = match.matchNumber ? `P${match.matchNumber} · ${formattedDate}` : formattedDate;

                      const hasResults = typeof match.homeResult === 'number' && typeof match.awayResult === 'number';
                      const isExactMatch = isPastDeadline && hasResults && prediction.isExactMatch === true;
                      const isCorrectWinner = isPastDeadline && hasResults && prediction.isCorrect === true && !isExactMatch;
                      const hasUserPrediction = prediction.homeScore !== '' && prediction.awayScore !== '';
                      const isIncorrect = isPastDeadline && hasResults && hasUserPrediction && prediction.isCorrect === false;
                      const isIncomplete =
                        !isPastDeadline &&
                        (prediction.homeScore === '' || prediction.awayScore === '');

                      let state: MatchPredictionState;
                      let badgeLabel: string | undefined;
                      if (isExactMatch) { state = 'exact'; badgeLabel = t('poolDetail.match.exactBadge'); }
                      else if (isCorrectWinner) { state = 'correct-winner'; badgeLabel = t('poolDetail.match.correctWinnerBadge'); }
                      else if (isIncorrect) { state = 'incorrect'; badgeLabel = t('poolDetail.match.incorrectBadge'); }
                      else if (hasResults && !hasUserPrediction && isPastDeadline) { state = 'pending'; badgeLabel = t('poolDetail.match.pendingBadge'); }
                      else if (!hasResults && isPastDeadline) { state = 'locked'; badgeLabel = t('poolDetail.deadline.passedShort'); }
                      else if (isIncomplete) { state = 'incomplete'; badgeLabel = t('poolDetail.match.incomplete'); }
                      else { state = 'open'; }

                      return (
                        <MatchPredictionCard
                          key={match.matchId}
                          matchDate={matchDate}
                          homeTeamName={match.homeTeamName}
                          awayTeamName={match.awayTeamName}
                          homeScore={prediction.homeScore}
                          awayScore={prediction.awayScore}
                          homeResult={typeof match.homeResult === 'number' ? match.homeResult : undefined}
                          awayResult={typeof match.awayResult === 'number' ? match.awayResult : undefined}
                          pointsEarned={prediction.points || 0}
                          state={state}
                          badgeLabel={badgeLabel}
                          disabled={isPastDeadline}
                          onChange={(side, value) => handleScoreChange(match.matchId, side, value)}
                          isPastDeadline={isPastDeadline}
                          onOpenInsights={
                            isPastDeadline
                              ? () => setInsightsTarget({
                                  matchId: match.matchId,
                                  matchType: 'group',
                                })
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '0.75rem', margin: 0 }}>
                    {t('poolDetail.groupPhase.noMatches')}
                  </p>
                )}
              </Section>
            );
          })}

          {bestThirdsRanking.length > 0 ? (
            <Section
              title={t('poolDetail.groupPhase.bestThirdsTitle')}
              collapsible
              defaultExpanded
              density="compact"
              tone="subtle"
              contentStyle={{ marginTop: '0.35rem', paddingTop: '0.35rem' }}
              style={{ padding: '0.45rem 0.55rem' }}
            >
              <PredictionStandingsTable
                rows={bestThirdsRanking}
                t={t}
                showGroup
                minWidth={560}
                qualificationCutoff={8}
              />
            </Section>
          ) : null}
        </div>
      ) : (
        <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
          {t('poolDetail.groupPhase.noMatches')}
        </p>
      )}

      <MatchInsightsModal
        poolId={poolId}
        target={insightsTarget}
        onClose={() => setInsightsTarget(null)}
        playerScoring={playerScoringConfig}
      />
    </div>
  );
}

type TranslationFn = (key: string, values?: Record<string, string | number>) => string;

function PredictionStandingsTable({
  rows,
  t,
  caption,
  showGroup = false,
  showStatus = false,
  minWidth,
  qualificationCutoff,
  style,
}: Readonly<{
  rows: StandingRow[];
  t: TranslationFn;
  caption?: string;
  showGroup?: boolean;
  showStatus?: boolean;
  minWidth: number;
  qualificationCutoff: number;
  style?: CSSProperties;
}>) {
  const columns = [
    { key: 'position', label: t('poolDetail.groupPhase.standings.position'), align: 'center' as const },
    { key: 'team', label: t('poolDetail.groupPhase.standings.team'), align: 'left' as const },
    ...(showGroup
      ? [{ key: 'group', label: t('poolDetail.groupPhase.standings.group'), align: 'center' as const }]
      : []),
    { key: 'points', label: t('poolDetail.groupPhase.standings.points'), align: 'right' as const },
    { key: 'played', label: t('poolDetail.groupPhase.standings.played'), align: 'right' as const },
    { key: 'goalsFor', label: t('poolDetail.groupPhase.standings.goalsFor'), align: 'right' as const },
    { key: 'goalsAgainst', label: t('poolDetail.groupPhase.standings.goalsAgainst'), align: 'right' as const },
    { key: 'goalDifference', label: t('poolDetail.groupPhase.standings.goalDifference'), align: 'right' as const },
    ...(showStatus
      ? [{ key: 'status', label: t('poolDetail.groupPhase.standings.status'), align: 'center' as const }]
      : []),
  ];

  return (
    <div
      style={{
        overflow: 'clip',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgb(var(--border))',
        background: 'rgb(var(--bg-elevated))',
        boxShadow: '0 4px 14px rgb(15 23 42 / 0.08)',
        ...style,
      }}
    >
      {caption ? (
        <div
          style={{
            padding: '0.5rem 0.6rem',
            background: 'rgb(var(--panel-muted-bg-solid))',
            borderBottom: '1px solid rgb(var(--border))',
            color: 'rgb(var(--fg-subtle))',
            fontSize: '0.65rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {caption}
        </div>
      ) : null}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            minWidth,
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr
              style={{
                background: 'rgb(var(--panel-muted-bg-solid))',
                borderBottom: '1px solid rgb(var(--border))',
              }}
            >
              {columns.map((column) => (
                <th key={column.key} scope="col" style={{ ...standingsThStyle, textAlign: column.align }}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const qualified = index < qualificationCutoff;
              return (
                <tr key={`${row.group}-${row.teamId}`} style={{ borderBottom: '1px solid rgb(var(--border) / 0.65)' }}>
                  <td style={{ ...standingsTdStyle, textAlign: 'center', fontWeight: 800, color: qualified ? 'rgb(var(--pitch))' : 'rgb(var(--fg-muted))' }}>
                    {index + 1}
                  </td>
                  <td style={{ ...standingsTdStyle, textAlign: 'left', fontWeight: 700, minWidth: '10rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                      <ReactCountryFlag countryCode={countryIsoCode(row.name)} svg style={{ width: '1.5em', height: '1.5em', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{countryDisplayName(row.name, t)}</span>
                    </span>
                  </td>
                  {showGroup ? (
                    <td style={{ ...standingsTdStyle, textAlign: 'center', fontWeight: 800 }}>{row.group}</td>
                  ) : null}
                  <td style={standingsPointsStyle}>{row.points}</td>
                  <td style={standingsNumberStyle}>{row.played}</td>
                  <td style={standingsNumberStyle}>{row.goalsFor}</td>
                  <td style={standingsNumberStyle}>{row.goalsAgainst}</td>
                  <td style={standingsNumberStyle}>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                  {showStatus ? (
                    <td style={{ ...standingsTdStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.14rem 0.45rem',
                          borderRadius: '999px',
                          border: `1px solid ${qualified ? 'rgb(var(--pitch) / 0.45)' : 'rgb(var(--border))'}`,
                          background: qualified ? 'rgb(var(--pitch) / 0.10)' : 'rgb(var(--bg-subtle))',
                          color: qualified ? 'rgb(var(--pitch))' : 'rgb(var(--fg-muted))',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {qualified ? t('poolDetail.groupPhase.standings.qualified') : t('poolDetail.groupPhase.standings.eliminated')}
                      </span>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const standingsThStyle: CSSProperties = {
  padding: '0.5rem 0.65rem',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'rgb(var(--fg-muted))',
  whiteSpace: 'nowrap',
};

const standingsTdStyle: CSSProperties = {
  padding: '0.5rem 0.65rem',
  fontSize: '0.76rem',
  color: 'rgb(var(--fg))',
  verticalAlign: 'middle',
};

const standingsNumberStyle: CSSProperties = {
  ...standingsTdStyle,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  color: 'rgb(var(--fg-muted))',
};

const standingsPointsStyle: CSSProperties = {
  ...standingsNumberStyle,
  fontWeight: 900,
  color: 'rgb(var(--fg))',
};
