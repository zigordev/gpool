import { vi } from 'vitest';
import { PlayerService } from './player.service';

describe('PlayerService third-place match actions', () => {
  it('records a player action against match 103 through the final-match flow', async () => {
    const repository = {
      getTournamentPlayer: vi.fn().mockResolvedValue({
        playerId: 'player-a',
        teamId: 'team-a',
      }),
      getTournamentMatch: vi.fn().mockResolvedValue({
        matchId: 'all-pools-third-place-1',
        homeTeamId: 'team-a',
        awayTeamId: 'team-b',
      }),
      incrementTournamentPlayerMatchStat: vi.fn().mockResolvedValue({
        playerId: 'player-a',
        goals: 1,
        matchStatValue: 1,
      }),
    };
    const service = new PlayerService(repository as any);

    const result = await service.updatePlayerStats(
      'all-pools',
      'player-a',
      {
        matchId: 'all-pools-third-place-1',
        matchType: 'final',
        stat: 'goals',
        delta: 1,
      },
      'admin'
    );

    expect(repository.getTournamentMatch).toHaveBeenCalledWith(
      'all-pools',
      'final',
      'all-pools-third-place-1'
    );
    expect(repository.incrementTournamentPlayerMatchStat).toHaveBeenCalledWith(
      'player-a',
      'final',
      'all-pools-third-place-1',
      'goals',
      1
    );
    expect(result).toEqual({ playerId: 'player-a', goals: 1, matchStatValue: 1 });
  });
});
