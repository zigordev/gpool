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

describe('BracketService team elimination sync', () => {
  it('marks every team outside the deepest complete phase as eliminated', async () => {
    const repository = {
      getBracketMatches: jest.fn().mockResolvedValue([...roundOf32, ...roundOf16]),
      updateTeamEliminationState: jest.fn().mockResolvedValue([]),
    };
    const service = new BracketService(repository as any);

    await (service as any).syncTeamEliminationState();

    expect(repository.updateTeamEliminationState).toHaveBeenCalledWith(
      Array.from({ length: 16 }, (_, index) => `team-${index + 1}`)
    );
  });

  it('resets elimination state when no phase is fully populated', async () => {
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
      updateTeamEliminationState: jest.fn().mockResolvedValue([]),
    };
    const service = new BracketService(repository as any);

    await (service as any).syncTeamEliminationState();

    expect(repository.updateTeamEliminationState).toHaveBeenCalledWith([]);
  });
});
