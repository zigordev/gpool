'use client';

import { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { FaChartBar, FaStar } from 'react-icons/fa';
import { GiLeatherBoot } from 'react-icons/gi';
import { useI18n } from '@/i18n/client';
import { apiClient } from '@/lib/api';
import { countryIsoCode } from '@/lib/country-flags';
import { PlayerPosition } from '@/types/playerPosition.type';
import { PoolDetailModalButton } from '@/components/pool/PoolDetailModalButton';
import { PlayerShirt } from '@/components/pool/PlayerShirt';

type PopularPlayer = {
  playerId: string;
  name: string;
  teamName: string;
  position: PlayerPosition;
  count: number;
  percentage: number;
};

type SelectionStatistics = {
  memberCount: number;
  awards: {
    goldenBoot: PopularPlayer[];
    tournamentMvp: PopularPlayer[];
  };
  positions: Record<PlayerPosition, PopularPlayer[]>;
};

const POSITIONS: PlayerPosition[] = ['goalkeeper', 'defender', 'midfielder', 'forward'];

export function PlayerSelectionStatistics({
  poolId,
  visible,
}: Readonly<{
  poolId: string;
  visible: boolean;
}>) {
  const { t } = useI18n();
  const [statistics, setStatistics] = useState<SelectionStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    setError(null);
    apiClient
      .get(`/pools/${poolId}/players/selection-statistics`)
      .then((response) => {
        if (active) setStatistics(response.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message || t('poolDetail.players.statistics.loadError')
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [poolId, t, visible]);

  return (
    <PoolDetailModalButton
      title={t('poolDetail.players.statistics.title')}
      icon={<FaChartBar size={13} />}
      disabled={!visible}
    >
      {loading ? (
        <p style={messageStyle}>{t('common.loading')}</p>
      ) : error ? (
        <p role="alert" style={{ ...messageStyle, color: 'rgb(var(--live))' }}>
          {error}
        </p>
      ) : statistics ? (
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          <p style={hintStyle}>{t('poolDetail.players.statistics.description')}</p>
          <StatisticsGroup
            title={t('poolDetail.players.awards.goldenBoot')}
            icon={<GiLeatherBoot aria-hidden style={{ color: '#D4A017', fill: '#D4A017' }} />}
            players={statistics.awards.goldenBoot}
            emptyLabel={t('poolDetail.players.statistics.empty')}
          />
          <StatisticsGroup
            title={t('poolDetail.players.awards.tournamentMvp')}
            icon={<FaStar aria-hidden style={{ color: '#D4A017', fill: '#D4A017' }} />}
            players={statistics.awards.tournamentMvp}
            emptyLabel={t('poolDetail.players.statistics.empty')}
          />
          <div
            style={{
              display: 'grid',
              gap: '0.8rem',
              paddingTop: '0.8rem',
              borderTop: '1px solid rgb(var(--border-subtle))',
            }}
          >
            <p style={hintStyle}>{t('poolDetail.players.statistics.positionsHint')}</p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))',
                gap: '0.8rem',
              }}
            >
              {POSITIONS.map((position) => (
                <StatisticsGroup
                  key={position}
                  title={t('poolDetail.players.statistics.topFive', {
                    position: t(`poolDetail.players.positions.${position}`),
                  })}
                  players={statistics.positions[position] || []}
                  emptyLabel={t('poolDetail.players.statistics.empty')}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </PoolDetailModalButton>
  );
}

function StatisticsGroup({
  title,
  icon,
  players,
  emptyLabel,
}: Readonly<{
  title: string;
  icon?: React.ReactNode;
  players: PopularPlayer[];
  emptyLabel: string;
}>) {
  return (
    <section style={{ display: 'grid', gap: '0.4rem', minWidth: 0 }}>
      <h3
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          margin: 0,
          color: 'rgb(var(--fg))',
          fontSize: '0.78rem',
          fontWeight: 800,
        }}
      >
        {icon}
        {title}
      </h3>
      {players.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          {players.map((player) => (
            <div
              key={player.playerId}
              style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                gap: '0.55rem',
                alignItems: 'center',
                minHeight: '2.25rem',
                padding: '0.4rem 0.5rem',
                border: '1px solid rgb(var(--border-subtle))',
                borderRadius: 'var(--radius-sm)',
                background: 'rgb(var(--bg-elevated))',
              }}
            >
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${player.percentage}%`,
                  background: 'rgb(var(--pitch) / 0.09)',
                  pointerEvents: 'none',
                }}
              />
              <span
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  minWidth: 0,
                  color: 'rgb(var(--fg))',
                  fontSize: '0.76rem',
                  fontWeight: 750,
                }}
              >
                <PlayerShirt teamName={player.teamName} size={25} />
                <ReactCountryFlag
                  countryCode={countryIsoCode(player.teamName)}
                  svg
                  style={{ width: '1.35em', height: '1.35em', flexShrink: 0 }}
                />
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {player.name}
                </span>
              </span>
              <strong
                style={{
                  position: 'relative',
                  color: 'rgb(var(--fg))',
                  fontSize: '0.75rem',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatPercentage(player.percentage)}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p style={messageStyle}>{emptyLabel}</p>
      )}
    </section>
  );
}

function formatPercentage(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

const messageStyle: React.CSSProperties = {
  margin: 0,
  color: 'rgb(var(--fg-muted))',
  fontSize: '0.76rem',
};

const hintStyle: React.CSSProperties = {
  margin: 0,
  color: 'rgb(var(--fg-muted))',
  fontSize: '0.74rem',
  lineHeight: 1.4,
};
