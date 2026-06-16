import { createHash } from 'node:crypto';
import type { TournamentRosterPosition } from './world-cup-2026-rosters';

const PLAYER_ID_NAMESPACE = 'gpool-world-cup-2026-player';

export function legacyPlayerSeedId(
  teamId: string,
  position: TournamentRosterPosition,
  playerName: string,
): string {
  const playerSlug = playerName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${teamId}-${position}-${playerSlug}`;
}

export function playerUuidFromLegacyId(legacyPlayerId: string): string {
  const hash = createHash('md5')
    .update(`${PLAYER_ID_NAMESPACE}:${legacyPlayerId}`)
    .digest('hex');

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
}

export function worldCupPlayerId(
  teamId: string,
  position: TournamentRosterPosition,
  playerName: string,
): string {
  return playerUuidFromLegacyId(legacyPlayerSeedId(teamId, position, playerName));
}
