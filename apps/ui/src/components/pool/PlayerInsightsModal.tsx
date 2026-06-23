'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { useI18n } from '@/i18n/client';
import { apiClient } from '@/lib/api';
import { countryIsoCode } from '@/lib/country-flags';
import { PlayerPosition } from '@/types/playerPosition.type';
import { Modal } from '@/components/ui/Modal';
import { PlayerActionSummary } from '@/components/pool/PlayerActionSummary';
import { resolvePlayerInfoScoring } from '@/components/pool/PoolInfoSections';
import { PlayerShirt } from '@/components/pool/PlayerShirt';
import Image from 'next/image';

export type PlayerInsightsTarget = {
  playerId: string;
  selectionType: 'position' | 'award';
  award?: 'golden_boot' | 'tournament_mvp';
};

type PlayerInsightMatch = {
  matchType: 'group' | 'final';
  matchId: string;
  matchNumber?: number;
  phase?: string;
  homeTeamName: string;
  awayTeamName: string;
  homeResult?: number;
  awayResult?: number;
  scheduledAt?: string;
  goals?: number;
  penaltyGoals?: number;
  missedPenalties?: number;
  mvps?: number;
  penaltiesSaved?: number;
  forcedPenaltyMisses?: number;
  shootoutPenaltiesSaved?: number;
  shootoutGoals?: number;
  shootoutMissedPenalties?: number;
  cleanSheets?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
};

type PlayerInsightsData = {
  requesterUserId: string;
  player: {
    playerId: string;
    name: string;
    teamName: string;
    position: PlayerPosition;
    imageUrl?: string;
    shirtNumber?: number | null;
  };
  memberCount: number;
  selectionCount: number;
  percentage: number;
  selectedBy: Array<{ userId: string; userName: string }>;
  matches: PlayerInsightMatch[];
};

