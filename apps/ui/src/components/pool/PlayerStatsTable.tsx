'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { FaFutbol, FaMagic, FaStar, FaShieldAlt } from 'react-icons/fa';
import { GiGoalKeeper, GiLeatherBoot } from 'react-icons/gi';
import { IoMdCloseCircle } from 'react-icons/io';
import { LuRectangleVertical } from 'react-icons/lu';
import { TournamentPlayer } from '@/types/tournamentPlayer.interface';
import { PlayerAward } from '@/types/playerAward.type';
import { PlayerStatKey } from '@/types/playerStatKey.type';
import { countryIsoCode } from '@/lib/country-flags';
import { PlayerShirt } from '@/components/pool/PlayerShirt';
import { PlayerEliminatedBadge } from '@/components/pool/PlayerEliminatedBadge';
import Image from 'next/image';
import { Button } from '../../../design-system/components/core/Button.jsx';
import { Table } from '../../../design-system/components/data-display/Table.jsx';

type PlayerSortKey = PlayerStatKey | 'totalPoints';
type PlayerActionGroup = 'match' | 'penalty' | 'shootout';

const STAT_COLUMNS: Array<{
  key: PlayerStatKey;
  group: PlayerActionGroup;
  icon: React.ReactNode;
  labelKey: string;
}> = [
  {
    key: 'goals',
    group: 'match',
    icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} size={13} />,
    labelKey: 'poolDetail.players.actions.goals',
  },
  {
    key: 'assists',
    group: 'match',
    icon: <FaMagic style={{ color: 'rgb(var(--fg))' }} size={13} />,
    labelKey: 'poolDetail.players.actions.assists',
  },
  {
    key: 'mvps',
    group: 'match',
    icon: <FaStar style={{ color: 'rgb(var(--fg))' }} size={13} />,
    labelKey: 'poolDetail.players.actions.mvps',
  },
  {
    key: 'cleanSheets',
    group: 'match',
    icon: <FaShieldAlt style={{ color: 'rgb(var(--fg))' }} size={13} />,
    labelKey: 'poolDetail.players.actions.cleanSheets',
  },
  {
    key: 'yellowCards',
    group: 'match',
    icon: <LuRectangleVertical style={{ color: '#D4A017', fill: '#D4A017' }} size={13} />,
    labelKey: 'poolDetail.players.actions.yellowCards',
  },
  {
    key: 'doubleYellowCards',
    group: 'match',
    icon: (
      <span style={{ display: 'inline-flex', gap: '0.04rem' }}>
        <LuRectangleVertical style={{ color: '#D4A017', fill: '#D4A017' }} size={13} />
        <LuRectangleVertical style={{ color: '#D4A017', fill: '#D4A017' }} size={13} />
      </span>
    ),
    labelKey: 'poolDetail.players.actions.doubleYellowCards',
  },
  {
    key: 'redCards',
    group: 'match',
    icon: (
      <LuRectangleVertical
        style={{ color: 'rgb(var(--live))', fill: 'rgb(var(--live))' }}
        size={13}
      />
    ),
    labelKey: 'poolDetail.players.actions.redCards',
  },
  {
    key: 'penaltyGoals',
    group: 'penalty',
    icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} size={13} />,
    labelKey: 'poolDetail.players.actions.penaltyGoals',
  },
  {
    key: 'penaltiesSaved',
    group: 'penalty',
    icon: <GiGoalKeeper style={{ color: 'rgb(var(--fg))' }} size={15} />,
    labelKey: 'poolDetail.players.actions.penaltiesSaved',
  },
  {
    key: 'missedPenalties',
    group: 'penalty',
    icon: <IoMdCloseCircle style={{ color: 'rgb(var(--live))' }} size={13} />,
    labelKey: 'poolDetail.players.actions.missedPenalties',
  },
  {
    key: 'forcedPenaltyMisses',
    group: 'penalty',
    icon: <IoMdCloseCircle style={{ color: 'rgb(var(--fg))' }} size={13} />,
    labelKey: 'poolDetail.players.actions.forcedPenaltyMisses',
  },
  {
    key: 'shootoutGoals',
    group: 'shootout',
    icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} size={13} />,
    labelKey: 'poolDetail.players.actions.shootoutGoals',
  },
  {
    key: 'shootoutPenaltiesSaved',
    group: 'shootout',
    icon: <GiGoalKeeper style={{ color: 'rgb(var(--fg))' }} size={15} />,
    labelKey: 'poolDetail.players.actions.shootoutPenaltiesSaved',
  },
  {
    key: 'shootoutMissedPenalties',
    group: 'shootout',
    icon: <IoMdCloseCircle style={{ color: 'rgb(var(--live))' }} size={13} />,
    labelKey: 'poolDetail.players.actions.shootoutMissedPenalties',
  },
  {
    key: 'shootoutForcedPenaltyMisses',
    group: 'shootout',
    icon: <IoMdCloseCircle style={{ color: 'rgb(var(--fg))' }} size={13} />,
    labelKey: 'poolDetail.players.actions.shootoutForcedPenaltyMisses',
  },
];

