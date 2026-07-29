'use client';

import { useI18n } from "@/i18n/client";
import { BsFillDiagram3Fill } from "react-icons/bs";
import { FaLayerGroup } from "react-icons/fa6";
import { GiSoccerKick } from "react-icons/gi";
import { Button } from '../../../design-system/components/core/Button.jsx';
import { Table } from '../../../design-system/components/data-display/Table.jsx';
interface RankingEntry {
  rank: number;
  userId?: string;
  userName: string;
  groupPhasePoints: number;
  finalPhasePoints: number;
  playerPoints: number;
  movement?: {
    previousRank: number;
    delta: number;
    matchdayPoints: number;
  };
}

interface Props {
  ranking: RankingEntry[];
  currentUserId?: string;
  currentUserEmail?: string;
  onSpy: (entry: { userId: string; userName: string }) => Promise<void> | void;
  spyEnabled?: boolean;
}

export function RankTable({
  ranking,
  currentUserId,
  currentUserEmail,
  onSpy,
  spyEnabled = false,
}: Readonly<Props>) {
  const { t } = useI18n();

  return (
    <Table minWidth="min(540px, 100%)" maxHeight="65vh" density="compact">
    <thead>
      <tr>
        <th className="rank-table-identity-col" style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: 0, zIndex: 5, background: 'var(--ds-color-surface-2)', borderRight: '1px solid var(--ds-color-border)' }}></th>
        <th style={thStyle}>
          <RankHeaderIconLabel icon={<FaLayerGroup aria-hidden />} label={t('poolDetail.ranking.groupPhasePoints')} />
        </th>
        <th style={thStyle}>
          <RankHeaderIconLabel icon={<BsFillDiagram3Fill aria-hidden />} label={t('poolDetail.ranking.finalPhasePoints')} />
        </th>
        <th style={thStyle}>
          <RankHeaderIconLabel icon={<GiSoccerKick aria-hidden />} label={t('poolDetail.ranking.playerPoints')} />
        </th>
        <th style={thStyle}>
          {t('poolDetail.ranking.totalPoints')}
        </th>
        {spyEnabled ? <th style={thStyle}></th> : null}
      </tr>
    </thead>

    <tbody>
      {ranking.map((entry) => {
        const isCurrentUser =
          (entry.userId && entry.userId === currentUserId) ||
          entry.userName === currentUserEmail;

        const rowBackground = isCurrentUser
          ? 'rgb(var(--accent-from) / 0.08)'
          : 'transparent';
        // The frozen column has to be opaque or rows scroll visibly under it,
        // so the current-user tint is layered over the surface rather than
        // used on its own.
        const stickyCellBackground = isCurrentUser
          ? `linear-gradient(${rowBackground}, ${rowBackground}), var(--ds-color-surface)`
          : 'var(--ds-color-surface)';
        const movement = entry.movement;

        return (
          <tr
            key={`${entry.rank}-${entry.userName}`}
            style={{
              background: rowBackground,
              boxShadow: isCurrentUser
                ? 'inset 3px 0 0 rgb(var(--accent-from))'
                : 'none',
              borderBottom: '1px solid rgb(var(--border) / 0.65)',
            }}
          >
            <td
              className="rank-table-identity-col"
              style={{
                ...tdStyle,
                textAlign: 'left',
                fontWeight: 600,
                color: 'rgb(var(--fg))',
                position: 'sticky',
                left: 0,
                zIndex: 4,
                background: stickyCellBackground,
                borderRight: '1px solid var(--ds-color-border)',
              }}
            >
              <span className="rank-table-identity">
                <span
                  className="rank-table-rank"
                  style={{
                    color: isCurrentUser
                      ? 'rgb(var(--accent-from))'
                      : 'rgb(var(--fg-muted))',
                  }}
                >
                  {entry.rank}
                </span>
                <span className="rank-table-movement">
                  {movement ? (
                    <RankMovementIndicator
                      delta={movement.delta}
                      matchdayPoints={movement.matchdayPoints}
                      previousRank={movement.previousRank}
                    />
                  ) : null}
                </span>
                <span
                  className="rank-table-user-full"
                  style={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.userName}
                </span>
              </span>
            </td>

            <td style={numberStyle}>
              {entry.groupPhasePoints}
            </td>

            <td style={numberStyle}>
              {entry.finalPhasePoints}
            </td>

            <td style={numberStyle}>
              {entry.playerPoints}
            </td>

            <td style={numberStyleGold}>
              {entry.groupPhasePoints + entry.finalPhasePoints + entry.playerPoints}
            </td>

            {spyEnabled ? (
              <td style={tdStyle}>
                <Button variant="ghost" size="icon"
                  disabled={isCurrentUser || !entry.userId}
                  type="button"
                  onClick={() => entry.userId && onSpy({ userId: entry.userId, userName: entry.userName })}
                  aria-label={t('poolDetail.spy.action')}
                  title={t('poolDetail.spy.action')}
                  style={{
                    width: '2.1rem',
                    height: '2.1rem',
                    color: 'rgb(var(--fg-muted))',
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </Button>
              </td>
            ) : null}
          </tr>
        );
      })}
    </tbody>
    </Table>
  );
}

function RankHeaderIconLabel({ icon, label }: Readonly<{ icon: React.ReactNode; label: string }>) {
  return (
    <span className="rank-table-header-label" title={label} aria-label={label}>
      <span className="rank-table-header-icon">{icon}</span>
      <span className="rank-table-header-text">{label}</span>
    </span>
  );
}

function RankMovementIndicator({
  delta,
  matchdayPoints,
  previousRank,
}: Readonly<{ delta: number; matchdayPoints: number; previousRank: number }>) {
  const { t } = useI18n();
  const movedUp = delta > 0;
  const movedDown = delta < 0;
  const label = movedUp
    ? t('poolDetail.ranking.movement.up', { positions: delta, points: matchdayPoints })
    : movedDown
      ? t('poolDetail.ranking.movement.down', { positions: Math.abs(delta), points: matchdayPoints })
      : t('poolDetail.ranking.movement.same', { points: matchdayPoints });

  return (
    <span
      title={`${label} · ${t('poolDetail.ranking.movement.previousRank', { rank: previousRank })}`}
      aria-label={`${label}. ${t('poolDetail.ranking.movement.previousRank', { rank: previousRank })}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '1rem',
        fontSize: '0.62rem',
        fontWeight: 850,
        color: movedUp
          ? 'rgb(var(--pitch))'
          : movedDown
            ? 'rgb(var(--live))'
            : 'rgb(var(--fg-subtle))',
        background: 'transparent',
        border: 0,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {movedUp ? `▲${delta}` : movedDown ? `▼${Math.abs(delta)}` : ' '}
    </span>
  );
}

// Header typography, cell padding, sticky top and row separators come from
// the design system's Table. These two only carry what it does not: this
// table centres every column but the identity one, and renders its numbers
// in the display face.
const thStyle: React.CSSProperties = { textAlign: 'center' };

const tdStyle: React.CSSProperties = { textAlign: 'center' };

const numberStyle: React.CSSProperties = {
  ...tdStyle,
  fontFamily: 'var(--font-display, inherit)',
  fontSize: '1.05rem',
  fontWeight: 700,
  color: 'rgb(var(--fg))',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
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
