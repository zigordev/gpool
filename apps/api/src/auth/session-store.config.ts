import { ConfigService } from '@nestjs/config';
import { PoolConfig } from 'pg';

export const SESSION_TABLE_NAME = 'user_sessions';

export function buildSessionPoolConfig(config: ConfigService): PoolConfig {
  return {
    host: config.get<string>('DB_HOST', 'localhost'),
    port: Number(config.get<string>('DB_PORT', '5432')),
    user: config.get<string>('DB_USER', 'app'),
    password: config.get<string>('DB_PASSWORD', 'app'),
    database: config.get<string>('DB_NAME', 'gpool'),
    max: 4,
  };
}
