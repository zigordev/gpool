'use client';

import { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { FaFutbol, FaMagic, FaStar, FaShieldAlt } from 'react-icons/fa';
import { GiLeatherBoot } from 'react-icons/gi';
import { IoMdCloseCircle } from 'react-icons/io';
import { LuRectangleVertical } from 'react-icons/lu';
import { PiBoxingGlove } from 'react-icons/pi';
import { TournamentPlayer } from '@/types/tournamentPlayer.interface';
import { PlayerStatKey } from '@/types/playerStatKey.type';
import { countryIsoCode } from '@/lib/country-flags';

type PlayerSortKey = PlayerStatKey | 'totalPoints';

const STAT_COLUMNS: Array<{ key: PlayerStatKey; icon: React.ReactNode; labelKey: string }> = [
  { key: 'goals', icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} size={13} />, labelKey: 'poolDetail.players.actions.goals' },
  { key: 'assists', icon: <FaMagic style={{ color: 'rgb(var(--fg))' }} size={13} />, labelKey: 'poolDetail.players.actions.assists' },
  { key: 'mvps', icon: <FaStar style={{ color: 'rgb(var(--fg))' }} size={13} />, labelKey: 'poolDetail.players.actions.mvps' },
  { key: 'penaltiesSaved', icon: <PiBoxingGlove style={{ color: 'rgb(var(--fg))' }} size={13} />, labelKey: 'poolDetail.players.actions.penaltiesSaved' },
  { key: 'cleanSheets', icon: <FaShieldAlt style={{ color: 'rgb(var(--fg))' }} size={13} />, labelKey: 'poolDetail.players.actions.cleanSheets' },
  { key: 'yellowCards', icon: <LuRectangleVertical style={{ color: 'yellow', fill: 'yellow' }} size={13} />, labelKey: 'poolDetail.players.actions.yellowCards' },
  { key: 'redCards', icon: <LuRectangleVertical style={{ color: 'red', fill: 'red' }} size={13} />, labelKey: 'poolDetail.players.actions.redCards' },
  { key: 'missedPenalties', icon: <IoMdCloseCircle style={{ color: 'red' }} size={13} />, labelKey: 'poolDetail.players.actions.missedPenalties' },
];

interface PlayerStatsTableProps {
  players: TournamentPlayer[];
  goldenBootPlayerIds: string[];
  tournamentMvpPlayerId: string;
  computeTotal: (player: TournamentPlayer) => number;
  t: (key: string, params?: Record<string, string | number>) => string;
  editable?: boolean;
  updatingPlayerStat?: string | null;
  onStatChange?: (player: TournamentPlayer, stat: PlayerStatKey, delta: number) => void;
  isStatVisible?: (player: TournamentPlayer, stat: PlayerStatKey) => boolean;
  toolbar?: React.ReactNode;
}

