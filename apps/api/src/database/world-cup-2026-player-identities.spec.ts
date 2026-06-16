import {
  legacyPlayerSeedId,
  playerUuidFromLegacyId,
  worldCupPlayerId,
} from './world-cup-2026-player-identities';

describe('World Cup 2026 player identities', () => {
  it('generates stable UUID player IDs from legacy seed IDs', () => {
    const legacyId = legacyPlayerSeedId('A1', 'forward', 'Raúl Jiménez');

    expect(legacyId).toBe('A1-forward-raul-jimenez');
    expect(playerUuidFromLegacyId(legacyId)).toBe('c307791b-b0e8-b420-bb56-ade67fdfa232');
    expect(worldCupPlayerId('A1', 'forward', 'Raúl Jiménez')).toBe(
      'c307791b-b0e8-b420-bb56-ade67fdfa232',
    );
  });
});
