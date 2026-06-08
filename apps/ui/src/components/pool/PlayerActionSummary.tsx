import { type ReactNode } from 'react';
import { FaFutbol, FaMagic, FaShieldAlt, FaStar } from 'react-icons/fa';
import { IoMdCloseCircle } from 'react-icons/io';
import { LuRectangleVertical } from 'react-icons/lu';
import { PiBoxingGlove } from 'react-icons/pi';
import { resolvePlayerInfoScoring } from '@/components/pool/PoolInfoSections';
import { isPlayerStatEnabled } from '@/lib/player-stat-visibility';
import { PlayerPosition } from '@/types/playerPosition.type';
import { PlayerStatKey } from '@/types/playerStatKey.type';
import { TournamentPlayer } from '@/types/tournamentPlayer.interface';

export function PlayerActionSummary({ player, labels, position, scoring }: Readonly<{
  player: Pick<TournamentPlayer, 'goals' | 'missedPenalties' | 'mvps' | 'penaltiesSaved' | 'cleanSheets' | 'assists' | 'yellowCards' | 'redCards'>;
  labels: { goals: string; missedPenalties: string; mvps: string; penaltiesSaved: string; cleanSheets: string; assists: string; yellowCards: string; redCards: string };
  position: PlayerPosition;
  scoring: ReturnType<typeof resolvePlayerInfoScoring>;
}>) {
  const actions: Array<{ key: PlayerStatKey; value: number; label: string; icon: ReactNode }> = [
    { key: 'goals', value: player.goals || 0, label: labels.goals, icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} size="17" /> },
    { key: 'assists', value: player.assists || 0, label: labels.assists, icon: <FaMagic style={{ color: 'rgb(var(--fg))' }} size="17" /> },
    { key: 'mvps', value: player.mvps || 0, label: labels.mvps, icon: <FaStar style={{ color: 'rgb(var(--fg))' }} size="17" /> },
    { key: 'penaltiesSaved', value: player.penaltiesSaved || 0, label: labels.penaltiesSaved, icon: <PiBoxingGlove style={{ color: 'rgb(var(--fg))' }} size="17" /> },
    { key: 'cleanSheets', value: player.cleanSheets || 0, label: labels.cleanSheets, icon: <FaShieldAlt style={{ color: 'rgb(var(--fg))' }} size="17" /> },
    { key: 'yellowCards', value: player.yellowCards || 0, label: labels.yellowCards, icon: <LuRectangleVertical style={{ color: 'yellow', fill: 'yellow' }} size="17" /> },
    { key: 'redCards', value: player.redCards || 0, label: labels.redCards, icon: <LuRectangleVertical style={{ color: 'red', fill: 'red' }} size="17" /> },
    { key: 'missedPenalties', value: player.missedPenalties || 0, label: labels.missedPenalties, icon: <IoMdCloseCircle style={{ color: 'red' }} size="17" /> },
  ];
  const visibleActions = actions.filter((item) => isPlayerStatEnabled(scoring, position, item.key));
  if (visibleActions.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.22rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
      {visibleActions.map((item) => {
        const isZero = item.value === 0;
        return (
          <span
            key={item.key}
            title={`${item.label}: ${item.value}`}
            aria-label={`${item.label}: ${item.value}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.18rem', padding: '0.1rem 0.32rem', borderRadius: '999px', background: isZero ? 'transparent' : 'rgb(var(--bg-subtle) / 0.92)', border: isZero ? '1px dashed rgb(var(--border-subtle))' : '1px solid rgb(var(--border-subtle))', color: isZero ? 'rgb(var(--fg-subtle))' : 'rgb(var(--fg))', opacity: isZero ? 0.5 : 1, fontSize: '0.6rem', fontWeight: 800, lineHeight: 1 }}
          >
            {item.icon}
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{item.value}</span>
          </span>
        );
      })}
    </div>
  );
}