interface PlayerStatsTableProps {
  players: TournamentPlayer[];
  goldenBootPlayerIds: string[];
  tournamentMvpPlayerId: string;
  computeTotal: (player: TournamentPlayer) => number;
  t: (key: string, params?: Record<string, string | number>) => string;
  editable?: boolean;
  updatingPlayerStat?: string | null;
  updatingPlayerAward?: string | null;
  onStatChange?: (player: TournamentPlayer, stat: PlayerStatKey, delta: number) => void;
  onAwardToggle?: (player: TournamentPlayer, award: PlayerAward, selected: boolean) => void;
  isStatVisible?: (player: TournamentPlayer, stat: PlayerStatKey) => boolean;
  statsDisabled?: boolean;
  toolbar?: React.ReactNode;
  onOpenInsights?: (player: TournamentPlayer) => void;
}

export function PlayerStatsTable({
  players,
  goldenBootPlayerIds,
  tournamentMvpPlayerId,
  computeTotal,
  t,
  editable = false,
  updatingPlayerStat,
  updatingPlayerAward,
  onStatChange,
  onAwardToggle,
  isStatVisible = () => true,
  statsDisabled = false,
  toolbar,
  onOpenInsights,
}: Readonly<PlayerStatsTableProps>) {
  const [sortKey, setSortKey] = useState<PlayerSortKey>('totalPoints');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const visibleStatColumns = STAT_COLUMNS.filter((col) =>
    players.some((player) => isStatVisible(player, col.key))
  );
  const visibleGroups = (['match', 'penalty', 'shootout'] as const)
    .map((group) => ({
      key: group,
      columns: visibleStatColumns.filter((column) => column.group === group),
    }))
    .filter((group) => group.columns.length > 0);
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
    const aVal = sortKey === 'totalPoints' ? computeTotal(a) : a[sortKey] || 0;
    const bVal = sortKey === 'totalPoints' ? computeTotal(b) : b[sortKey] || 0;
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
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
    <Table
      caption={toolbar}
      minWidth={tableMinWidth}
      maxHeight="65vh"
      density="compact"
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'rgb(var(--fg-muted))', whiteSpace: 'nowrap' }}>
            {sorted.length}{' '}
            {sorted.length === 1
              ? t('poolDetail.players.title')
              : t('poolDetail.players.title').toLowerCase()}
            {totalPages > 1 ? ` · ${safePage} / ${totalPages}` : ''}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
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
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <Button variant="ghost" size="icon"
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{ width: '1.8rem', height: '1.8rem' }}
            >
              ←
            </Button>
            <Button variant="ghost" size="icon"
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{ width: '1.8rem', height: '1.8rem' }}
            >
              →
            </Button>
          </div>
        </div>
      }
    >
        {players.length > 0 ? (
        <thead>
          <tr>
            <th
              rowSpan={2}
              style={{
                ...thStyle,
                textAlign: 'left',
                minWidth: '11rem',
                position: 'sticky',
                left: 0,
                zIndex: 5,
                background: 'var(--ds-color-surface-2)',
                borderRight: '1px solid var(--ds-color-border)',
              }}
            >
              {t('poolDetail.players.title')}
            </th>
            {visibleGroups.map((group, index) => (
              <th
                key={group.key}
                colSpan={group.columns.length}
                style={{
                  ...groupThStyle,
                  borderLeft: index > 0 ? '2px solid rgb(var(--border))' : undefined,
                }}
              >
                {t(`poolDetail.players.actionGroups.${group.key}`)}
              </th>
            ))}
            <th
              colSpan={2}
              style={{ ...groupThStyle, borderLeft: '2px solid rgb(var(--border))' }}
            >
              {t('poolDetail.players.actionGroups.tournament')}
            </th>
            <th
              rowSpan={2}
              style={{
                ...sortableTh('totalPoints'),
                borderLeft: '2px solid rgb(var(--border))',
              }}
              onClick={() => handleSort('totalPoints')}
            >
              {t('poolDetail.ranking.totalPoints')}
              {sortIndicator('totalPoints')}
            </th>
          </tr>
          <tr>
            {visibleStatColumns.map((col, index) => (
              <th
                key={col.key}
                style={{
                  ...sortableTh(col.key),
                  top: '1.85rem',
                  borderLeft:
                    index > 0 && visibleStatColumns[index - 1].group !== col.group
                      ? '2px solid rgb(var(--border))'
                      : undefined,
                }}
                onClick={() => handleSort(col.key)}
                title={t(col.labelKey)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  {col.icon}
                  {sortIndicator(col.key)}
                </span>
              </th>
            ))}
            <th
              style={{ ...thStyle, top: '1.85rem', borderLeft: '2px solid rgb(var(--border))' }}
              title={t('poolDetail.players.awards.goldenBoot')}
            >
              <GiLeatherBoot size={15} style={{ color: '#D4A017', fill: '#D4A017' }} />
            </th>
            <th
              style={{ ...thStyle, top: '1.85rem' }}
              title={t('poolDetail.players.awards.tournamentMvp')}
            >
              <FaStar size={15} style={{ color: '#D4A017', fill: '#D4A017' }} />
            </th>
          </tr>
        </thead>
        ) : null}
        <tbody>
          {players.length === 0 ? (
            <tr>
              <td colSpan={99} style={{ padding: '1.5rem', textAlign: 'center', color: 'rgb(var(--fg-muted))' }}>
                {t('poolDetail.players.empty')}
              </td>
            </tr>
          ) : null}
          {paged.map((player) => {
            const totalPts = computeTotal(player);
            const isGoldenBoot = goldenBootPlayerIds.includes(player.playerId);
            const isMVP = tournamentMvpPlayerId === player.playerId;
            const dimmedPlayerStyle = player.teamEliminated
              ? { opacity: 0.5, filter: 'grayscale(0.9)' }
              : undefined;
            const openInsights = onOpenInsights ? () => onOpenInsights(player) : undefined;
            const handleInsightsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
              if (!openInsights || (event.key !== 'Enter' && event.key !== ' ')) return;
              event.preventDefault();
              openInsights();
            };
            return (
              <tr
                key={player.playerId}
                style={{
                  borderBottom: '1px solid rgb(var(--border) / 0.65)',
                  background: player.teamEliminated
                    ? 'rgb(var(--live) / 0.055)'
                    : undefined,
                }}
              >
                <td
                  style={{
                    ...tdStyle,
                    textAlign: 'left',
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    // Layered over the surface rather than used alone: a
                    // translucent frozen cell lets the row scroll through it.
                    background: player.teamEliminated
                      ? 'linear-gradient(rgb(var(--live) / 0.08), rgb(var(--live) / 0.08)), var(--ds-color-surface)'
                      : 'var(--ds-color-surface)',
                    borderRight: '1px solid var(--ds-color-border)',
                  }}
                >
                  <div
                    role={openInsights ? 'button' : undefined}
                    tabIndex={openInsights ? 0 : undefined}
                    title={openInsights ? t('poolDetail.players.insights.open') : undefined}
                    onClick={openInsights}
                    onKeyDown={handleInsightsKeyDown}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: openInsights ? 'pointer' : undefined,
                      borderRadius: 'var(--radius-md)',
                      outlineOffset: '3px',
                      ...dimmedPlayerStyle,
                    }}
                  >
                    <PlayerShirt
                      teamName={player.teamName}
                      shirtNumber={player.shirtNumber}
                      size={30}
                    />
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
                        <Image
                          src={player.imageUrl}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
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
                      {player.teamEliminated ? <PlayerEliminatedBadge /> : null}
                    </div>
                  </div>
                </td>

                {visibleStatColumns.map((col, columnIndex) => {
                  const value = player[col.key] || 0;
                  const isUpdating =
                    editable && updatingPlayerStat === `${player.playerId}:${col.key}`;
                  const statVisibleForPlayer = isStatVisible(player, col.key);
                  return (
                    <td
                      key={col.key}
                      style={{
                        ...tdStyle,
                        borderLeft:
                          columnIndex > 0 &&
                          visibleStatColumns[columnIndex - 1].group !== col.group
                            ? '2px solid rgb(var(--border))'
                            : undefined,
                      }}
                    >
                      {statVisibleForPlayer ? (
                        editable ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.12rem',
                            }}
                          >
                            <Button variant="ghost" size="icon"
                              type="button"
                              disabled={statsDisabled || isUpdating || value <= 0}
                              title={t('adminResults.players.decrease')}
                              aria-label={t('adminResults.players.decrease')}
                              onClick={() => onStatChange?.(player, col.key, -1)}
                              style={{
                                width: '1.35rem',
                                height: '1.35rem',
                                fontSize: '0.8rem',
                                flexShrink: 0,
                              }}
                            >
                              −
                            </Button>
                            <span style={statNumberStyle}>{value}</span>
                            <Button variant="ghost" size="icon"
                              type="button"
                              disabled={statsDisabled || isUpdating}
                              title={t('adminResults.players.increase')}
                              aria-label={t('adminResults.players.increase')}
                              onClick={() => onStatChange?.(player, col.key, 1)}
                              style={{
                                width: '1.35rem',
                                height: '1.35rem',
                                fontSize: '0.8rem',
                                flexShrink: 0,
                              }}
                            >
                              +
                            </Button>
                          </span>
                        ) : (
                          <span style={statNumberStyle}>{value}</span>
                        )
                      ) : (
                        <span style={statNumberStyle}>0</span>
                      )}
                    </td>
                  );
                })}
                <td style={{ ...tdStyle, borderLeft: '2px solid rgb(var(--border))' }}>
                  {onAwardToggle ? (
                    <Button variant="ghost" size="icon"
                      type="button"
                      aria-pressed={isGoldenBoot}
                      aria-label={t('adminResults.players.awardWinners.toggleGoldenBoot', {
                        player: player.name,
                      })}
                      title={t('adminResults.players.awardWinners.toggleGoldenBoot', {
                        player: player.name,
                      })}
                      disabled={updatingPlayerAward === `golden_boot:${player.playerId}`}
                      onClick={() => onAwardToggle(player, 'golden_boot', !isGoldenBoot)}
                      style={{ width: '2rem', height: '2rem' }}
                    >
                      <GiLeatherBoot
                        size={20}
                        style={{
                          color: isGoldenBoot ? '#D4A017' : 'rgb(var(--fg-muted))',
                          fill: isGoldenBoot ? '#D4A017' : 'rgb(var(--fg-muted))',
                          opacity: isGoldenBoot ? 1 : 0.3,
                          transform: isGoldenBoot ? 'scale(1.08)' : 'scale(1)',
                          transition:
                            'color 0.18s ease, opacity 0.18s ease, transform 0.18s ease',
                        }}
                      />
                    </Button>
                  ) : (
                    <GiLeatherBoot
                      size={20}
                      style={{
                        color: isGoldenBoot ? '#D4A017' : 'rgb(var(--fg-muted))',
                        fill: isGoldenBoot ? '#D4A017' : 'rgb(var(--fg-muted))',
                        opacity: isGoldenBoot ? 1 : 0.3,
                      }}
                    />
                  )}
                </td>
                <td style={tdStyle}>
                  {onAwardToggle ? (
                    <Button variant="ghost" size="icon"
                      type="button"
                      aria-pressed={isMVP}
                      aria-label={t('adminResults.players.awardWinners.toggleTournamentMvp', {
                        player: player.name,
                      })}
                      title={t('adminResults.players.awardWinners.toggleTournamentMvp', {
                        player: player.name,
                      })}
                      disabled={updatingPlayerAward === `tournament_mvp:${player.playerId}`}
                      onClick={() => onAwardToggle(player, 'tournament_mvp', !isMVP)}
                      style={{ width: '2rem', height: '2rem' }}
                    >
                      <FaStar
                        size={20}
                        style={{
                          color: isMVP ? '#D4A017' : 'rgb(var(--fg-muted))',
                          fill: isMVP ? '#D4A017' : 'rgb(var(--fg-muted))',
                          opacity: isMVP ? 1 : 0.3,
                          transform: isMVP ? 'scale(1.08)' : 'scale(1)',
                          transition:
                            'color 0.18s ease, opacity 0.18s ease, transform 0.18s ease',
                        }}
                      />
                    </Button>
                  ) : (
                    <FaStar
                      size={20}
                      style={{
                        color: isMVP ? '#D4A017' : 'rgb(var(--fg-muted))',
                        fill: isMVP ? '#D4A017' : 'rgb(var(--fg-muted))',
                        opacity: isMVP ? 1 : 0.3,
                      }}
                    />
                  )}
                </td>
                <td style={{ ...numberStyleGold, borderLeft: '2px solid rgb(var(--border))' }}>
                  {totalPts}
                </td>
              </tr>
            );
          })}
        </tbody>
    </Table>
  );
}

// Header typography, cell padding, sticky top and row separators come from
// the design system's Table. What stays is what this table needs on top:
// centred stat columns, and a second header row that sticks below the first
// (hence groupThStyle's fixed height, which the `top: 1.85rem` below matches).
const thStyle: React.CSSProperties = {
  textAlign: 'center',
  zIndex: 2,
};

const groupThStyle: React.CSSProperties = {
  ...thStyle,
  padding: '0.35rem 0.6rem',
  height: '1.85rem',
  boxSizing: 'border-box',
  fontSize: '0.56rem',
  color: 'rgb(var(--fg-subtle))',
};

const tdStyle: React.CSSProperties = {
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
