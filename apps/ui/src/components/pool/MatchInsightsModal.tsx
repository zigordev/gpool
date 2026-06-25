'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { useI18n } from '@/i18n/client';
import { apiClient } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { PointsBadge } from '@/components/PointsBadge';
import { PlayerActionSummary } from '@/components/pool/PlayerActionSummary';
import { resolvePlayerInfoScoring } from '@/components/pool/PoolInfoSections';
import { countryIsoCode } from '@/lib/country-flags';
import { PlayerPosition } from '@/types/playerPosition.type';
import { PlayerShirt } from '@/components/pool/PlayerShirt';
import { PlayerEliminatedBadge } from '@/components/pool/PlayerEliminatedBadge';

export type MatchInsightsTarget = {
  matchId: string;
  matchType: 'group' | 'final';
};

type PlayerAction = {
  playerId: string;
  name: string;
  teamName: string;
  teamEliminated?: boolean;
  position: PlayerPosition;
  shirtNumber?: number | null;
  points: number;
  goals?: number;
  penaltyGoals?: number;
  missedPenalties?: number;
  mvps?: number;
  penaltiesSaved?: number;
  forcedPenaltyMisses?: number;
  shootoutPenaltiesSaved?: number;
  shootoutGoals?: number;
  shootoutMissedPenalties?: number;
  shootoutForcedPenaltyMisses?: number;
  cleanSheets?: number;
  assists?: number;
  yellowCards?: number;
  doubleYellowCards?: number;
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
  const { t } = useI18n();
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
    forcedPenaltyMisses: t('poolDetail.players.actions.forcedPenaltyMisses'),
    shootoutPenaltiesSaved: t('poolDetail.players.actions.shootoutPenaltiesSaved'),
    shootoutGoals: t('poolDetail.players.actions.shootoutGoals'),
    shootoutMissedPenalties: t('poolDetail.players.actions.shootoutMissedPenalties'),
    shootoutForcedPenaltyMisses: t('poolDetail.players.actions.shootoutForcedPenaltyMisses'),
    cleanSheets: t('poolDetail.players.actions.cleanSheets'),
    assists: t('poolDetail.players.actions.assists'),
    yellowCards: t('poolDetail.players.actions.yellowCards'),
    doubleYellowCards: t('poolDetail.players.actions.doubleYellowCards'),
    redCards: t('poolDetail.players.actions.redCards'),
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title={data ? <MatchSummary data={data} compact /> : t('poolDetail.matchInsights.title')}
      size="lg"
    >
      {loading ? (
        <p style={messageStyle}>{t('common.loading')}</p>
      ) : error ? (
        <p role="alert" style={{ ...messageStyle, color: 'rgb(var(--live))' }}>
          {error}
        </p>
      ) : data ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <MatchStatistics data={data} />

          <section style={{ display: 'grid', gap: '0.45rem' }}>
            <h3 style={sectionTitleStyle}>{t('poolDetail.matchInsights.participants')}</h3>
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {orderedMembers.map((member) => (
                <div key={member.userId} style={memberPanelStyle}>
                  <div style={memberHeaderStyle}>
                    <p style={memberTitleStyle}>
                      {member.userName}
                      {member.userId === data.requesterUserId
                        ? ` · ${t('poolDetail.matchInsights.you')}`
                        : ''}
                    </p>
                    <PredictionRow member={member} matchType={data.matchType} />
                  </div>

                  {member.playerActions.length > 0 ? (
                    <div style={memberActionsStyle}>
                      <div style={{ display: 'grid', gap: '0.35rem' }}>
                        {member.playerActions.map((player) => (
                          <div key={player.playerId} style={playerRowStyle}>
                            {player.points === 0 ? null : (
                              <PointsBadge
                                points={player.points}
                                label={t('poolDetail.players.points', { points: player.points })}
                              />
                            )}
                            <PlayerShirt
                              teamName={player.teamName}
                              shirtNumber={player.shirtNumber}
                              size={27}
                            />
                            <ReactCountryFlag
                              countryCode={countryIsoCode(player.teamName)}
                              svg
                              style={{ width: '1.35em', height: '1.35em', flexShrink: 0 }}
                            />
                            <div style={{ minWidth: 0, flex: '1 1 9rem' }}>
                              <div
                                style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 750,
                                    color: 'rgb(var(--fg))',
                                    opacity: player.teamEliminated ? 0.68 : 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {player.name}
                                </span>
                                {player.teamEliminated ? <PlayerEliminatedBadge /> : null}
                                <span
                                  style={{
                                    marginLeft: 'auto',
                                    fontSize: '0.68rem',
                                    color: 'rgb(var(--fg-muted))',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {player.teamName}
                                </span>
                              </div>
                            </div>
                            <PlayerActionSummary
                              player={player}
                              labels={actionLabels}
                              position={player.position}
                              scoring={playerScoring}
                              compact
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
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
  const predictions = data.members.map((member) => member.prediction).filter(Boolean);

  if (data.matchType === 'group') {
    const validPredictions = predictions.filter(
      (prediction) =>
        typeof prediction.homeScore === 'number' && typeof prediction.awayScore === 'number'
    );
    const hasResult =
      typeof data.match.homeResult === 'number' && typeof data.match.awayResult === 'number';
    if (validPredictions.length === 0 || !hasResult) return null;

    const actualOutcome = outcome(data.match.homeResult, data.match.awayResult);
    const exact = validPredictions.filter(
      (prediction) =>
        prediction.homeScore === data.match.homeResult &&
        prediction.awayScore === data.match.awayResult
    ).length;
    const correctOutcome = validPredictions.filter(
      (prediction) =>
        !(
          prediction.homeScore === data.match.homeResult &&
          prediction.awayScore === data.match.awayResult
        ) && outcome(prediction.homeScore, prediction.awayScore) === actualOutcome
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
            label={t('poolDetail.matchInsights.oneXTwo')}
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
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: '0.45rem',
        minWidth: 0,
        minHeight: '2rem',
        padding: '0.32rem 0.45rem',
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
          background: `rgb(${token} / 0.09)`,
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          position: 'relative',
          minWidth: 0,
          overflow: 'hidden',
          color: 'rgb(var(--fg))',
          fontSize: '0.68rem',
          fontWeight: 750,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <strong
        style={{
          position: 'relative',
          color: 'rgb(var(--fg))',
          fontSize: '0.7rem',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {formatPercentage(value)}
      </strong>
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

function MatchSummary({
  data,
  compact = false,
}: Readonly<{
  data: MatchInsightsData;
  compact?: boolean;
}>) {
  const { t } = useI18n();
  const match = data.match;
  const homeName =
    match.homeTeamName || match.homeSourceLabel || t('poolDetail.matchInsights.pendingTeam');
  const awayName =
    match.awayTeamName || match.awaySourceLabel || t('poolDetail.matchInsights.pendingTeam');
  const homeIsoCode = match.homeTeamId ? countryIsoCode(match.homeTeamName) : '';
  const awayIsoCode = match.awayTeamId ? countryIsoCode(match.awayTeamName) : '';
  const hasResult = typeof match.homeResult === 'number' && typeof match.awayResult === 'number';

  return (
    <span
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
        gap: compact ? '0.35rem' : '0.65rem',
        alignItems: 'center',
        width: '100%',
        minWidth: 0,
        padding: compact ? 0 : '0.7rem',
        borderRadius: 'var(--radius-sm)',
        background: compact ? undefined : 'rgb(var(--panel-muted-bg-solid))',
        border: compact ? undefined : '1px solid rgb(var(--border))',
      }}
    >
      <span
        style={{
          display: 'flex',
          flexDirection: compact ? 'column' : 'row',
          alignItems: compact ? 'flex-start' : 'center',
          gap: compact ? '0.15rem' : '0.45rem',
          minWidth: 0,
          fontWeight: 750,
          color: 'rgb(var(--fg))',
        }}
      >
        {homeIsoCode ? (
          <ReactCountryFlag
            countryCode={homeIsoCode}
            svg
            style={{
              width: compact ? '1.3em' : '1.65em',
              height: compact ? '1.3em' : '1.65em',
              flexShrink: 0,
            }}
          />
        ) : null}
        <span
          style={{
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: compact ? '0.78rem' : undefined,
          }}
        >
          {homeName}
        </span>
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display, inherit)',
          fontSize: compact ? '1rem' : undefined,
          fontWeight: 900,
          fontVariantNumeric: 'tabular-nums',
          color: 'rgb(var(--fg))',
          whiteSpace: 'nowrap',
        }}
      >
        {hasResult ? `${match.homeResult} - ${match.awayResult}` : '—'}
      </span>
      <span
        style={{
          display: 'flex',
          flexDirection: compact ? 'column-reverse' : 'row',
          alignItems: compact ? 'flex-end' : 'center',
          justifyContent: 'flex-end',
          gap: compact ? '0.15rem' : '0.45rem',
          minWidth: 0,
          fontWeight: 750,
          color: 'rgb(var(--fg))',
          textAlign: 'right',
        }}
      >
        <span
          style={{
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: compact ? '0.78rem' : undefined,
          }}
        >
          {awayName}
        </span>
        {awayIsoCode ? (
          <ReactCountryFlag
            countryCode={awayIsoCode}
            svg
            style={{
              width: compact ? '1.3em' : '1.65em',
              height: compact ? '1.3em' : '1.65em',
              flexShrink: 0,
            }}
          />
        ) : null}
      </span>
    </span>
  );
}

function PredictionRow({
  member,
  matchType,
}: Readonly<{
  member: InsightMember;
  matchType: 'group' | 'final';
}>) {
  const { t } = useI18n();
  const prediction = member.prediction;
  const points = prediction?.points || 0;

  if (matchType === 'group') {
    const tone = groupPredictionTone(prediction);
    const hasScore =
      typeof prediction?.homeScore === 'number' && typeof prediction?.awayScore === 'number';
    return (
      <div style={compactPredictionCardStyle(tone.border, tone.background, tone.highlighted)}>
        {points === 0 ? null : (
          <PointsBadge points={points} label={t('poolDetail.match.points', { points })} />
        )}
        <strong
          style={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
        >
          {hasScore ? `${prediction.homeScore} - ${prediction.awayScore}` : '—'}
        </strong>
        <span style={compactPredictionStatusStyle}>{groupPredictionStatus(prediction, t)}</span>
      </div>
    );
  }

  return (
    <div
      style={compactPredictionCardStyle(
        'rgb(var(--border-subtle))',
        'rgb(var(--bg-subtle) / 0.5)',
        false
      )}
    >
      {points === 0 ? null : (
        <PointsBadge points={points} label={t('poolDetail.match.points', { points })} compact />
      )}
      {prediction ? (
        <div style={finalTeamsStyle}>
          <FinalTeam
            teamName={prediction.homeTeamName}
            exact={prediction.homeTeamExactPosition}
            wrongSide={prediction.homeTeamCorrectButWrongPosition}
            evaluated={prediction.isEvaluated}
          />
          <span aria-hidden style={{ color: 'rgb(var(--fg-subtle))' }}>
            –
          </span>
          <FinalTeam
            teamName={prediction.awayTeamName}
            exact={prediction.awayTeamExactPosition}
            wrongSide={prediction.awayTeamCorrectButWrongPosition}
            evaluated={prediction.isEvaluated}
          />
        </div>
      ) : (
        <span style={{ color: 'rgb(var(--fg-muted))' }}>—</span>
      )}
    </div>
  );
}

function groupPredictionTone(prediction: any) {
  if (prediction?.isExactMatch === true) {
    return {
      border: 'rgb(var(--pitch) / 0.55)',
      background: 'rgb(var(--pitch) / 0.05)',
      highlighted: true,
    };
  }
  if (prediction?.isCorrect === true) {
    return {
      border: 'rgb(var(--info) / 0.55)',
      background: 'rgb(var(--info) / 0.05)',
      highlighted: true,
    };
  }
  if (prediction?.isCorrect === false) {
    return {
      border: 'rgb(var(--live) / 0.45)',
      background: 'rgb(var(--live) / 0.05)',
      highlighted: true,
    };
  }
  return {
    border: 'rgb(var(--border-subtle))',
    background: 'rgb(var(--bg-subtle) / 0.5)',
    highlighted: false,
  };
}

function groupPredictionStatus(prediction: any, t: (key: string) => string) {
  if (prediction?.isExactMatch === true) return t('poolDetail.match.exactBadge');
  if (prediction?.isCorrect === true) return t('poolDetail.match.correctWinnerBadge');
  if (prediction?.isCorrect === false) return t('poolDetail.match.incorrectBadge');
  return t('poolDetail.matchInsights.noResult');
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
        padding: '0.2rem 0.3rem',
        overflow: 'hidden',
        borderRadius: 'var(--radius-sm)',
        border: `${tone.highlighted ? 2 : 1}px solid ${tone.border}`,
        background: tone.background,
        color: 'rgb(var(--fg))',
        fontSize: '0.68rem',
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
      ) : (
        '—'
      )}
    </span>
  );
}

function finalTeamTone(exact?: boolean | null, wrongSide?: boolean | null, evaluated?: boolean) {
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

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.68rem',
  fontWeight: 850,
  textTransform: 'uppercase',
  color: 'rgb(var(--fg-subtle))',
};

const statisticsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '0.3rem',
};

const messageStyle: CSSProperties = {
  margin: 0,
  padding: '1rem',
  textAlign: 'center',
  color: 'rgb(var(--fg-muted))',
  fontSize: '0.85rem',
};

function compactPredictionCardStyle(
  border: string,
  background: string,
  highlighted: boolean
): CSSProperties {
  return {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: '0.3rem',
    minWidth: 0,
    maxWidth: '100%',
    padding: '0.24rem 0.38rem',
    borderRadius: 'var(--radius-sm)',
    border: `${highlighted ? 2 : 1}px solid ${border}`,
    background: `linear-gradient(var(--card-sheen), var(--card-sheen)), ${background}`,
    boxShadow: 'inset 0 1px 0 var(--card-inset-highlight), 0 2px 7px rgb(0 0 0 / 0.08)',
  };
}

const compactPredictionStatusStyle: CSSProperties = {
  maxWidth: '6rem',
  color: 'rgb(var(--fg-muted))',
  fontSize: '0.58rem',
  fontWeight: 700,
  lineHeight: 1.15,
  overflowWrap: 'anywhere',
  whiteSpace: 'normal',
};

const finalTeamsStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
  alignItems: 'center',
  gap: '0.2rem',
};

const memberPanelStyle: CSSProperties = {
  padding: '0.5rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgb(var(--border))',
  background: 'rgb(var(--bg-elevated))',
};

const memberHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.55rem',
  flexWrap: 'wrap',
  minWidth: 0,
};

const memberTitleStyle: CSSProperties = {
  margin: 0,
  minWidth: 0,
  fontSize: '0.78rem',
  fontWeight: 850,
  color: 'rgb(var(--fg))',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const memberActionsStyle: CSSProperties = {
  display: 'grid',
  gap: '0.3rem',
  marginTop: '0.4rem',
  paddingTop: '0.4rem',
  borderTop: '1px solid rgb(var(--border-subtle))',
};

const playerRowStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  flexWrap: 'wrap',
  padding: '0.38rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgb(var(--border-subtle))',
  background: 'rgb(var(--bg-subtle) / 0.5)',
};