export function PlayerStatsTable({
  players,
  goldenBootPlayerIds,
  tournamentMvpPlayerId,
  computeTotal,
  t,
  editable = false,
  updatingPlayerStat,
  onStatChange,
  isStatVisible = () => true,
  toolbar,
}: Readonly<PlayerStatsTableProps>) {
  const [sortKey, setSortKey] = useState<PlayerSortKey>('totalPoints');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const visibleStatColumns = STAT_COLUMNS.filter((col) => players.some((player) => isStatVisible(player, col.key)));
  const visibleStatKey = visibleStatColumns.map((col) => col.key).join('|');
  const tableMinWidth = `${Math.max(520, 360 + visibleStatColumns.length * (editable ? 92 : 64))}px`;

  useEffect(() => {
    if (sortKey !== 'totalPoints' && !visibleStatKey.split('|').includes(sortKey)) {
      setSortKey('totalPoints');
      setSortDir('desc');
    }
  }, [sortKey, visibleStatKey]);

  const handleSort = (key: PlayerSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const sorted = [...players].sort((a, b) => {
    const aVal = sortKey === 'totalPoints' ? computeTotal(a) : (a[sortKey] || 0);
    const bVal = sortKey === 'totalPoints' ? computeTotal(b) : (b[sortKey] || 0);
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const sortIndicator = (key: PlayerSortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const sortableTh = (key: PlayerSortKey): React.CSSProperties => ({
    ...thStyle,
    cursor: 'pointer',
    userSelect: 'none',
    color: sortKey === key ? 'rgb(var(--fg))' : 'rgb(var(--fg-muted))',
  });

  return (
    <div
      style={{
        overflow: 'clip',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgb(var(--border))',
        background: 'rgb(var(--bg-elevated))',
        boxShadow: '0 4px 14px rgb(15 23 42 / 0.08)',
      }}
    >
      {toolbar ? (
        <div
          style={{
            padding: '0.75rem',
            borderBottom: '1px solid rgb(var(--border))',
            background: 'rgb(var(--panel-muted-bg-solid))',
          }}
        >
          {toolbar}
        </div>
      ) : null}
      {players.length === 0 ? (
        <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
          {t('poolDetail.players.empty')}
        </p>
      ) : (
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: tableMinWidth }}>
          <thead>
            <tr style={{ background: 'rgb(var(--panel-muted-bg-solid))', borderBottom: '1px solid rgb(var(--border))' }}>
              <th style={{ ...thStyle, textAlign: 'left', minWidth: '11rem', position: 'sticky', left: 0, zIndex: 5, background: 'rgb(var(--panel-muted-bg-solid))', boxShadow: '4px 0 0 rgb(var(--panel-muted-bg-solid)), 7px 0 10px rgb(0 0 0 / 0.10)' }}>
                {t('poolDetail.players.title')}
              </th>
              {visibleStatColumns.map((col) => (
                <th
                  key={col.key}
                  style={sortableTh(col.key)}
                  onClick={() => handleSort(col.key)}
                  title={t(col.labelKey)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    {col.icon}
                    {sortIndicator(col.key)}
                  </span>
                </th>
              ))}
              <th style={thStyle} title={t('poolDetail.players.awards.goldenBoot')}>
                <GiLeatherBoot size={15} style={{ color: 'gold' }} />
              </th>
              <th style={thStyle} title={t('poolDetail.players.awards.tournamentMvp')}>
                <FaStar size={15} style={{ color: 'gold' }} />
              </th>
              <th style={sortableTh('totalPoints')} onClick={() => handleSort('totalPoints')}>
                {t('poolDetail.ranking.totalPoints')}{sortIndicator('totalPoints')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map((player) => {
              const totalPts = computeTotal(player);
              const isGoldenBoot = goldenBootPlayerIds.includes(player.playerId);
              const isMVP = tournamentMvpPlayerId === player.playerId;
              return (
                <tr key={player.playerId} style={{ borderBottom: '1px solid rgb(var(--border) / 0.65)' }}>
                  <td style={{ ...tdStyle, textAlign: 'left', position: 'sticky', left: 0, zIndex: 1, background: 'rgb(var(--bg-elevated))', boxShadow: '2px 0 4px rgb(0 0 0 / 0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {player.imageUrl ? (
                        <span
                          aria-hidden
                          style={{
                            width: '1.85rem',
                            height: '1.85rem',
                            borderRadius: '999px',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                            background: 'rgb(var(--bg-subtle))',
                            border: '1px solid rgb(var(--border))',
                          }}
                        >
                          <img src={player.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </span>
                      ) : null}
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: 'rgb(var(--fg))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {player.name}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.68rem',
                            color: 'rgb(var(--fg-muted))',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <ReactCountryFlag
                            countryCode={countryIsoCode(player.teamName)}
                            svg
                            style={{ width: '1.3em', height: '1.3em' }}
                          />
                          {player.teamName}
                        </p>
                      </div>
                    </div>
                  </td>

                  {visibleStatColumns.map((col) => {
                    const value = player[col.key] || 0;
                    const isUpdating = editable && updatingPlayerStat === `${player.playerId}:${col.key}`;
                    const statVisibleForPlayer = isStatVisible(player, col.key);
                    return (
                      <td key={col.key} style={tdStyle}>
                        {!statVisibleForPlayer ? null : editable ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.12rem' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon"
                              disabled={isUpdating || value <= 0}
                              title={t('adminResults.players.decrease')}
                              aria-label={t('adminResults.players.decrease')}
                              onClick={() => onStatChange?.(player, col.key, -1)}
                              style={{ width: '1.35rem', height: '1.35rem', fontSize: '0.8rem', flexShrink: 0 }}
                            >
                              −
                            </button>
                            <span style={statNumberStyle}>{value}</span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon"
                              disabled={isUpdating}
                              title={t('adminResults.players.increase')}
                              aria-label={t('adminResults.players.increase')}
                              onClick={() => onStatChange?.(player, col.key, 1)}
                              style={{ width: '1.35rem', height: '1.35rem', fontSize: '0.8rem', flexShrink: 0 }}
                            >
                              +
                            </button>
                          </span>
                        ) : (
                          <span style={statNumberStyle}>{value}</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={tdStyle}>
                    <GiLeatherBoot
                      size={20}
                      style={{
                        color: isGoldenBoot ? 'gold' : 'rgb(var(--fg-muted))',
                        opacity: isGoldenBoot ? 1 : 0.3,
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <FaStar
                      size={20}
                      style={{
                        color: isMVP ? 'gold' : 'rgb(var(--fg-muted))',
                        opacity: isMVP ? 1 : 0.3,
                      }}
                    />
                  </td>
                  <td style={numberStyleGold}>{totalPts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.55rem 0.75rem',
          borderTop: '1px solid rgb(var(--border))',
          background: 'rgb(var(--panel-muted-bg-solid))',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.78rem', color: 'rgb(var(--fg-muted))', whiteSpace: 'nowrap' }}>
          {sorted.length} {sorted.length === 1 ? t('poolDetail.players.title') : t('poolDetail.players.title').toLowerCase()}
          {totalPages > 1 ? ` · ${safePage} / ${totalPages}` : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={{
              fontSize: '0.78rem',
              padding: '0.2rem 0.4rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgb(var(--border))',
              background: 'rgb(var(--input-bg))',
              color: 'rgb(var(--fg))',
              transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
            }}
          >
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ width: '1.8rem', height: '1.8rem' }}
          >
            ←
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ width: '1.8rem', height: '1.8rem' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '0.65rem 0.75rem',
  fontSize: '0.62rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgb(var(--fg-muted))',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  zIndex: 2,
  background: 'rgb(var(--panel-muted-bg-solid))',
};

const tdStyle: React.CSSProperties = {
  padding: '0.55rem 0.6rem',
  verticalAlign: 'middle',
  textAlign: 'center',
};

const statNumberStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display, inherit)',
  fontSize: '0.9rem',
  fontWeight: 700,
  minWidth: '1.4rem',
  textAlign: 'center',
  color: 'rgb(var(--fg))',
  fontVariantNumeric: 'tabular-nums',
  display: 'inline-block',
};

const numberStyleGold: React.CSSProperties = {
  ...tdStyle,
  fontFamily: 'var(--font-display, inherit)',
  fontSize: '1.05rem',
  fontWeight: 700,
  color: 'rgb(var(--gold))',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};
