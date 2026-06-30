import { BracketService } from './bracket.service';

const roundOf32 = Array.from({ length: 16 }, (_, index) => ({
  bracketMatchId: `all-pools-16th-finals-${index + 1}`,
  phase: '16th-finals',
  homeTeamId: `team-${index * 2 + 1}`,
  awayTeamId: `team-${index * 2 + 2}`,
}));

const roundOf16 = Array.from({ length: 8 }, (_, index) => ({
  bracketMatchId: `all-pools-8th-finals-${index + 1}`,
  phase: '8th-finals',
  homeTeamId: `team-${index * 2 + 1}`,
  awayTeamId: `team-${index * 2 + 2}`,
}));

describe('BracketService startup recalculation', () => {
  it('creates missing final phase matches before re-evaluating on bootstrap', async () => {
    const repository = {
      getBracketMatches: jest.fn().mockResolvedValue([]),
      createBracketMatch: jest.fn().mockImplementation((match) => Promise.resolve(match)),
      updateTeamEliminatedState: jest.fn().mockResolvedValue([]),
    };
    const service = new BracketService(repository as any);

    await service.onApplicationBootstrap();

    expect(repository.getBracketMatches).toHaveBeenCalledWith('all-pools');
    expect(repository.createBracketMatch).toHaveBeenCalledTimes(31);
    expect(repository.createBracketMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        bracketMatchId: 'all-pools-16th-finals-1',
        poolId: 'all-pools',
        phase: '16th-finals',
        matchNumber: 74,
        status: 'scheduled',
      })
    );
    expect(repository.createBracketMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        bracketMatchId: 'all-pools-finals-1',
        poolId: 'all-pools',
        phase: 'finals',
        matchNumber: 104,
        status: 'scheduled',
      })
    );
    expect(repository.updateTeamEliminatedState).toHaveBeenCalledWith([]);
  });

  it('fills missing matches in partially-created final phases without replacing existing rows', async () => {
    const existingMatches = [
      {
        bracketMatchId: 'all-pools-16th-finals-1',
        poolId: 'all-pools',
        phase: '16th-finals',
        matchNumber: 74,
        homeTeamId: 'team-a',
        awayTeamId: 'team-b',
      },
      {
        bracketMatchId: 'all-pools-quarter-finals-3',
        poolId: 'all-pools',
        phase: 'quarter-finals',
        matchNumber: 99,
        homeTeamId: 'team-c',
        awayTeamId: 'team-d',
      },
    ];
    const repository = {
      getBracketMatches: jest.fn().mockResolvedValue(existingMatches),
      createBracketMatch: jest.fn().mockImplementation((match) => Promise.resolve(match)),
      getAllBracketPredictionsForMatch: jest.fn().mockResolvedValue([]),
      listPools: jest.fn().mockResolvedValue([]),
      bulkUpdateBracketPredictionPoints: jest.fn().mockResolvedValue(undefined),
      updateTeamEliminatedState: jest.fn().mockResolvedValue([]),
    };
    const service = new BracketService(repository as any);

    await service.onApplicationBootstrap();

    expect(repository.createBracketMatch).toHaveBeenCalledTimes(29);
    expect(repository.createBracketMatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ bracketMatchId: 'all-pools-16th-finals-1' })
    );
    expect(repository.createBracketMatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ bracketMatchId: 'all-pools-quarter-finals-3' })
    );
    expect(repository.createBracketMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        bracketMatchId: 'all-pools-16th-finals-2',
        poolId: 'all-pools',
        phase: '16th-finals',
        matchNumber: 77,
        status: 'scheduled',
      })
    );
    expect(repository.createBracketMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        bracketMatchId: 'all-pools-finals-1',
        poolId: 'all-pools',
        phase: 'finals',
        matchNumber: 104,
        status: 'scheduled',
      })
    );
  });
});

