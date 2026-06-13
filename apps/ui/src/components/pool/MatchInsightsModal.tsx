'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { useI18n } from '@/i18n/client';
import { apiClient } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { PointsBadge } from '@/components/PointsBadge';
import { PlayerActionSummary } from '@/components/pool/PlayerActionSummary';
import { resolvePlayerInfoScoring } from '@/components/pool/PoolInfoSections';
import { ReadOnlyGroupMatchCard } from '@/components/pool/ReadOnlyGroupMatchCard';
import { countryIsoCode } from '@/lib/country-flags';
import { PlayerPosition } from '@/types/playerPosition.type';

export type MatchInsightsTarget = {
  matchId: string;
  matchType: 'group' | 'final';
};

type PlayerAction = {
  playerId: string;
  name: string;
  teamName: string;
  position: PlayerPosition;
  points: number;
  goals?: number;
  penaltyGoals?: number;
  missedPenalties?: number;
  mvps?: number;
  penaltiesSaved?: number;
  shootoutPenaltiesSaved?: number;
  shootoutGoals?: number;
  shootoutMissedPenalties?: number;
  cleanSheets?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
};

type InsightMember = {
  userId: string;
  userName: string;
  prediction: any | null;
  playerActions: PlayerAction[];
};

type MatchInsightsData = {
  matchType: 'group' | 'final';
  match: any;
  requesterUserId: string;
  members: InsightMember[];
};

type TranslationFn = (key: string, values?: Record<string, string | number>) => string;

