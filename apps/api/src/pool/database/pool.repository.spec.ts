import { PoolRepository } from './pool.repository';

describe('PoolRepository match player insights', () => {
  it('includes selected players from the match teams with zero-valued actions', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const repository = new PoolRepository({ query } as any);

    await repository.getPlayerSelectionsWithMatchStats(
      'pool-1',
      'group',
      'match-1',
      ['team-a', 'team-b'],
    );

    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('LEFT JOIN tournament_player_match_stats ms');
    expect(sql).toContain('COALESCE(ms.goals, 0)::int AS goals');
    expect(sql).toContain('p.team_id = ANY($4::text[])');
    expect(sql).not.toContain(') > 0');
    expect(params).toEqual([
      'pool-1',
      'group',
      'match-1',
      ['team-a', 'team-b'],
    ]);
  });
});
