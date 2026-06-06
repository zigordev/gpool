import { PlayerPosition } from '@/types/playerPosition.type';

export type PlayerSelectionLimits = Record<PlayerPosition, number>;

export const DEFAULT_PLAYER_SELECTION_LIMIT = 6;
export const MAX_PLAYER_SELECTION_LIMIT = 12;

export const DEFAULT_PLAYER_SELECTION_LIMITS: PlayerSelectionLimits = {
  goalkeeper: DEFAULT_PLAYER_SELECTION_LIMIT,
  defender: DEFAULT_PLAYER_SELECTION_LIMIT,
  midfielder: DEFAULT_PLAYER_SELECTION_LIMIT,
  forward: DEFAULT_PLAYER_SELECTION_LIMIT,
};

export function resolvePlayerSelectionLimits(value: unknown): PlayerSelectionLimits {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};

  return (Object.keys(DEFAULT_PLAYER_SELECTION_LIMITS) as PlayerPosition[])
    .reduce<PlayerSelectionLimits>((limits, position) => {
      const parsed = Number(source[position]);
      limits[position] =
        Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_PLAYER_SELECTION_LIMIT
          ? parsed
          : DEFAULT_PLAYER_SELECTION_LIMIT;
      return limits;
    }, { ...DEFAULT_PLAYER_SELECTION_LIMITS });
}
