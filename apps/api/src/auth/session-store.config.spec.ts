import { ConfigService } from '@nestjs/config';
import { buildSessionPoolConfig } from './session-store.config';

function configFrom(values: Record<string, string>): ConfigService {
  return {
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  } as unknown as ConfigService;
}

describe('buildSessionPoolConfig', () => {
  it('reads the same connection values the data layer uses', () => {
    const config = configFrom({
      DB_HOST: 'gpool-postgres',
      DB_PORT: '5432',
      DB_USER: 'gpool_admin',
      DB_PASSWORD: 'secret',
      DB_NAME: 'gpool',
    });

    expect(buildSessionPoolConfig(config)).toMatchObject({
      host: 'gpool-postgres',
      port: 5432,
      user: 'gpool_admin',
      password: 'secret',
      database: 'gpool',
    });
  });

  it('caps the pool so it does not compete with the data layer for connections', () => {
    expect(buildSessionPoolConfig(configFrom({})).max).toBe(4);
  });
});