describe('BracketService team elimination sync', () => {
  it('marks teams eliminated as soon as their bracket path has an advanced opponent', async () => {
    const realisticRoundOf16 = Array.from({ length: 8 }, (_, index) => ({
      bracketMatchId: `all-pools-8th-finals-${index + 1}`,
      phase: '8th-finals',
      homeTeamId: `team-${index * 4 + 1}`,
      awayTeamId: `team-${index * 4 + 3}`,
    }));
    const repository = {
      getBracketMatches: jest.fn().mockResolvedValue([...roundOf32, ...realisticRoundOf16]),
      getAllTeams: jest.fn().mockResolvedValue(
        Array.from({ length: 48 }, (_, index) => ({ teamId: `team-${index + 1}` }))
      ),
      updateTeamEliminatedState: jest.fn().mockResolvedValue([]),
    };
    const service = new BracketService(repository as any);

    await (service as any).syncTeamEliminationState();

    expect(repository.updateTeamEliminatedState).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...Array.from({ length: 16 }, (_, index) => `team-${index + 33}`),
        ...Array.from({ length: 8 }, (_, index) => `team-${index * 4 + 2}`),
        ...Array.from({ length: 8 }, (_, index) => `team-${index * 4 + 4}`),
      ])
    );
  });

  it('does not eliminate unknown teams before the first knockout phase is fully populated', async () => {
    const repository = {
      getBracketMatches: jest.fn().mockResolvedValue([
        ...roundOf32.slice(0, 15),
        {
          bracketMatchId: 'all-pools-16th-finals-16',
          phase: '16th-finals',
          homeTeamId: 'team-31',
          awayTeamId: '',
        },
      ]),
      updateTeamEliminatedState: jest.fn().mockResolvedValue([]),
    };
    const service = new BracketService(repository as any);

    await (service as any).syncTeamEliminationState();

    expect(repository.updateTeamEliminatedState).toHaveBeenCalledWith([]);
  });

  it('marks the final loser eliminated when the final result is known', async () => {
    const repository = {
      getBracketMatches: jest.fn().mockResolvedValue([
        {
          bracketMatchId: 'all-pools-finals-1',
          phase: 'finals',
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
          homeResult: 2,
          awayResult: 1,
        },
      ]),
      updateTeamEliminatedState: jest.fn().mockResolvedValue([]),
    };
    const service = new BracketService(repository as any);

    await (service as any).syncTeamEliminationState();

    expect(repository.updateTeamEliminatedState).toHaveBeenCalledWith(['team-2']);
  });
});

describe('BracketService final phase match materialization', () => {
  it('creates a missing bracket match when assigning the first real team', async () => {
    const createdMatch = {
      bracketMatchId: 'all-pools-quarter-finals-3',
      poolId: 'all-pools',
      phase: 'quarter-finals',
      matchNumber: 99,
      homeTeamId: 'team-a',
      homeTeamName: 'Team A',
    };
    const repository = {
      getBracketMatches: jest.fn().mockResolvedValue([]),
      createBracketMatch: jest.fn().mockResolvedValue(createdMatch),
      updateTeamEliminatedState: jest.fn().mockResolvedValue([]),
    };
    const service = new BracketService(repository as any);

    const result = await service.updateBracketMatchTeam(
      'all-pools-quarter-finals-3',
      'all-pools',
      'home',
      'team-a',
      'Team A'
    );

    expect(repository.createBracketMatch).toHaveBeenCalledWith({
      bracketMatchId: 'all-pools-quarter-finals-3',
      poolId: 'all-pools',
      phase: 'quarter-finals',
      matchNumber: 99,
      homeTeamId: 'team-a',
      homeTeamName: 'Team A',
      awayTeamId: undefined,
      awayTeamName: undefined,
      status: 'scheduled',
    });
    expect(repository.updateTeamEliminatedState).toHaveBeenCalledWith([]);
    expect(result).toBe(createdMatch);
  });
});

