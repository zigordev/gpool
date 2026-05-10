'use client';

import { useI18n } from "@/i18n/client";

interface RankingEntry {
  rank: number;
  userId: string;
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
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '540px',
        }}
      >
        <thead>
          <tr
            style={{
              background: 'rgb(var(--bg-subtle))',
              borderBottom: '1px solid rgb(var(--border))',
            }}
          >
            <th style={{ ...thStyle, width: '3.6rem', position: 'sticky', left: 0, zIndex: 3, background: 'rgb(var(--bg-subtle))' }}></th>
            <th style={{ ...thStyle, textAlign: 'left', minWidth: '10rem', position: 'sticky', left: '3.6rem', zIndex: 3, background: 'rgb(var(--bg-subtle))', boxShadow: '2px 0 4px rgb(0 0 0 / 0.08)' }}>{t('poolDetail.ranking.user')}</th>
            <th style={thStyle}>
              {t('poolDetail.ranking.groupPhasePoints')}
            </th>
            <th style={thStyle}>
              {t('poolDetail.ranking.finalPhasePoints')}
            </th>
            <th style={thStyle}>
              {t('poolDetail.ranking.playerPoints')}
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

            return (
              <tr
                key={`${entry.rank}-${entry.userName}`}
                style={{
                  background: isCurrentUser
                    ? 'linear-gradient(100deg, rgb(var(--accent-from) / 0.08), rgb(var(--accent-to) / 0.08))'
                    : 'transparent',
                  boxShadow: isCurrentUser
                    ? 'inset 3px 0 0 rgb(var(--accent-from))'
                    : 'none',
                  borderBottom: '1px solid rgb(var(--border) / 0.65)',
                }}
              >
                <td style={{ ...tdStyle, width: '3.6rem', position: 'sticky', left: 0, zIndex: 1, background: isCurrentUser ? 'rgb(var(--accent-from) / 0.08)' : 'rgb(var(--bg-elevated))' }}>
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
                  style={{
                    ...tdStyle,
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'rgb(var(--fg))',
                    position: 'sticky',
                    left: '3.6rem',
                    zIndex: 1,
                    background: isCurrentUser ? 'rgb(var(--accent-from) / 0.08)' : 'rgb(var(--bg-elevated))',
                    boxShadow: '2px 0 4px rgb(0 0 0 / 0.06)',
                    minWidth: '10rem',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.userName}
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
                      disabled={isCurrentUser}
                      type="button"
                      onClick={() => onSpy({ userId: entry.userId, userName: entry.userName })}
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
  background: 'rgb(var(--bg-subtle))',
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
