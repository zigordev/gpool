import type { PlayerPosition } from '@/types/playerPosition.type';
import type { PlayerStatKey } from '@/types/playerStatKey.type';

type ConfigNumberLike = number | string | null | undefined;

type PlayerScoringLike = {
  goal?: Partial<Record<PlayerPosition, ConfigNumberLike>>;
  penaltyGoal?: ConfigNumberLike;
  missedPenalty?: ConfigNumberLike;
  mvp?: ConfigNumberLike;
  penaltySaved?: ConfigNumberLike;
  shootoutPenaltySaved?: ConfigNumberLike;
  shootoutGoal?: ConfigNumberLike;
  shootoutMissedPenalty?: ConfigNumberLike;
  cleanSheet?: Partial<Record<PlayerPosition, ConfigNumberLike>>;
  assist?: Partial<Record<PlayerPosition, ConfigNumberLike>>;
  yellowCard?: ConfigNumberLike;
  redCard?: ConfigNumberLike;
};

function configuredNumber(value: ConfigNumberLike): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function playerStatScoringValue(
  scoring: PlayerScoringLike,
  position: PlayerPosition,
  stat: PlayerStatKey,
): number | null {
  switch (stat) {
    case 'goals':
      return configuredNumber(scoring.goal?.[position]);
    case 'penaltyGoals':
      return configuredNumber(scoring.penaltyGoal);
    case 'assists':
      return configuredNumber(scoring.assist?.[position]);
    case 'cleanSheets':
      return configuredNumber(scoring.cleanSheet?.[position]);
    case 'missedPenalties':
      return configuredNumber(scoring.missedPenalty);
    case 'mvps':
      return configuredNumber(scoring.mvp);
    case 'penaltiesSaved':
      return configuredNumber(scoring.penaltySaved);
    case 'shootoutPenaltiesSaved':
      return configuredNumber(scoring.shootoutPenaltySaved);
    case 'shootoutGoals':
      return configuredNumber(scoring.shootoutGoal);
    case 'shootoutMissedPenalties':
      return configuredNumber(scoring.shootoutMissedPenalty);
    case 'yellowCards':
      return configuredNumber(scoring.yellowCard);
    case 'redCards':
      return configuredNumber(scoring.redCard);
  }
}

export function isPlayerStatEnabled(
  scoring: PlayerScoringLike,
  position: PlayerPosition,
  stat: PlayerStatKey,
): boolean {
  const value = playerStatScoringValue(scoring, position, stat);
  return value === null || value !== 0;
}