describe('BracketService final phase scoring', () => {
  const scoring = {
    bracketScoring: {
      exactPositionPoints: 10,
      correctTeamWrongPositionPoints: 3,
      tournamentWinnerPoints: 25,
    },
  };

  const evaluatedMatch = {
    bracketMatchId: 'all-pools-quarter-finals-1',
    phase: 'quarter-finals',
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
  };

  const phaseMatches = [
    evaluatedMatch,
    {
      bracketMatchId: 'all-pools-quarter-finals-2',
      phase: 'quarter-finals',
      homeTeamId: 'team-c',
      awayTeamId: 'team-d',
    },
  ];

  it('awards wrong-position points when a team is in another match box in the same round', async () => {
    const repository = {
      getAllBracketPredictionsForMatch: jest.fn().mockResolvedValue([
        {
          bracketPredictionId: 'prediction-1',
          poolId: 'pool-1',
          homeTeamId: 'team-a',
          awayTeamId: 'team-b',
        },
        {
          bracketPredictionId: 'prediction-2',
          poolId: 'pool-1',
          homeTeamId: 'team-b',
          awayTeamId: 'team-a',
        },
        {
          bracketPredictionId: 'prediction-3',
          poolId: 'pool-1',
          homeTeamId: 'team-c',
          awayTeamId: 'team-d',
        },
        {
          bracketPredictionId: 'prediction-4',
          poolId: 'pool-1',
          homeTeamId: 'team-z',
          awayTeamId: '',
        },
      ]),
      getBracketMatches: jest.fn().mockResolvedValue(phaseMatches),
      listPools: jest.fn().mockResolvedValue([{ poolId: 'pool-1', config: scoring }]),
      bulkUpdateBracketPredictionPoints: jest.fn().mockResolvedValue(undefined),
    };
    const service = new BracketService(repository as any);

    await (service as any).evaluateBracketPredictions(
      evaluatedMatch.bracketMatchId,
      evaluatedMatch,
      'pool-1'
    );

    expect(repository.getBracketMatches).toHaveBeenCalledWith(
      'all-pools',
      'quarter-finals'
    );
    expect(repository.bulkUpdateBracketPredictionPoints).toHaveBeenCalledWith([
      {
        bracketPredictionId: 'prediction-1',
        points: 20,
        homeTeamExactPosition: true,
        awayTeamExactPosition: true,
        homeTeamCorrectButWrongPosition: false,
        awayTeamCorrectButWrongPosition: false,
        tournamentWinnerCorrect: null,
      },
      {
        bracketPredictionId: 'prediction-2',
        points: 6,
        homeTeamExactPosition: false,
        awayTeamExactPosition: false,
        homeTeamCorrectButWrongPosition: true,
        awayTeamCorrectButWrongPosition: true,
        tournamentWinnerCorrect: null,
      },
      {
        bracketPredictionId: 'prediction-3',
        points: 6,
        homeTeamExactPosition: false,
        awayTeamExactPosition: false,
        homeTeamCorrectButWrongPosition: true,
        awayTeamCorrectButWrongPosition: true,
        tournamentWinnerCorrect: null,
      },
      {
        bracketPredictionId: 'prediction-4',
        points: 0,
        homeTeamExactPosition: false,
        awayTeamExactPosition: false,
        homeTeamCorrectButWrongPosition: false,
        awayTeamCorrectButWrongPosition: false,
        tournamentWinnerCorrect: null,
      },
    ]);
  });

  it('awards points for a known team even when the other real team is missing', async () => {
    const partialMatch = {
      bracketMatchId: 'all-pools-quarter-finals-1',
      phase: 'quarter-finals',
      homeTeamId: 'team-a',
      awayTeamId: '',
    };
    const repository = {
      getAllBracketPredictionsForMatch: jest.fn().mockResolvedValue([
        {
          bracketPredictionId: 'prediction-1',
          poolId: 'pool-1',
          homeTeamId: 'team-a',
          awayTeamId: '',
        },
        {
          bracketPredictionId: 'prediction-2',
          poolId: 'pool-1',
          homeTeamId: '',
          awayTeamId: '',
        },
      ]),
      getBracketMatches: jest.fn().mockResolvedValue([partialMatch]),
      listPools: jest.fn().mockResolvedValue([{ poolId: 'pool-1', config: scoring }]),
      bulkUpdateBracketPredictionPoints: jest.fn().mockResolvedValue(undefined),
    };
    const service = new BracketService(repository as any);

    await (service as any).evaluateBracketPredictions(
      partialMatch.bracketMatchId,
      partialMatch,
      'pool-1'
    );

    expect(repository.bulkUpdateBracketPredictionPoints).toHaveBeenCalledWith([
      {
        bracketPredictionId: 'prediction-1',
        points: 10,
        homeTeamExactPosition: true,
        awayTeamExactPosition: false,
        homeTeamCorrectButWrongPosition: false,
        awayTeamCorrectButWrongPosition: false,
        tournamentWinnerCorrect: null,
      },
      {
        bracketPredictionId: 'prediction-2',
        points: 0,
        homeTeamExactPosition: false,
        awayTeamExactPosition: false,
        homeTeamCorrectButWrongPosition: false,
        awayTeamCorrectButWrongPosition: false,
        tournamentWinnerCorrect: null,
      },
    ]);
  });
});
