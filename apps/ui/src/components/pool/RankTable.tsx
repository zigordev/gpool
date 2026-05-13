'use client';

import { useI18n } from "@/i18n/client";
import { BsFillDiagram3Fill } from "react-icons/bs";
import { FaLayerGroup, FaPerson } from "react-icons/fa6";

interface RankingEntry {
  rank: number;
  userId?: string;
  userName: string;
  groupPhasePoints: number;
  finalPhasePoints: number;
  playerPoints: number;
}

interface Props {
  ranking: RankingEntry[];
  currentUserId?: string;
  currentUserEmail?: string;
  prizeForRank: (rank: number) => number;
  formatCurrency: (value: number) => string;
  onSpy: (entry: { userId: string; userName: string }) => Promise<void> | void;
  spyEnabled?: boolean;
}

export function RankTable({
  ranking,
  currentUserId,
  currentUserEmail,
  prizeForRank,
  formatCurrency,
  onSpy,
  spyEnabled = false,
}: Readonly<Props>) {
  const { t } = useI18n();

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
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh' }}>
      <table
        className="rank-table"
        style={{
          width: '100%',
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
            <th style={{ ...thStyle, width: '3.6rem', position: 'sticky', left: 0, zIndex: 5, background: 'rgb(var(--panel-muted-bg-solid))' }}></th>
            <th className="rank-table-user-col" style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: '3.6rem', zIndex: 5, background: 'rgb(var(--panel-muted-bg-solid))', boxShadow: '4px 0 0 rgb(var(--panel-muted-bg-solid)), 7px 0 10px rgb(0 0 0 / 0.10)' }}></th>
            <th style={thStyle}>
              <RankHeaderIconLabel icon={<FaLayerGroup aria-hidden />} label={t('poolDetail.ranking.groupPhasePoints')} />
            </th>
            <th style={thStyle}>
              <RankHeaderIconLabel icon={<BsFillDiagram3Fill aria-hidden />} label={t('poolDetail.ranking.finalPhasePoints')} />
            </th>
            <th style={thStyle}>
              <RankHeaderIconLabel icon={<FaPerson aria-hidden />} label={t('poolDetail.ranking.playerPoints')} />
            </th>
            <th style={thStyle}>
              {t('poolDetail.ranking.totalPoints')}
            </th>
            <th style={thStyle}>{t('poolDetail.ranking.prize')}</th>
            {spyEnabled ? <th style={thStyle}></th> : null}
          </tr>
        </thead>

        <tbody>
          {ranking.map((entry) => {
            const isCurrentUser =
              (entry.userId && entry.userId === currentUserId) ||
              entry.userName === currentUserEmail;

            const prize = prizeForRank(entry.rank);
            const stickyCellBackground = 'rgb(var(--bg-elevated))';

            return (
              <tr
                key={`${entry.rank}-${entry.userName}`}
                style={{
                  background: isCurrentUser
                    ? 'rgb(var(--accent-from) / 0.08)'
                    : 'transparent',
                  boxShadow: isCurrentUser
                    ? 'inset 3px 0 0 rgb(var(--accent-from))'
                    : 'none',
                  borderBottom: '1px solid rgb(var(--border) / 0.65)',
                }}
              >
                <td style={{ ...tdStyle, width: '3.6rem', position: 'sticky', left: 0, zIndex: 4, background: stickyCellBackground, backgroundClip: 'padding-box' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2.1rem',
                      height: '2.1rem',
                      borderRadius: '999px',
                      background: isCurrentUser
                        ? 'rgb(var(--accent-from) / 0.12)'
                        : 'rgb(var(--bg-subtle))',
                      color: isCurrentUser
                        ? 'rgb(var(--accent-from))'
                        : 'rgb(var(--fg-muted))',
                      border: isCurrentUser
                        ? '1px solid rgb(var(--accent-from) / 0.30)'
                        : '1px solid rgb(var(--border))',
                      fontFamily: 'var(--font-display, inherit)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {entry.rank}
                  </span>
                </td>

                <td
                  className="rank-table-user-col"
                  style={{
                    ...tdStyle,
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'rgb(var(--fg))',
                    position: 'sticky',
                    left: '3.6rem',
                    zIndex: 4,
                    background: stickyCellBackground,
                    backgroundClip: 'padding-box',
                    boxShadow: '4px 0 0 rgb(var(--bg-elevated)), 7px 0 10px rgb(0 0 0 / 0.10)',
                  }}
                >
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
                  <span
                    className="rank-table-user-initials"
                    title={entry.userName}
                    aria-label={entry.userName}
                  >
                    {getInitials(entry.userName)}
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

                <td
                  style={{
                    ...numberStyle,
                    color: 'rgb(var(--pitch))',
                    fontSize: '0.9rem',
                  }}
                >
                  {formatCurrency(prize)}
                </td>

                {spyEnabled ? (
                  <td style={tdStyle}>
                    <button
                      disabled={isCurrentUser || !entry.userId}
                      type="button"
                      onClick={() => entry.userId && onSpy({ userId: entry.userId, userName: entry.userName })}
                      aria-label={t('poolDetail.spy.action')}
                      title={t('poolDetail.spy.action')}
                      className="btn btn-ghost btn-icon"
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
                    </button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <div
        style={{
          padding: '0.55rem 0.75rem',
          borderTop: '1px solid rgb(var(--border))',
          background: 'rgb(var(--panel-muted-bg-solid))',
        }}
      />
    </div>
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

function getInitials(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '?';
  const displayName = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  const parts = displayName
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return trimmed.slice(0, 1).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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
  padding: '0.65rem 0.75rem',
  verticalAlign: 'middle',
  textAlign: 'center',
};

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