export function PlayerInsightsModal({
  poolId,
  target,
  onClose,
  playerScoring,
}: Readonly<{
  poolId: string;
  target: PlayerInsightsTarget | null;
  onClose: () => void;
  playerScoring: ReturnType<typeof resolvePlayerInfoScoring>;
}>) {
  const { t, locale } = useI18n();
  const [data, setData] = useState<PlayerInsightsData | null>(null);
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
    const params = new URLSearchParams({ selectionType: target.selectionType });
    if (target.award) params.set('award', target.award);
    apiClient
      .get(`/pools/${poolId}/players/${target.playerId}/insights?${params.toString()}`)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message || t('poolDetail.players.insights.loadError')
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [poolId, target, t]);

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
    cleanSheets: t('poolDetail.players.actions.cleanSheets'),
    assists: t('poolDetail.players.actions.assists'),
    yellowCards: t('poolDetail.players.actions.yellowCards'),
    redCards: t('poolDetail.players.actions.redCards'),
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title={data ? <PlayerSummary data={data} /> : t('poolDetail.players.insights.title')}
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
          <section style={{ display: 'grid', gap: '0.45rem' }}>
            <h3 style={sectionTitleStyle}>{t('poolDetail.players.insights.selection')}</h3>
            <div style={percentageCardStyle}>
              <span style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.74rem', fontWeight: 750 }}>
                {t('poolDetail.players.insights.selectedByCount', {
                  selected: data.selectionCount,
                  total: data.memberCount,
                })}
              </span>
              <strong
                style={{
                  color: 'rgb(var(--pitch))',
                  fontSize: '1rem',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatPercentage(data.percentage)}
              </strong>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {data.selectedBy.length > 0 ? (
                data.selectedBy.map((member) => (
                  <span key={member.userId} style={memberBadgeStyle}>
                    {member.userName}
                    {member.userId === data.requesterUserId
                      ? ` · ${t('poolDetail.matchInsights.you')}`
                      : ''}
                  </span>
                ))
              ) : (
                <p style={messageStyle}>{t('poolDetail.players.insights.noSelections')}</p>
              )}
            </div>
          </section>

          <section style={{ display: 'grid', gap: '0.45rem' }}>
            <h3 style={sectionTitleStyle}>{t('poolDetail.players.insights.actionsByMatch')}</h3>
            {data.matches.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {data.matches.map((match) => (
                  <div key={`${match.matchType}:${match.matchId}`} style={matchPanelStyle}>
                    <div style={matchHeaderStyle}>
                      <span style={teamStyle}>
                        <ReactCountryFlag countryCode={countryIsoCode(match.homeTeamName)} svg />
                        <span>{match.homeTeamName}</span>
                      </span>
                      <strong
                        style={{
                          color: 'rgb(var(--fg))',
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {typeof match.homeResult === 'number' &&
                        typeof match.awayResult === 'number'
                          ? `${match.homeResult} - ${match.awayResult}`
                          : '—'}
                      </strong>
                      <span
                        style={{ ...teamStyle, justifyContent: 'flex-end', textAlign: 'right' }}
                      >
                        <span>{match.awayTeamName}</span>
                        <ReactCountryFlag countryCode={countryIsoCode(match.awayTeamName)} svg />
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.6rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.68rem' }}>
                        {match.scheduledAt
                          ? new Date(match.scheduledAt).toLocaleString(locale, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : `${match.matchType === 'group' ? t('poolDetail.players.insights.groupPhase') : t('poolDetail.players.insights.finalPhase')} · P${match.matchNumber ?? ''}`}
                      </span>
                      <PlayerActionSummary
                        player={match}
                        labels={actionLabels}
                        position={data.player.position}
                        scoring={playerScoring}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={messageStyle}>{t('poolDetail.players.insights.noActions')}</p>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

function PlayerSummary({ data }: Readonly<{ data: PlayerInsightsData }>) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
      <PlayerShirt teamName={data.player.teamName} shirtNumber={data.player.shirtNumber} size={32} />
      {data.player.imageUrl ? (
        <Image
          src={data.player.imageUrl}
          alt=""
          style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '999px',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <ReactCountryFlag
          countryCode={countryIsoCode(data.player.teamName)}
          svg
          style={{ width: '1.55em', height: '1.55em', flexShrink: 0 }}
        />
      )}
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            color: 'rgb(var(--fg))',
            fontSize: '0.95rem',
            fontWeight: 800,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.player.name}
        </span>
        <span
          style={{
            display: 'block',
            color: 'rgb(var(--fg-muted))',
            fontSize: '0.7rem',
            fontWeight: 600,
          }}
        >
          {data.player.teamName}
        </span>
      </span>
    </span>
  );
}

function formatPercentage(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

const sectionTitleStyle: CSSProperties = {
  color: 'rgb(var(--fg))',
  fontSize: '0.72rem',
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

const percentageCardStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  padding: '0.5rem 0.65rem',
  borderRadius: 'var(--radius-md)',
  background: 'rgb(var(--pitch) / 0.08)',
  border: '1px solid rgb(var(--pitch) / 0.35)',
};

const memberBadgeStyle: CSSProperties = {
  padding: '0.28rem 0.5rem',
  borderRadius: 'var(--radius-full)',
  background: 'rgb(var(--bg-subtle))',
  border: '1px solid rgb(var(--border))',
  color: 'rgb(var(--fg))',
  fontSize: '0.72rem',
  fontWeight: 700,
};

const matchPanelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.45rem',
  padding: '0.55rem 0.65rem',
  borderRadius: 'var(--radius-md)',
  background: 'rgb(var(--match-neutral-bg))',
  border: '1px solid rgb(var(--control-border))',
  boxShadow: 'var(--shadow-sm)',
};

const matchHeaderStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
  alignItems: 'center',
  gap: '0.45rem',
};

const teamStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  minWidth: 0,
  color: 'rgb(var(--fg))',
  fontSize: '0.76rem',
  fontWeight: 700,
};

const messageStyle: CSSProperties = {
  margin: 0,
  color: 'rgb(var(--fg-muted))',
  fontSize: '0.82rem',
  lineHeight: 1.45,
};
