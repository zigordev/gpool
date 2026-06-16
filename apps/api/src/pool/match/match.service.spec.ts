import { MatchService } from './match.service';

describe('MatchService match insights', () => {
  it('uses canonical team names for final-phase match flags', async () => {
    const repository = {
      getPool: jest.fn().mockResolvedValue({
        poolId: 'pool-1',
        config: { deadline: Date.now() - 1_000 },
      }),
      getBracketMatches: jest.fn().mockResolvedValue([
        {
          bracketMatchId: 'final-match-1',
          homeTeamId: 'team-a',
          homeTeamName: 'Mexico',
          awayTeamId: 'team-b',
          awayTeamName: 'South Africa',
        },
      ]),
      getTeam: jest
        .fn()
        .mockResolvedValueOnce({ teamId: 'team-a', name: 'México' })
        .mockResolvedValueOnce({ teamId: 'team-b', name: 'Sudáfrica' }),
      getPoolMembers: jest.fn().mockResolvedValue([]),
      getAllBracketPredictionsForMatch: jest.fn().mockResolvedValue([]),
      getPlayerSelectionsWithMatchStats: jest.fn().mockResolvedValue([]),
    };
    const service = new MatchService(repository as any);

    const result = await service.getMatchInsights(
      'pool-1',
      'final',
      'final-match-1',
      'user-1',
      'admin',
    );

    expect(result.match).toEqual(
      expect.objectContaining({
        homeTeamName: 'México',
        awayTeamName: 'Sudáfrica',
      }),
    );
    expect(repository.getPlayerSelectionsWithMatchStats).toHaveBeenCalledWith(
      'pool-1',
      'final',
      'final-match-1',
      ['team-a', 'team-b'],
    );
  });

  it('returns selected players with zero actions for the teams in the match', async () => {
    const zeroActionPlayer = {
      userId: 'user-1',
      position: 'goalkeeper',
      slot: 1,
      playerId: 'player-1',
      teamId: 'team-a',
      teamName: 'Team A',
      name: 'Player One',
      goals: 0,
      penaltyGoals: 0,
      missedPenalties: 0,
      mvps: 0,
      penaltiesSaved: 0,
      shootoutPenaltiesSaved: 0,
      shootoutGoals: 0,
      shootoutMissedPenalties: 0,
      cleanSheets: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
    };
    const repository = {
      getPool: jest.fn().mockResolvedValue({
        poolId: 'pool-1',
        config: { deadline: Date.now() - 1_000 },
      }),
      getMatch: jest.fn().mockResolvedValue({
        matchId: 'match-1',
        homeTeamId: 'team-a',
        awayTeamId: 'team-b',
      }),
      getPoolMembers: jest.fn().mockResolvedValue([
        { userId: 'user-1', userName: 'User One', status: 'active' },
      ]),
      getAllPredictionsForMatch: jest.fn().mockResolvedValue([]),
      getPlayerSelectionsWithMatchStats: jest
        .fn()
        .mockResolvedValue([zeroActionPlayer]),
    };
    const service = new MatchService(repository as any);

    const result = await service.getMatchInsights(
      'pool-1',
      'group',
      'match-1',
      'user-1',
      'admin',
    );

    expect(repository.getPlayerSelectionsWithMatchStats).toHaveBeenCalledWith(
      'pool-1',
      'group',
      'match-1',
      ['team-a', 'team-b'],
    );
    expect(result.members[0].playerActions).toEqual([
      expect.objectContaining({
        playerId: 'player-1',
        goals: 0,
        points: 0,
      }),
    ]);
  });
});
