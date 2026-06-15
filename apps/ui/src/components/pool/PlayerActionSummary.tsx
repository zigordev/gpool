'use client';

import { type ReactNode } from 'react';
import { FaFutbol, FaMagic, FaShieldAlt, FaStar } from 'react-icons/fa';
import { GiGoalKeeper } from 'react-icons/gi';
import { IoMdCloseCircle } from 'react-icons/io';
import { LuRectangleVertical } from 'react-icons/lu';
import { resolvePlayerInfoScoring } from '@/components/pool/PoolInfoSections';
import { isPlayerStatEnabled } from '@/lib/player-stat-visibility';
import { PlayerPosition } from '@/types/playerPosition.type';
import { PlayerStatKey } from '@/types/playerStatKey.type';
import { TournamentPlayer } from '@/types/tournamentPlayer.interface';
import { useI18n } from '@/i18n/client';

type ActionGroup = 'match' | 'penalty' | 'shootout';

export function PlayerActionSummary({ player, labels, position, scoring, compact = false }: Readonly<{
  player: Pick<TournamentPlayer, 'goals' | 'penaltyGoals' | 'missedPenalties' | 'mvps' | 'penaltiesSaved' | 'shootoutPenaltiesSaved' | 'shootoutGoals' | 'shootoutMissedPenalties' | 'cleanSheets' | 'assists' | 'yellowCards' | 'redCards'>;
  labels: { goals: string; penaltyGoals: string; missedPenalties: string; mvps: string; penaltiesSaved: string; shootoutPenaltiesSaved: string; shootoutGoals: string; shootoutMissedPenalties: string; cleanSheets: string; assists: string; yellowCards: string; redCards: string };
  position: PlayerPosition;
  scoring: ReturnType<typeof resolvePlayerInfoScoring>;
  compact?: boolean;
}>) {
  const { t } = useI18n();
  const actions: Array<{ key: PlayerStatKey; group: ActionGroup; value: number; label: string; icon: ReactNode }> = [
    { key: 'goals', group: 'match', value: player.goals || 0, label: labels.goals, icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} size="17" /> },
    { key: 'assists', group: 'match', value: player.assists || 0, label: labels.assists, icon: <FaMagic style={{ color: 'rgb(var(--fg))' }} size="17" /> },
    { key: 'mvps', group: 'match', value: player.mvps || 0, label: labels.mvps, icon: <FaStar style={{ color: 'rgb(var(--fg))' }} size="17" /> },
    { key: 'cleanSheets', group: 'match', value: player.cleanSheets || 0, label: labels.cleanSheets, icon: <FaShieldAlt style={{ color: 'rgb(var(--fg))' }} size="17" /> },
    { key: 'yellowCards', group: 'match', value: player.yellowCards || 0, label: labels.yellowCards, icon: <LuRectangleVertical style={{ color: '#D4A017', fill: '#D4A017' }} size="17" /> },
    { key: 'redCards', group: 'match', value: player.redCards || 0, label: labels.redCards, icon: <LuRectangleVertical style={{ color: 'rgb(var(--live))', fill: 'rgb(var(--live))' }} size="17" /> },
    { key: 'penaltyGoals', group: 'penalty', value: player.penaltyGoals || 0, label: labels.penaltyGoals, icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} size="17" /> },
    { key: 'penaltiesSaved', group: 'penalty', value: player.penaltiesSaved || 0, label: labels.penaltiesSaved, icon: <GiGoalKeeper style={{ color: 'rgb(var(--fg))' }} size="18" /> },
    { key: 'missedPenalties', group: 'penalty', value: player.missedPenalties || 0, label: labels.missedPenalties, icon: <IoMdCloseCircle style={{ color: 'rgb(var(--live))' }} size="17" /> },
    { key: 'shootoutGoals', group: 'shootout', value: player.shootoutGoals || 0, label: labels.shootoutGoals, icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} size="17" /> },
    { key: 'shootoutPenaltiesSaved', group: 'shootout', value: player.shootoutPenaltiesSaved || 0, label: labels.shootoutPenaltiesSaved, icon: <GiGoalKeeper style={{ color: 'rgb(var(--fg))' }} size="18" /> },
    { key: 'shootoutMissedPenalties', group: 'shootout', value: player.shootoutMissedPenalties || 0, label: labels.shootoutMissedPenalties, icon: <IoMdCloseCircle style={{ color: 'rgb(var(--live))' }} size="17" /> },
  ];
  const visibleActions = actions.filter((item) => isPlayerStatEnabled(scoring, position, item.key));
  if (visibleActions.length === 0) return null;
  const groups: Array<{ key: ActionGroup; label: string }> = [
    { key: 'match', label: t('poolDetail.players.actionGroups.match') },
    { key: 'penalty', label: t('poolDetail.players.actionGroups.penalty') },
    { key: 'shootout', label: t('poolDetail.players.actionGroups.shootout') },
  ];
  const visibleGroups = groups.filter((group) =>
    visibleActions.some((item) => item.group === group.key),
  );

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
        {visibleGroups.map((group) => {
          const groupActions = visibleActions.filter((item) => item.group === group.key);
          return (
            <span
              key={group.key}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', flexWrap: 'wrap' }}
            >
              <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgb(var(--fg-subtle))', textTransform: 'uppercase' }}>
                {group.label}
              </span>
              {groupActions.map((item) => {
                const isZero = item.value === 0;
                return (
                  <span
                    key={item.key}
                    title={`${item.label}: ${item.value}`}
                    aria-label={`${item.label}: ${item.value}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.16rem', padding: '0.08rem 0.28rem', borderRadius: '999px', background: isZero ? 'transparent' : 'rgb(var(--bg-subtle) / 0.92)', border: isZero ? '1px dashed rgb(var(--border))' : '1px solid rgb(var(--border-subtle))', color: isZero ? 'rgb(var(--fg-subtle))' : 'rgb(var(--fg))', fontSize: '0.58rem', fontWeight: 800, lineHeight: 1, opacity: isZero ? 0.18 : 1, transition: 'opacity 0.2s ease', filter: isZero ? 'grayscale(100%) brightness(0.8)' : 'none' }}
                  >
                    {item.icon}
                    <span style={{ fontVariantNumeric: 'tabular-nums', opacity: isZero ? 0.3 : 1 }}>{item.value}</span>
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '0.3rem', marginTop: '0.35rem' }}>
      {visibleGroups.map((group, groupIndex) => {
        const groupActions = visibleActions.filter((item) => item.group === group.key);
        if (groupActions.length === 0) return null;
        return (
          <div
            key={group.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.22rem',
              flexWrap: 'wrap',
              paddingTop: groupIndex > 0 ? '0.25rem' : 0,
              borderTop: groupIndex > 0 ? '1px solid rgb(var(--border-subtle) / 0.7)' : undefined,
            }}
          >
            <span style={{ width: '100%', fontSize: '0.52rem', fontWeight: 800, color: 'rgb(var(--fg-subtle))', textTransform: 'uppercase' }}>
              {group.label}
            </span>
            {groupActions.map((item) => {
              const isZero = item.value === 0;
              return (
                <span
                  key={item.key}
                  title={`${item.label}: ${item.value}`}
                  aria-label={`${item.label}: ${item.value}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.18rem', padding: '0.1rem 0.32rem', borderRadius: '999px', background: isZero ? 'transparent' : 'rgb(var(--bg-subtle) / 0.92)', border: isZero ? '1px dashed rgb(var(--border))' : '1px solid rgb(var(--border-subtle))', color: isZero ? 'rgb(var(--fg-subtle))' : 'rgb(var(--fg))', fontSize: '0.6rem', fontWeight: 800, lineHeight: 1, opacity: isZero ? 0.18 : 1, transition: 'opacity 0.2s ease', filter: isZero ? 'grayscale(100%) brightness(0.8)' : 'none' }}
                >
                  {item.icon}
                  <span style={{ fontVariantNumeric: 'tabular-nums', opacity: isZero ? 0.3 : 1, }}>
                    {item.value}
                  </span>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