export function MatchInsightsModal({
  poolId,
  target,
  onClose,
  playerScoring,
}: Readonly<{
  poolId: string;
  target: MatchInsightsTarget | null;
  onClose: () => void;
  playerScoring: ReturnType<typeof resolvePlayerInfoScoring>;
}>) {
  const { t, locale } = useI18n();
  const [data, setData] = useState<MatchInsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) {
      setData(null);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    apiClient
      .get(`/pools/${poolId}/matches/insights/${target.matchType}/${target.matchId}`)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || t('poolDetail.matchInsights.loadError'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [poolId, target, t]);

  const orderedMembers = useMemo(() => {
    if (!data) return [];
    return [...data.members].sort((a, b) => {
      if (a.userId === data.requesterUserId) return -1;
      if (b.userId === data.requesterUserId) return 1;
      return a.userName.localeCompare(b.userName);
    });
  }, [data]);
  const actionLabels = {
    goals: t('poolDetail.players.actions.goals'),
    penaltyGoals: t('poolDetail.players.actions.penaltyGoals'),
    missedPenalties: t('poolDetail.players.actions.missedPenalties'),
    mvps: t('poolDetail.players.actions.mvps'),
    penaltiesSaved: t('poolDetail.players.actions.penaltiesSaved'),
    shootoutPenaltiesSaved: t('poolDetail.players.actions.shootoutPenaltiesSaved'),
    shootoutGoals: t('poolDetail.players.actions.shootoutGoals'),
    shootoutMissedPenalties: t('poolDetail.players.actions.shootoutMissedPenalties'),
    cleanSheets: t('poolDetail.players.actions.cleanSheets'),
    assists: t('poolDetail.players.actions.assists'),
    yellowCards: t('poolDetail.players.actions.yellowCards'),
    redCards: t('poolDetail.players.actions.redCards'),
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title={t('poolDetail.matchInsights.title')}
      size="lg"
    >
      {loading ? (
        <p style={messageStyle}>{t('common.loading')}</p>
      ) : error ? (
        <p role="alert" style={{ ...messageStyle, color: 'rgb(var(--live))' }}>{error}</p>
      ) : data ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <MatchSummary data={data} />
          <MatchStatistics data={data} />

          <section style={{ display: 'grid', gap: '0.45rem' }}>
            <h3 style={sectionTitleStyle}>{t('poolDetail.matchInsights.participants')}</h3>
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {orderedMembers.map((member) => (
                <div key={member.userId} style={memberPanelStyle}>
                  <p style={memberTitleStyle}>
                    {member.userName}
                    {member.userId === data.requesterUserId
                      ? ` · ${t('poolDetail.matchInsights.you')}`
                      : ''}
                  </p>

                  <PredictionRow
                    member={member}
                    matchType={data.matchType}
                    match={data.match}
                    locale={locale}
                  />

                  <div style={memberActionsStyle}>
                    <p style={subsectionTitleStyle}>
                      {t('poolDetail.matchInsights.playerActions')}
                    </p>
                    {member.playerActions.length > 0 ? (
                      <div style={{ display: 'grid', gap: '0.35rem' }}>
                        {member.playerActions.map((player) => (
                          <div key={player.playerId} style={playerRowStyle}>
                            {player.points !== 0 ? (
                              <PointsBadge
                                points={player.points}
                                label={t('poolDetail.players.points', { points: player.points })}
                              />
                            ) : null}
                            <ReactCountryFlag
                              countryCode={countryIsoCode(player.teamName)}
                              svg
                              style={{ width: '1.45em', height: '1.45em', flexShrink: 0 }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 750, color: 'rgb(var(--fg))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {player.name}
                                </span>
                                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'rgb(var(--fg-muted))', whiteSpace: 'nowrap' }}>
                                  {player.teamName}
                                </span>
                              </div>
                              <PlayerActionSummary
                                player={player}
                                labels={actionLabels}
                                position={player.position}
                                scoring={playerScoring}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

function MatchStatistics({ data }: Readonly<{ data: MatchInsightsData }>) {
  const { t } = useI18n();
  const predictions = data.members
    .map((member) => member.prediction)
    .filter(Boolean);

  if (data.matchType === 'group') {
    const validPredictions = predictions.filter(
      (prediction) =>
        typeof prediction.homeScore === 'number' &&
        typeof prediction.awayScore === 'number',
    );
    const hasResult =
      typeof data.match.homeResult === 'number' &&
      typeof data.match.awayResult === 'number';
    if (validPredictions.length === 0 || !hasResult) return null;

    const actualOutcome = outcome(data.match.homeResult, data.match.awayResult);
    const exact = validPredictions.filter(
      (prediction) =>
        prediction.homeScore === data.match.homeResult &&
        prediction.awayScore === data.match.awayResult,
    ).length;
    const correctOutcome = validPredictions.filter(
      (prediction) =>
        !(
          prediction.homeScore === data.match.homeResult &&
          prediction.awayScore === data.match.awayResult
        ) &&
        outcome(prediction.homeScore, prediction.awayScore) === actualOutcome,
    ).length;
    const failed = validPredictions.length - exact - correctOutcome;

    return (
      <section style={{ display: 'grid', gap: '0.5rem' }}>
        <h3 style={sectionTitleStyle}>{t('poolDetail.matchInsights.statistics')}</h3>
        <div style={statisticsGridStyle}>
          <PercentageMetric
            label={t('poolDetail.matchInsights.exactResult')}
            value={percentage(exact, validPredictions.length)}
            tone="success"
          />
          <PercentageMetric
            label={t('poolDetail.matchInsights.correctOutcome')}
            value={percentage(correctOutcome, validPredictions.length)}
            tone="info"
          />
          <PercentageMetric
            label={t('poolDetail.matchInsights.failed')}
            value={percentage(failed, validPredictions.length)}
            tone="danger"
          />
        </div>
      </section>
    );
  }

  const actualTeams = [
    { teamId: data.match.homeTeamId, teamName: data.match.homeTeamName, side: 'home' },
    { teamId: data.match.awayTeamId, teamName: data.match.awayTeamName, side: 'away' },
  ].filter((team) => team.teamId && team.teamName);
  const evaluated = predictions.some((prediction) => prediction.isEvaluated);
  if (!evaluated || actualTeams.length === 0) return null;

  return (
    <section style={{ display: 'grid', gap: '0.5rem' }}>
      <h3 style={sectionTitleStyle}>{t('poolDetail.matchInsights.statistics')}</h3>
      <div style={{ display: 'grid', gap: '0.55rem' }}>
        {actualTeams.map((team) => {
          const categories = data.members.map((member) => {
            const prediction = member.prediction;
            const correct =
              team.side === 'home'
              ? prediction?.homeTeamId === team.teamId
              : prediction?.awayTeamId === team.teamId;
            if (correct) return 'correct';
            const wrong =
              team.side === 'home'
              ? prediction?.awayTeamId === team.teamId
              : prediction?.homeTeamId === team.teamId;
            return wrong ? 'wrong' : 'missed';
          });
          const correctSide = categories.filter((category) => category === 'correct').length;
          const wrongSide = categories.filter((category) => category === 'wrong').length;
          const missed = data.members.length - correctSide - wrongSide;

          return (
            <div
              key={team.teamId}
              style={{
                display: 'grid',
                gap: '0.45rem',
                padding: '0.6rem',
                border: '1px solid rgb(var(--border-subtle))',
                borderRadius: 'var(--radius-sm)',
                background: 'rgb(var(--bg-elevated))',
              }}
            >
              <strong
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'rgb(var(--fg))',
                  fontSize: '0.78rem',
                }}
              >
                <ReactCountryFlag
                  countryCode={countryIsoCode(team.teamName)}
                  svg
                  style={{ width: '1.4em', height: '1.4em' }}
                />
                {team.teamName}
              </strong>
              <div style={statisticsGridStyle}>
                <PercentageMetric
                  label={t('poolDetail.matchInsights.correctSide')}
                  value={percentage(correctSide, data.members.length)}
                  tone="success"
                />
                <PercentageMetric
                  label={t('poolDetail.matchInsights.incorrectSide')}
                  value={percentage(wrongSide, data.members.length)}
                  tone="info"
                />
                <PercentageMetric
                  label={t('poolDetail.matchInsights.notGuessed')}
                  value={percentage(missed, data.members.length)}
                  tone="danger"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PercentageMetric({
  label,
  value,
  tone,
}: Readonly<{
  label: string;
  value: number;
  tone: 'neutral' | 'success' | 'info' | 'danger';
}>) {
  const token = {
    neutral: 'var(--fg)',
    success: 'var(--pitch)',
    info: 'var(--info)',
    danger: 'var(--live)',
  }[tone];

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'grid',
        gap: '0.2rem',
        minWidth: 0,
        padding: '0.5rem',
        border: `1px solid rgb(${token} / 0.28)`,
        borderRadius: 'var(--radius-sm)',
        background: 'rgb(var(--bg-elevated))',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: `${value}%`,
          background: `rgb(${token} / 0.07)`,
        }}
      />
      <strong
        style={{
          position: 'relative',
          color: `rgb(${token})`,
          fontSize: '0.88rem',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatPercentage(value)}
      </strong>
      <span
        style={{
          position: 'relative',
          color: 'rgb(var(--fg-muted))',
          fontSize: '0.67rem',
          lineHeight: 1.25,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function outcome(home: number, away: number) {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

function percentage(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
}

function formatPercentage(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function MatchSummary({ data }: Readonly<{ data: MatchInsightsData }>) {
  const { t } = useI18n();
  const match = data.match;
  const homeName = match.homeTeamName || match.homeSourceLabel || t('poolDetail.matchInsights.pendingTeam');
  const awayName = match.awayTeamName || match.awaySourceLabel || t('poolDetail.matchInsights.pendingTeam');
  const hasResult = typeof match.homeResult === 'number' && typeof match.awayResult === 'number';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', gap: '0.65rem', alignItems: 'center', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgb(var(--panel-muted-bg-solid))', border: '1px solid rgb(var(--border))' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, fontWeight: 750, color: 'rgb(var(--fg))' }}>
        <ReactCountryFlag
          countryCode={countryIsoCode(homeName)}
          svg
          style={{ width: '1.65em', height: '1.65em', flexShrink: 0 }}
        />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {homeName}
        </span>
      </span>
      <span style={{ fontFamily: 'var(--font-display, inherit)', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: 'rgb(var(--fg))' }}>
        {hasResult ? `${match.homeResult} - ${match.awayResult}` : '—'}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem', minWidth: 0, fontWeight: 750, color: 'rgb(var(--fg))', textAlign: 'right' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {awayName}
        </span>
        <ReactCountryFlag
          countryCode={countryIsoCode(awayName)}
          svg
          style={{ width: '1.65em', height: '1.65em', flexShrink: 0 }}
        />
      </span>
    </div>
  );
}

function PredictionRow({
  member,
  matchType,
  match,
  locale,
}: Readonly<{
  member: InsightMember;
  matchType: 'group' | 'final';
  match: any;
  locale: string;
}>) {
  const { t } = useI18n();
  const prediction = member.prediction;
  const points = prediction?.points || 0;

  if (matchType === 'group') {
    return (
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <p style={subsectionTitleStyle}>{t('poolDetail.matchInsights.prediction')}</p>
        <ReadOnlyGroupMatchCard
          match={match}
          prediction={prediction}
          locale={locale}
          compact
        />
      </div>
    );
  }

  const tone = finalPredictionTone(prediction);

  return (
    <div
      style={{
        ...predictionRowStyle,
        border: `1px solid ${tone.border}`,
        background: tone.background,
      }}
    >
      {points > 0 ? (
        <PointsBadge points={points} label={t('poolDetail.match.points', { points })} />
      ) : null}
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 750, color: 'rgb(var(--fg))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t('poolDetail.matchInsights.prediction')}
        </p>
        <p style={{ margin: '0.15rem 0 0', fontSize: '0.67rem', color: 'rgb(var(--fg-muted))' }}>
          {prediction
            ? finalPredictionStatus(prediction, t)
            : t('poolDetail.matchInsights.noPrediction')}
        </p>
      </div>
      {prediction ? (
        <div style={finalTeamsStyle}>
          <FinalTeam
            teamName={prediction.homeTeamName}
            exact={prediction.homeTeamExactPosition}
            wrongSide={prediction.homeTeamCorrectButWrongPosition}
            evaluated={prediction.isEvaluated}
          />
          <span aria-hidden style={{ color: 'rgb(var(--fg-subtle))' }}>–</span>
          <FinalTeam
            teamName={prediction.awayTeamName}
            exact={prediction.awayTeamExactPosition}
            wrongSide={prediction.awayTeamCorrectButWrongPosition}
            evaluated={prediction.isEvaluated}
          />
        </div>
      ) : (
        <span style={{ marginLeft: 'auto', color: 'rgb(var(--fg-muted))' }}>—</span>
      )}
    </div>
  );
}

function FinalTeam({
  teamName,
  exact,
  wrongSide,
  evaluated,
}: Readonly<{
  teamName?: string;
  exact?: boolean | null;
  wrongSide?: boolean | null;
  evaluated?: boolean;
}>) {
  const tone = finalTeamTone(exact, wrongSide, evaluated);

  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.35rem',
        minWidth: 0,
        padding: '0.32rem 0.42rem',
        overflow: 'hidden',
        borderRadius: 'var(--radius-sm)',
        border: `${tone.highlighted ? 2 : 1}px solid ${tone.border}`,
        background: tone.background,
        color: 'rgb(var(--fg))',
        fontSize: '0.76rem',
        fontWeight: 750,
        textAlign: 'center',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {teamName ? (
        <>
          <ReactCountryFlag
            countryCode={countryIsoCode(teamName)}
            svg
            style={{ width: '1.35em', height: '1.35em', flexShrink: 0 }}
          />
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {teamName}
          </span>
        </>
      ) : '—'}
    </span>
  );
}

function finalTeamTone(
  exact?: boolean | null,
  wrongSide?: boolean | null,
  evaluated?: boolean,
) {
  if (exact === true) {
    return {
      highlighted: true,
      border: 'rgb(var(--pitch) / 0.65)',
      background: 'rgb(var(--pitch) / 0.08)',
    };
  }
  if (wrongSide === true) {
    return {
      highlighted: true,
      border: 'rgb(var(--info) / 0.65)',
      background: 'rgb(var(--info) / 0.08)',
    };
  }
  if (evaluated) {
    return {
      highlighted: true,
      border: 'rgb(var(--live) / 0.55)',
      background: 'rgb(var(--live) / 0.07)',
    };
  }
  return {
    highlighted: false,
    border: 'rgb(var(--border-subtle))',
    background: 'rgb(var(--bg-subtle) / 0.5)',
  };
}

function finalPredictionTone(prediction: any) {
  if (!prediction?.isEvaluated) {
    return {
      highlighted: false,
      border: 'rgb(var(--border-subtle))',
      background: 'rgb(var(--bg-subtle) / 0.5)',
    };
  }
  const hasExact =
    prediction.homeTeamExactPosition === true ||
    prediction.awayTeamExactPosition === true;
  if (hasExact) {
    return {
      highlighted: true,
      border: 'rgb(var(--pitch) / 0.55)',
      background: 'rgb(var(--pitch) / 0.05)',
    };
  }
  const hasWrongSide =
    prediction.homeTeamCorrectButWrongPosition === true ||
    prediction.awayTeamCorrectButWrongPosition === true;
  if (hasWrongSide) {
    return {
      highlighted: true,
      border: 'rgb(var(--info) / 0.55)',
      background: 'rgb(var(--info) / 0.05)',
    };
  }
  return {
    highlighted: true,
    border: 'rgb(var(--live) / 0.45)',
    background: 'rgb(var(--live) / 0.05)',
  };
}

function finalPredictionStatus(prediction: any, t: TranslationFn) {
  if (!prediction.isEvaluated) return t('poolDetail.matchInsights.pendingEvaluation');
  const exact = Number(prediction.homeTeamExactPosition === true) + Number(prediction.awayTeamExactPosition === true);
  const wrongSide =
    Number(prediction.homeTeamCorrectButWrongPosition === true) +
    Number(prediction.awayTeamCorrectButWrongPosition === true);
  const parts = [];
  if (exact > 0) parts.push(t('poolDetail.matchInsights.exactPositions', { count: exact }));
  if (wrongSide > 0) parts.push(t('poolDetail.matchInsights.wrongSide', { count: wrongSide }));
  if (prediction.tournamentWinnerCorrect === true) parts.push(t('poolDetail.matchInsights.winnerCorrect'));
  return parts.length > 0 ? parts.join(' · ') : t('poolDetail.match.incorrectBadge');
}

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.68rem',
  fontWeight: 850,
  textTransform: 'uppercase',
  color: 'rgb(var(--fg-subtle))',
};

const statisticsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 7.5rem), 1fr))',
  gap: '0.45rem',
};

const messageStyle: CSSProperties = {
  margin: 0,
  padding: '1rem',
  textAlign: 'center',
  color: 'rgb(var(--fg-muted))',
  fontSize: '0.85rem',
};

const predictionRowStyle: CSSProperties = {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))',
  alignItems: 'center',
  gap: '0.65rem',
  padding: '0.6rem 0.7rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgb(var(--border-subtle))',
  background: 'rgb(var(--bg-subtle) / 0.5)',
};

const finalTeamsStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
  alignItems: 'center',
  gap: '0.3rem',
};

const memberPanelStyle: CSSProperties = {
  padding: '0.65rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgb(var(--border))',
  background: 'rgb(var(--bg-elevated))',
};

const memberTitleStyle: CSSProperties = {
  margin: '0 0 0.55rem',
  fontSize: '0.82rem',
  fontWeight: 850,
  color: 'rgb(var(--fg))',
};

const memberActionsStyle: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
  marginTop: '0.55rem',
  paddingTop: '0.55rem',
  borderTop: '1px solid rgb(var(--border-subtle))',
};

const subsectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.65rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  color: 'rgb(var(--fg-subtle))',
};

const playerRowStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.5rem',
  padding: '0.5rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgb(var(--border-subtle))',
  background: 'rgb(var(--bg-subtle) / 0.5)',
};
