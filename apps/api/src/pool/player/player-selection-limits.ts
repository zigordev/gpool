export const PLAYER_SELECTION_POSITIONS = [
  'goalkeeper',
  'defender',
  'midfielder',
  'forward',
] as const;

export type PlayerSelectionPosition = (typeof PLAYER_SELECTION_POSITIONS)[number];
export type PlayerSelectionLimits = Record<PlayerSelectionPosition, number>;

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

  return PLAYER_SELECTION_POSITIONS.reduce<PlayerSelectionLimits>((limits, position) => {
    const parsed = Number(source[position]);
    limits[position] =
      Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_PLAYER_SELECTION_LIMIT
        ? parsed
        : DEFAULT_PLAYER_SELECTION_LIMIT;
    return limits;
  }, { ...DEFAULT_PLAYER_SELECTION_LIMITS });
}

export function isSelectionWithinLimits(
  selection: { position?: unknown; slot?: unknown },
  limits: PlayerSelectionLimits,
): boolean {
  const position = selection.position as PlayerSelectionPosition;
  const slot = Number(selection.slot);
  return (
    PLAYER_SELECTION_POSITIONS.includes(position) &&
    Number.isInteger(slot) &&
    slot >= 1 &&
    slot <= limits[position]
  );
}
