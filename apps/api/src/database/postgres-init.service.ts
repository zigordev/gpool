import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PostgresService } from './postgres.service';
import { worldCupPlayerId } from './world-cup-2026-player-identities';
import { WORLD_CUP_2026_ROSTERS, type TournamentRosterPosition } from './world-cup-2026-rosters';

const TOURNAMENT_ROSTER_POSITIONS: readonly TournamentRosterPosition[] = [
  'goalkeeper',
  'defender',
  'midfielder',
  'forward',
];
const TOURNAMENT_SQUAD_SIZE = 26;
const POSTGRES_INITIALIZATION_LOCK_ID = 2_026_061_501;

@Injectable()
export class PostgresInitService implements OnModuleInit {
  private readonly logger = new Logger(PostgresInitService.name);

  constructor(private readonly postgres: PostgresService) {}

  async onModuleInit(): Promise<void> {
    const lockClient = await this.postgres.getClient();
    let lockAcquired = false;
    try {
      await lockClient.query('SELECT pg_advisory_lock($1::bigint)', [
        POSTGRES_INITIALIZATION_LOCK_ID,
      ]);
      lockAcquired = true;
      await this.ensureSchema();
      await this.seedTeamsAndMatches();
      await this.seedBracketMatches();
    } finally {
      try {
        if (lockAcquired) {
          await lockClient.query('SELECT pg_advisory_unlock($1::bigint)', [
            POSTGRES_INITIALIZATION_LOCK_ID,
          ]);
        }
      } finally {
        lockClient.release();
      }
    }
  }

  private async ensureSchema(): Promise<void> {
    await this.postgres.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        picture TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'user',
        locale TEXT NOT NULL DEFAULT 'es',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'es';

      CREATE TABLE IF NOT EXISTS pools (
        pool_id UUID PRIMARY KEY,
        admin_user_id UUID NOT NULL,
        admin_name TEXT NOT NULL DEFAULT '',
        admin_email TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        config JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at BIGINT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pools_admin_user_id ON pools(admin_user_id);

      CREATE TABLE IF NOT EXISTS pool_memberships (
        pool_id UUID NOT NULL REFERENCES pools(pool_id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'active',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_email TEXT NOT NULL DEFAULT '',
        user_name TEXT NOT NULL DEFAULT '',
        config JSONB NOT NULL DEFAULT '{}'::jsonb,
        PRIMARY KEY (pool_id, user_id)
      );
      ALTER TABLE pool_memberships ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;
      CREATE INDEX IF NOT EXISTS idx_pool_memberships_user_id ON pool_memberships(user_id);

      CREATE TABLE IF NOT EXISTS teams (
        team_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        group_id TEXT NOT NULL,
        code TEXT,
        fair_play_points INTEGER NOT NULL DEFAULT 0,
        fifa_ranking INTEGER NOT NULL DEFAULT 999
      );
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS fair_play_points INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS fifa_ranking INTEGER NOT NULL DEFAULT 999;
      ALTER TABLE teams DROP COLUMN IF EXISTS fifa_ranking_points;
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'teams_fair_play_points_non_positive'
            AND conrelid = 'teams'::regclass
        ) THEN
          ALTER TABLE teams
          ADD CONSTRAINT teams_fair_play_points_non_positive CHECK (fair_play_points <= 0);
        END IF;
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'teams_fifa_ranking_positive'
            AND conrelid = 'teams'::regclass
        ) THEN
          ALTER TABLE teams
          ADD CONSTRAINT teams_fifa_ranking_positive CHECK (fifa_ranking > 0);
        END IF;
      END
      $$;
      CREATE INDEX IF NOT EXISTS idx_teams_group_id ON teams(group_id);

      CREATE TABLE IF NOT EXISTS tournament_players (
        player_id UUID PRIMARY KEY,
        team_id TEXT NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
        team_name TEXT NOT NULL,
        name TEXT NOT NULL,
        position TEXT NOT NULL CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
        image_url TEXT NOT NULL DEFAULT '',
        country_code TEXT NOT NULL DEFAULT '',
        flag_emoji TEXT NOT NULL DEFAULT '',
        created_at BIGINT NOT NULL,
        updated_at BIGINT
      );
      CREATE INDEX IF NOT EXISTS idx_tournament_players_position ON tournament_players(position);
      CREATE INDEX IF NOT EXISTS idx_tournament_players_team_id ON tournament_players(team_id);

      CREATE TABLE IF NOT EXISTS tournament_player_stats (
        player_id UUID PRIMARY KEY REFERENCES tournament_players(player_id) ON DELETE CASCADE,
        goals INTEGER NOT NULL DEFAULT 0,
        penalty_goals INTEGER NOT NULL DEFAULT 0,
        missed_penalties INTEGER NOT NULL DEFAULT 0,
        mvps INTEGER NOT NULL DEFAULT 0,
        penalties_saved INTEGER NOT NULL DEFAULT 0,
        shootout_penalties_saved INTEGER NOT NULL DEFAULT 0,
        shootout_goals INTEGER NOT NULL DEFAULT 0,
        shootout_missed_penalties INTEGER NOT NULL DEFAULT 0,
        clean_sheets INTEGER NOT NULL DEFAULT 0,
        assists INTEGER NOT NULL DEFAULT 0,
        yellow_cards INTEGER NOT NULL DEFAULT 0,
        red_cards INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
      ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS penalty_goals INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS shootout_penalties_saved INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS shootout_goals INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS shootout_missed_penalties INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS clean_sheets INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS assists INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS yellow_cards INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS red_cards INTEGER NOT NULL DEFAULT 0;

      CREATE TABLE IF NOT EXISTS tournament_player_match_stats (
        match_type TEXT NOT NULL CHECK (match_type IN ('group', 'final')),
        match_id TEXT NOT NULL,
        player_id UUID NOT NULL REFERENCES tournament_players(player_id) ON DELETE CASCADE,
        goals INTEGER NOT NULL DEFAULT 0,
        penalty_goals INTEGER NOT NULL DEFAULT 0,
        missed_penalties INTEGER NOT NULL DEFAULT 0,
        mvps INTEGER NOT NULL DEFAULT 0,
        penalties_saved INTEGER NOT NULL DEFAULT 0,
        shootout_penalties_saved INTEGER NOT NULL DEFAULT 0,
        shootout_goals INTEGER NOT NULL DEFAULT 0,
        shootout_missed_penalties INTEGER NOT NULL DEFAULT 0,
        clean_sheets INTEGER NOT NULL DEFAULT 0,
        assists INTEGER NOT NULL DEFAULT 0,
        yellow_cards INTEGER NOT NULL DEFAULT 0,
        red_cards INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        PRIMARY KEY (match_type, match_id, player_id)
      );
      CREATE INDEX IF NOT EXISTS idx_tournament_player_match_stats_player
        ON tournament_player_match_stats(player_id);
      CREATE INDEX IF NOT EXISTS idx_tournament_player_match_stats_match
        ON tournament_player_match_stats(match_type, match_id);

      CREATE TABLE IF NOT EXISTS tournament_player_awards (
        award TEXT NOT NULL CHECK (award IN ('golden_boot', 'tournament_mvp')),
        player_id UUID NOT NULL REFERENCES tournament_players(player_id) ON DELETE CASCADE,
        updated_at BIGINT NOT NULL,
        PRIMARY KEY (award, player_id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_player_awards_single_mvp
        ON tournament_player_awards(award)
        WHERE award = 'tournament_mvp';

      CREATE TABLE IF NOT EXISTS pool_player_selections (
        pool_id UUID NOT NULL,
        user_id UUID NOT NULL,
        position TEXT NOT NULL CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
        slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 12),
        player_id UUID NOT NULL REFERENCES tournament_players(player_id) ON DELETE CASCADE,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        PRIMARY KEY (pool_id, user_id, position, slot),
        UNIQUE (pool_id, user_id, player_id)
      );
      ALTER TABLE pool_player_selections DROP CONSTRAINT IF EXISTS pool_player_selections_slot_check;
      ALTER TABLE pool_player_selections ADD CONSTRAINT pool_player_selections_slot_check CHECK (slot BETWEEN 1 AND 12);
      CREATE INDEX IF NOT EXISTS idx_pool_player_selections_user_pool ON pool_player_selections(user_id, pool_id);

      CREATE TABLE IF NOT EXISTS pool_player_award_selections (
        pool_id UUID NOT NULL,
        user_id UUID NOT NULL,
        award TEXT NOT NULL CHECK (award IN ('golden_boot', 'tournament_mvp')),
        player_id UUID NOT NULL REFERENCES tournament_players(player_id) ON DELETE CASCADE,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        PRIMARY KEY (pool_id, user_id, award)
      );
      CREATE INDEX IF NOT EXISTS idx_pool_player_award_selections_user_pool ON pool_player_award_selections(user_id, pool_id);

      CREATE TABLE IF NOT EXISTS group_phase_matches (
        match_id TEXT PRIMARY KEY,
        pool_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        home_team_id TEXT NOT NULL,
        away_team_id TEXT NOT NULL,
        home_team_name TEXT NOT NULL,
        away_team_name TEXT NOT NULL,
        match_number INTEGER,
        scheduled_at TIMESTAMPTZ NOT NULL,
        phase TEXT NOT NULL DEFAULT 'group',
        status TEXT NOT NULL DEFAULT 'scheduled',
        home_result INTEGER,
        away_result INTEGER,
        created_at BIGINT NOT NULL
      );
      ALTER TABLE group_phase_matches DROP COLUMN IF EXISTS deadline;
      ALTER TABLE group_phase_matches ADD COLUMN IF NOT EXISTS match_number INTEGER;
      CREATE INDEX IF NOT EXISTS idx_group_phase_matches_pool_id ON group_phase_matches(pool_id);
      CREATE INDEX IF NOT EXISTS idx_group_phase_matches_pool_group ON group_phase_matches(pool_id, group_id);
      CREATE INDEX IF NOT EXISTS idx_group_phase_matches_pool_number ON group_phase_matches(pool_id, match_number);

      CREATE TABLE IF NOT EXISTS group_phase_predictions (
        prediction_id UUID PRIMARY KEY,
        pool_id UUID NOT NULL,
        match_id TEXT NOT NULL,
        user_id UUID NOT NULL,
        home_score INTEGER NOT NULL,
        away_score INTEGER NOT NULL,
        is_correct BOOLEAN,
        is_exact_match BOOLEAN,
        points INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        evaluated_at BIGINT
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_group_phase_predictions_unique ON group_phase_predictions(pool_id, match_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_group_phase_predictions_user_pool ON group_phase_predictions(user_id, pool_id);
      CREATE INDEX IF NOT EXISTS idx_group_phase_predictions_match_id ON group_phase_predictions(match_id);
      CREATE INDEX IF NOT EXISTS idx_group_phase_predictions_pool_id ON group_phase_predictions(pool_id);

      CREATE TABLE IF NOT EXISTS final_phase_matches (
        bracket_match_id TEXT PRIMARY KEY,
        pool_id TEXT NOT NULL,
        phase TEXT NOT NULL,
        match_number INTEGER NOT NULL,
        home_team_id TEXT,
        home_team_name TEXT,
        away_team_id TEXT,
        away_team_name TEXT,
        home_source_label TEXT,
        away_source_label TEXT,
        home_result INTEGER,
        away_result INTEGER,
        scheduled_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'scheduled',
        created_at BIGINT NOT NULL,
        updated_at BIGINT
      );
      ALTER TABLE final_phase_matches ADD COLUMN IF NOT EXISTS home_source_label TEXT;
      ALTER TABLE final_phase_matches ADD COLUMN IF NOT EXISTS away_source_label TEXT;
      CREATE INDEX IF NOT EXISTS idx_final_phase_matches_pool_phase ON final_phase_matches(pool_id, phase);

      CREATE TABLE IF NOT EXISTS final_phase_predictions (
        bracket_prediction_id UUID PRIMARY KEY,
        pool_id UUID NOT NULL,
        bracket_match_id TEXT NOT NULL,
        user_id UUID NOT NULL,
        home_team_id TEXT,
        home_team_name TEXT,
        away_team_id TEXT,
        away_team_name TEXT,
        points INTEGER NOT NULL DEFAULT 0,
        is_evaluated BOOLEAN NOT NULL DEFAULT FALSE,
        home_team_exact_position BOOLEAN,
        away_team_exact_position BOOLEAN,
        home_team_correct_but_wrong_position BOOLEAN,
        away_team_correct_but_wrong_position BOOLEAN,
        predicted_winner_team_id TEXT,
        predicted_winner_team_name TEXT,
        tournament_winner_correct BOOLEAN,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        evaluated_at BIGINT
      );
      ALTER TABLE final_phase_predictions ADD COLUMN IF NOT EXISTS predicted_winner_team_id TEXT;
      ALTER TABLE final_phase_predictions ADD COLUMN IF NOT EXISTS predicted_winner_team_name TEXT;
      ALTER TABLE final_phase_predictions ADD COLUMN IF NOT EXISTS tournament_winner_correct BOOLEAN;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_final_phase_predictions_unique ON final_phase_predictions(pool_id, bracket_match_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_final_phase_predictions_user_pool ON final_phase_predictions(user_id, pool_id);
      CREATE INDEX IF NOT EXISTS idx_final_phase_predictions_match_id ON final_phase_predictions(bracket_match_id);
      CREATE INDEX IF NOT EXISTS idx_final_phase_predictions_pool_id ON final_phase_predictions(pool_id);

      CREATE TABLE IF NOT EXISTS notifications (
        notification_id UUID PRIMARY KEY,
        user_id UUID,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT,
        content TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at BIGINT NOT NULL,
        sent_at BIGINT,
        error_message TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_status_created ON notifications(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON notifications((metadata->>'eventId'));
    `);

    await this.migrateEntityIdsToUuid();
    await this.migratePredictionIdsToUuid();
    await this.migrateTournamentPlayerIdsToUuid();
    this.logger.log('Postgres schema verified');
  }

  private uuidExpressionForTextId(columnSql: string, namespace: string): string {
    return `
      CASE
        WHEN ${columnSql} ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN ${columnSql}::uuid
        ELSE (
          substring(md5('${namespace}:' || ${columnSql}) from 1 for 8) || '-' ||
          substring(md5('${namespace}:' || ${columnSql}) from 9 for 4) || '-' ||
          substring(md5('${namespace}:' || ${columnSql}) from 13 for 4) || '-' ||
          substring(md5('${namespace}:' || ${columnSql}) from 17 for 4) || '-' ||
          substring(md5('${namespace}:' || ${columnSql}) from 21 for 12)
        )::uuid
      END
    `;
  }

  private async migrateEntityIdsToUuid(): Promise<void> {
    const client = await this.postgres.getClient();
    try {
      const columnTypes = await client.query(
        `
          SELECT table_name, column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND (
              (table_name = 'users' AND column_name = 'user_id')
              OR (table_name = 'pools' AND column_name IN ('pool_id', 'admin_user_id'))
              OR (table_name = 'notifications' AND column_name = 'notification_id')
            )
        `,
      );
      const typeByColumn = new Map(
        columnTypes.rows.map((row: any) => [`${row.table_name}.${row.column_name}`, row.data_type]),
      );
      if (
        typeByColumn.get('users.user_id') === 'uuid' &&
        typeByColumn.get('pools.pool_id') === 'uuid' &&
        typeByColumn.get('pools.admin_user_id') === 'uuid' &&
        typeByColumn.get('notifications.notification_id') === 'uuid'
      ) {
        return;
      }

      await client.query('BEGIN');
      await client.query(`
        CREATE TEMP TABLE user_id_migration AS
        SELECT DISTINCT
          old_id,
          ${this.uuidExpressionForTextId('old_id', 'gpool-user')} AS new_id
        FROM (
          SELECT user_id::text AS old_id FROM users
          UNION
          SELECT admin_user_id::text AS old_id FROM pools
          UNION
          SELECT user_id::text AS old_id FROM pool_memberships
          UNION
          SELECT user_id::text AS old_id FROM pool_player_selections
          UNION
          SELECT user_id::text AS old_id FROM pool_player_award_selections
          UNION
          SELECT user_id::text AS old_id FROM group_phase_predictions
          UNION
          SELECT user_id::text AS old_id FROM final_phase_predictions
          UNION
          SELECT user_id::text AS old_id FROM notifications WHERE user_id IS NOT NULL
        ) ids;

        CREATE TEMP TABLE pool_id_migration AS
        SELECT DISTINCT
          old_id,
          ${this.uuidExpressionForTextId('old_id', 'gpool-pool')} AS new_id
        FROM (
          SELECT pool_id::text AS old_id FROM pools
          UNION
          SELECT pool_id::text AS old_id FROM pool_memberships
          UNION
          SELECT pool_id::text AS old_id FROM pool_player_selections
          UNION
          SELECT pool_id::text AS old_id FROM pool_player_award_selections
          UNION
          SELECT pool_id::text AS old_id FROM group_phase_predictions
          UNION
          SELECT pool_id::text AS old_id FROM final_phase_predictions
        ) ids;

        CREATE TEMP TABLE notification_id_migration AS
        SELECT
          notification_id::text AS old_id,
          ${this.uuidExpressionForTextId('notification_id::text', 'gpool-notification')} AS new_id
        FROM notifications;
      `);

      await client.query(`
        ALTER TABLE pool_memberships DROP CONSTRAINT IF EXISTS pool_memberships_pool_id_fkey;

        UPDATE users target
        SET user_id = migration.new_id::text
        FROM user_id_migration migration
        WHERE target.user_id::text = migration.old_id
          AND migration.old_id <> migration.new_id::text;

        UPDATE pools target
        SET
          pool_id = pool_migration.new_id::text,
          admin_user_id = user_migration.new_id::text
        FROM pool_id_migration pool_migration, user_id_migration user_migration
        WHERE target.pool_id::text = pool_migration.old_id
          AND target.admin_user_id::text = user_migration.old_id
          AND (
            pool_migration.old_id <> pool_migration.new_id::text
            OR user_migration.old_id <> user_migration.new_id::text
          );

        UPDATE pool_memberships target
        SET
          pool_id = pool_migration.new_id::text,
          user_id = user_migration.new_id::text
        FROM pool_id_migration pool_migration, user_id_migration user_migration
        WHERE target.pool_id::text = pool_migration.old_id
          AND target.user_id::text = user_migration.old_id
          AND (
            pool_migration.old_id <> pool_migration.new_id::text
            OR user_migration.old_id <> user_migration.new_id::text
          );

        UPDATE pool_player_selections target
        SET
          pool_id = pool_migration.new_id::text,
          user_id = user_migration.new_id::text
        FROM pool_id_migration pool_migration, user_id_migration user_migration
        WHERE target.pool_id::text = pool_migration.old_id
          AND target.user_id::text = user_migration.old_id
          AND (
            pool_migration.old_id <> pool_migration.new_id::text
            OR user_migration.old_id <> user_migration.new_id::text
          );

        UPDATE pool_player_award_selections target
        SET
          pool_id = pool_migration.new_id::text,
          user_id = user_migration.new_id::text
        FROM pool_id_migration pool_migration, user_id_migration user_migration
        WHERE target.pool_id::text = pool_migration.old_id
          AND target.user_id::text = user_migration.old_id
          AND (
            pool_migration.old_id <> pool_migration.new_id::text
            OR user_migration.old_id <> user_migration.new_id::text
          );

        UPDATE group_phase_predictions target
        SET
          pool_id = pool_migration.new_id::text,
          user_id = user_migration.new_id::text
        FROM pool_id_migration pool_migration, user_id_migration user_migration
        WHERE target.pool_id::text = pool_migration.old_id
          AND target.user_id::text = user_migration.old_id
          AND (
            pool_migration.old_id <> pool_migration.new_id::text
            OR user_migration.old_id <> user_migration.new_id::text
          );

        UPDATE final_phase_predictions target
        SET
          pool_id = pool_migration.new_id::text,
          user_id = user_migration.new_id::text
        FROM pool_id_migration pool_migration, user_id_migration user_migration
        WHERE target.pool_id::text = pool_migration.old_id
          AND target.user_id::text = user_migration.old_id
          AND (
            pool_migration.old_id <> pool_migration.new_id::text
            OR user_migration.old_id <> user_migration.new_id::text
          );

        UPDATE notifications target
        SET notification_id = notification_migration.new_id::text
        FROM notification_id_migration notification_migration
        WHERE target.notification_id::text = notification_migration.old_id
          AND notification_migration.old_id <> notification_migration.new_id::text;

        UPDATE notifications target
        SET user_id = user_migration.new_id::text
        FROM user_id_migration user_migration
        WHERE target.user_id::text = user_migration.old_id
          AND user_migration.old_id <> user_migration.new_id::text;
      `);

      await client.query(`
        ALTER TABLE users ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
        ALTER TABLE pools ALTER COLUMN pool_id TYPE UUID USING pool_id::uuid;
        ALTER TABLE pools ALTER COLUMN admin_user_id TYPE UUID USING admin_user_id::uuid;
        ALTER TABLE pool_memberships ALTER COLUMN pool_id TYPE UUID USING pool_id::uuid;
        ALTER TABLE pool_memberships ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
        ALTER TABLE pool_player_selections ALTER COLUMN pool_id TYPE UUID USING pool_id::uuid;
        ALTER TABLE pool_player_selections ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
        ALTER TABLE pool_player_award_selections ALTER COLUMN pool_id TYPE UUID USING pool_id::uuid;
        ALTER TABLE pool_player_award_selections ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
        ALTER TABLE group_phase_predictions ALTER COLUMN pool_id TYPE UUID USING pool_id::uuid;
        ALTER TABLE group_phase_predictions ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
        ALTER TABLE final_phase_predictions ALTER COLUMN pool_id TYPE UUID USING pool_id::uuid;
        ALTER TABLE final_phase_predictions ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
        ALTER TABLE notifications ALTER COLUMN notification_id TYPE UUID USING notification_id::uuid;
        ALTER TABLE notifications ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

        ALTER TABLE pool_memberships
          ADD CONSTRAINT pool_memberships_pool_id_fkey
          FOREIGN KEY (pool_id) REFERENCES pools(pool_id) ON DELETE CASCADE;
      `);

      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      this.logger.error(`Failed to migrate entity IDs to UUID: ${error.message}`, error.stack);
      throw error;
    } finally {
      client.release();
    }
  }

  private async migratePredictionIdsToUuid(): Promise<void> {
    const client = await this.postgres.getClient();
    try {
      const columnTypes = await client.query(
        `
          SELECT table_name, column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND (
              (table_name = 'group_phase_predictions' AND column_name = 'prediction_id')
              OR (table_name = 'final_phase_predictions' AND column_name = 'bracket_prediction_id')
            )
        `,
      );
      const typeByColumn = new Map(
        columnTypes.rows.map((row: any) => [`${row.table_name}.${row.column_name}`, row.data_type]),
      );
      if (
        typeByColumn.get('group_phase_predictions.prediction_id') === 'uuid' &&
        typeByColumn.get('final_phase_predictions.bracket_prediction_id') === 'uuid'
      ) {
        return;
      }

      await client.query('BEGIN');
      await client.query(`
        ALTER TABLE group_phase_predictions
          ALTER COLUMN prediction_id TYPE UUID
          USING ${this.uuidExpressionForTextId('prediction_id', 'gpool-group-phase-prediction')};

        ALTER TABLE final_phase_predictions
          ALTER COLUMN bracket_prediction_id TYPE UUID
          USING ${this.uuidExpressionForTextId('bracket_prediction_id', 'gpool-final-phase-prediction')};
      `);
      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      this.logger.error(`Failed to migrate prediction IDs to UUID: ${error.message}`, error.stack);
      throw error;
    } finally {
      client.release();
    }
  }

  private async migrateTournamentPlayerIdsToUuid(): Promise<void> {
    const client = await this.postgres.getClient();
    try {
      const columnTypeResult = await client.query(
        `
          SELECT data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'tournament_players'
            AND column_name = 'player_id'
        `,
      );
      if (columnTypeResult.rows[0]?.data_type === 'uuid') {
        return;
      }

      await client.query('BEGIN');
      await client.query(`
        CREATE TEMP TABLE player_id_migration AS
        WITH existing_players AS (
          SELECT player_id::text AS old_id
          FROM tournament_players
        ),
        hashed_players AS (
          SELECT
            old_id,
            md5('gpool-world-cup-2026-player:' || old_id) AS hash
          FROM existing_players
        )
        SELECT
          old_id,
          CASE
            WHEN old_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              THEN old_id::uuid
            ELSE (
              substring(hash from 1 for 8) || '-' ||
              substring(hash from 9 for 4) || '-' ||
              substring(hash from 13 for 4) || '-' ||
              substring(hash from 17 for 4) || '-' ||
              substring(hash from 21 for 12)
            )::uuid
          END AS new_id
        FROM hashed_players;
      `);

      await client.query(`
        INSERT INTO tournament_players (
          player_id,
          team_id,
          team_name,
          name,
          position,
          image_url,
          country_code,
          flag_emoji,
          created_at,
          updated_at
        )
        SELECT
          migration.new_id::text,
          players.team_id,
          players.team_name,
          players.name,
          players.position,
          players.image_url,
          players.country_code,
          players.flag_emoji,
          players.created_at,
          players.updated_at
        FROM tournament_players players
        INNER JOIN player_id_migration migration
          ON migration.old_id = players.player_id::text
        WHERE migration.old_id <> migration.new_id::text
        ON CONFLICT (player_id) DO UPDATE SET
          team_id = EXCLUDED.team_id,
          team_name = EXCLUDED.team_name,
          name = EXCLUDED.name,
          position = EXCLUDED.position,
          image_url = EXCLUDED.image_url,
          country_code = EXCLUDED.country_code,
          flag_emoji = EXCLUDED.flag_emoji,
          updated_at = COALESCE(EXCLUDED.updated_at, EXCLUDED.created_at);
      `);

      for (const table of [
        'tournament_player_stats',
        'tournament_player_match_stats',
        'tournament_player_awards',
        'pool_player_selections',
        'pool_player_award_selections',
      ]) {
        await client.query(`
          UPDATE ${table} target
          SET player_id = migration.new_id::text
          FROM player_id_migration migration
          WHERE target.player_id::text = migration.old_id
            AND migration.old_id <> migration.new_id::text;
        `);
      }

      await client.query(`
        UPDATE pools pool
        SET config = jsonb_set(
          pool.config,
          '{playerAwardWinners,goldenBootPlayerIds}',
          (
            SELECT COALESCE(jsonb_agg(to_jsonb(COALESCE(migration.new_id::text, ids.value))), '[]'::jsonb)
            FROM jsonb_array_elements_text(pool.config #> '{playerAwardWinners,goldenBootPlayerIds}') AS ids(value)
            LEFT JOIN player_id_migration migration ON migration.old_id = ids.value
          ),
          true
        )
        WHERE pool.config #> '{playerAwardWinners,goldenBootPlayerIds}' IS NOT NULL;
      `);

      await client.query(`
        UPDATE pools pool
        SET config = jsonb_set(
          pool.config,
          '{playerAwardWinners,tournamentMvpPlayerId}',
          to_jsonb(COALESCE(migration.new_id::text, pool.config #>> '{playerAwardWinners,tournamentMvpPlayerId}')),
          true
        )
        FROM player_id_migration migration
        WHERE pool.config #>> '{playerAwardWinners,tournamentMvpPlayerId}' = migration.old_id;
      `);

      await client.query(`
        DELETE FROM tournament_players players
        USING player_id_migration migration
        WHERE players.player_id::text = migration.old_id
          AND migration.old_id <> migration.new_id::text;
      `);

      await client.query(`
        ALTER TABLE tournament_player_stats DROP CONSTRAINT IF EXISTS tournament_player_stats_player_id_fkey;
        ALTER TABLE tournament_player_match_stats DROP CONSTRAINT IF EXISTS tournament_player_match_stats_player_id_fkey;
        ALTER TABLE tournament_player_awards DROP CONSTRAINT IF EXISTS tournament_player_awards_player_id_fkey;
        ALTER TABLE pool_player_selections DROP CONSTRAINT IF EXISTS pool_player_selections_player_id_fkey;
        ALTER TABLE pool_player_award_selections DROP CONSTRAINT IF EXISTS pool_player_award_selections_player_id_fkey;

        ALTER TABLE tournament_players ALTER COLUMN player_id TYPE UUID USING player_id::uuid;
        ALTER TABLE tournament_player_stats ALTER COLUMN player_id TYPE UUID USING player_id::uuid;
        ALTER TABLE tournament_player_match_stats ALTER COLUMN player_id TYPE UUID USING player_id::uuid;
        ALTER TABLE tournament_player_awards ALTER COLUMN player_id TYPE UUID USING player_id::uuid;
        ALTER TABLE pool_player_selections ALTER COLUMN player_id TYPE UUID USING player_id::uuid;
        ALTER TABLE pool_player_award_selections ALTER COLUMN player_id TYPE UUID USING player_id::uuid;

        ALTER TABLE tournament_player_stats
          ADD CONSTRAINT tournament_player_stats_player_id_fkey
          FOREIGN KEY (player_id) REFERENCES tournament_players(player_id) ON DELETE CASCADE;
        ALTER TABLE tournament_player_match_stats
          ADD CONSTRAINT tournament_player_match_stats_player_id_fkey
          FOREIGN KEY (player_id) REFERENCES tournament_players(player_id) ON DELETE CASCADE;
        ALTER TABLE tournament_player_awards
          ADD CONSTRAINT tournament_player_awards_player_id_fkey
          FOREIGN KEY (player_id) REFERENCES tournament_players(player_id) ON DELETE CASCADE;
        ALTER TABLE pool_player_selections
          ADD CONSTRAINT pool_player_selections_player_id_fkey
          FOREIGN KEY (player_id) REFERENCES tournament_players(player_id) ON DELETE CASCADE;
        ALTER TABLE pool_player_award_selections
          ADD CONSTRAINT pool_player_award_selections_player_id_fkey
          FOREIGN KEY (player_id) REFERENCES tournament_players(player_id) ON DELETE CASCADE;
      `);

      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      this.logger.error(`Failed to migrate tournament player IDs to UUID: ${error.message}`, error.stack);
      throw error;
    } finally {
      client.release();
    }
  }

  private async seedTeamsAndMatches(): Promise<void> {
    const toUtcIsoFromEt = (date: string, time: string): string => {
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute] = time.split(':').map(Number);
      return new Date(Date.UTC(year, month - 1, day, hour + 4, minute)).toISOString();
    };

    type TeamSeed = {
      teamId: string;
      name: string;
      group: string;
      code: string;
      fifaRanking: number;
    };
    type MatchSeed = {
      matchId: string;
      matchNumber?: number;
      group: string;
      home: string;
      away: string;
      date: string;
      timeEt: string;
    };
    const countryMeta: Record<string, { code: string; flag: string }> = {
      'México': { code: 'MX', flag: '🇲🇽' },
      'Sudáfrica': { code: 'ZA', flag: '🇿🇦' },
      'República de Corea': { code: 'KR', flag: '🇰🇷' },
      'República Checa': { code: 'CZ', flag: '🇨🇿' },
      'Canadá': { code: 'CA', flag: '🇨🇦' },
      'Bosnia y Herzegovina': { code: 'BA', flag: '🇧🇦' },
      'Catar': { code: 'QA', flag: '🇶🇦' },
      'Suiza': { code: 'CH', flag: '🇨🇭' },
      'Brasil': { code: 'BR', flag: '🇧🇷' },
      'Marruecos': { code: 'MA', flag: '🇲🇦' },
      'Haití': { code: 'HT', flag: '🇭🇹' },
      'Escocia': { code: 'GB-SCT', flag: '🏴' },
      'Estados Unidos': { code: 'US', flag: '🇺🇸' },
      'Paraguay': { code: 'PY', flag: '🇵🇾' },
      'Australia': { code: 'AU', flag: '🇦🇺' },
      'Turquía': { code: 'TR', flag: '🇹🇷' },
      'Alemania': { code: 'DE', flag: '🇩🇪' },
      'Curazao': { code: 'CW', flag: '🇨🇼' },
      'Costa de Marfil': { code: 'CI', flag: '🇨🇮' },
      'Ecuador': { code: 'EC', flag: '🇪🇨' },
      'Países Bajos': { code: 'NL', flag: '🇳🇱' },
      'Japón': { code: 'JP', flag: '🇯🇵' },
      'Suecia': { code: 'SE', flag: '🇸🇪' },
      'Túnez': { code: 'TN', flag: '🇹🇳' },
      'Bélgica': { code: 'BE', flag: '🇧🇪' },
      'Egipto': { code: 'EG', flag: '🇪🇬' },
      'RI de Irán': { code: 'IR', flag: '🇮🇷' },
      'Nueva Zelanda': { code: 'NZ', flag: '🇳🇿' },
      'España': { code: 'ES', flag: '🇪🇸' },
      'Cabo Verde': { code: 'CV', flag: '🇨🇻' },
      'Arabia Saudí': { code: 'SA', flag: '🇸🇦' },
      'Uruguay': { code: 'UY', flag: '🇺🇾' },
      'Francia': { code: 'FR', flag: '🇫🇷' },
      'Senegal': { code: 'SN', flag: '🇸🇳' },
      'Irak': { code: 'IQ', flag: '🇮🇶' },
      'Noruega': { code: 'NO', flag: '🇳🇴' },
      'Argentina': { code: 'AR', flag: '🇦🇷' },
      'Argelia': { code: 'DZ', flag: '🇩🇿' },
      'Austria': { code: 'AT', flag: '🇦🇹' },
      'Jordania': { code: 'JO', flag: '🇯🇴' },
      'Portugal': { code: 'PT', flag: '🇵🇹' },
      'RD de Congo': { code: 'CD', flag: '🇨🇩' },
      'Uzbekistán': { code: 'UZ', flag: '🇺🇿' },
      'Colombia': { code: 'CO', flag: '🇨🇴' },
      'Inglaterra': { code: 'GB-ENG', flag: '🏴' },
      'Croacia': { code: 'HR', flag: '🇭🇷' },
      'Ghana': { code: 'GH', flag: '🇬🇭' },
      'Panamá': { code: 'PA', flag: '🇵🇦' },
    };

    const groups: Record<string, string[]> = {
      A: ['México', 'Sudáfrica', 'República de Corea', 'República Checa'],
      B: ['Canadá', 'Bosnia y Herzegovina', 'Catar', 'Suiza'],
      C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
      D: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'],
      E: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
      F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
      G: ['Bélgica', 'Egipto', 'RI de Irán', 'Nueva Zelanda'],
      H: ['España', 'Cabo Verde', 'Arabia Saudí', 'Uruguay'],
      I: ['Francia', 'Senegal', 'Irak', 'Noruega'],
      J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
      K: ['Portugal', 'RD de Congo', 'Uzbekistán', 'Colombia'],
      L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
    };

    // Official FIFA/Coca-Cola Men's World Ranking published on 1 April 2026.
    const fifaRanking: Record<string, number> = {
      'Argentina': 1,
      'España': 2,
      'Francia': 3,
      'Inglaterra': 4,
      'Portugal': 5,
      'Brasil': 6,
      'Marruecos': 7,
      'Países Bajos': 8,
      'Bélgica': 9,
      'Alemania': 10,
      'Croacia': 11,
      'Colombia': 13,
      'México': 14,
      'Senegal': 15,
      'Uruguay': 16,
      'Estados Unidos': 17,
      'Japón': 18,
      'Suiza': 19,
      'RI de Irán': 20,
      'Turquía': 22,
      'Austria': 23,
      'Ecuador': 24,
      'República de Corea': 25,
      'Australia': 27,
      'Argelia': 28,
      'Egipto': 29,
      'Canadá': 30,
      'Noruega': 31,
      'Costa de Marfil': 33,
      'Panamá': 34,
      'Suecia': 38,
      'República Checa': 39,
      'Paraguay': 40,
      'Escocia': 42,
      'RD de Congo': 45,
      'Túnez': 46,
      'Uzbekistán': 50,
      'Irak': 56,
      'Catar': 57,
      'Sudáfrica': 60,
      'Arabia Saudí': 61,
      'Jordania': 63,
      'Bosnia y Herzegovina': 64,
      'Cabo Verde': 67,
      'Ghana': 73,
      'Curazao': 82,
      'Haití': 83,
      'Nueva Zelanda': 85,
    };

    const matches: MatchSeed[] = [
      { matchId: 'A1', group: 'A', date: '2026-06-11', timeEt: '15:00', home: 'México', away: 'Sudáfrica' },
      { matchId: 'A2', group: 'A', date: '2026-06-11', timeEt: '22:00', home: 'República de Corea', away: 'República Checa' },
      { matchId: 'A3', group: 'A', date: '2026-06-18', timeEt: '12:00', home: 'República Checa', away: 'Sudáfrica' },
      { matchId: 'A4', group: 'A', date: '2026-06-18', timeEt: '21:00', home: 'México', away: 'República de Corea' },
      { matchId: 'A5', group: 'A', date: '2026-06-24', timeEt: '21:00', home: 'República Checa', away: 'México' },
      { matchId: 'A6', group: 'A', date: '2026-06-24', timeEt: '21:00', home: 'Sudáfrica', away: 'República de Corea' },
      { matchId: 'B1', group: 'B', date: '2026-06-12', timeEt: '15:00', home: 'Canadá', away: 'Bosnia y Herzegovina' },
      { matchId: 'B2', group: 'B', date: '2026-06-13', timeEt: '15:00', home: 'Catar', away: 'Suiza' },
      { matchId: 'B3', group: 'B', date: '2026-06-18', timeEt: '15:00', home: 'Suiza', away: 'Bosnia y Herzegovina' },
      { matchId: 'B4', group: 'B', date: '2026-06-18', timeEt: '18:00', home: 'Canadá', away: 'Catar' },
      { matchId: 'B5', group: 'B', date: '2026-06-24', timeEt: '15:00', home: 'Suiza', away: 'Canadá' },
      { matchId: 'B6', group: 'B', date: '2026-06-24', timeEt: '15:00', home: 'Bosnia y Herzegovina', away: 'Catar' },
      { matchId: 'C1', group: 'C', date: '2026-06-13', timeEt: '18:00', home: 'Brasil', away: 'Marruecos' },
      { matchId: 'C2', group: 'C', date: '2026-06-13', timeEt: '21:00', home: 'Haití', away: 'Escocia' },
      { matchId: 'C3', group: 'C', date: '2026-06-19', timeEt: '18:00', home: 'Escocia', away: 'Marruecos' },
      { matchId: 'C4', group: 'C', date: '2026-06-19', timeEt: '21:00', home: 'Brasil', away: 'Haití' },
      { matchId: 'C5', group: 'C', date: '2026-06-24', timeEt: '18:00', home: 'Escocia', away: 'Brasil' },
      { matchId: 'C6', group: 'C', date: '2026-06-24', timeEt: '18:00', home: 'Marruecos', away: 'Haití' },
      { matchId: 'D1', group: 'D', date: '2026-06-12', timeEt: '21:00', home: 'Estados Unidos', away: 'Paraguay' },
      { matchId: 'D2', group: 'D', date: '2026-06-14', timeEt: '00:00', home: 'Australia', away: 'Turquía' },
      { matchId: 'D3', group: 'D', date: '2026-06-19', timeEt: '15:00', home: 'Estados Unidos', away: 'Australia' },
      { matchId: 'D4', group: 'D', date: '2026-06-20', timeEt: '00:00', home: 'Turquía', away: 'Paraguay' },
      { matchId: 'D5', group: 'D', date: '2026-06-25', timeEt: '22:00', home: 'Turquía', away: 'Estados Unidos' },
      { matchId: 'D6', group: 'D', date: '2026-06-25', timeEt: '22:00', home: 'Paraguay', away: 'Australia' },
      { matchId: 'E1', group: 'E', date: '2026-06-14', timeEt: '13:00', home: 'Alemania', away: 'Curazao' },
      { matchId: 'E2', group: 'E', date: '2026-06-14', timeEt: '19:00', home: 'Costa de Marfil', away: 'Ecuador' },
      { matchId: 'E3', group: 'E', date: '2026-06-20', timeEt: '16:00', home: 'Alemania', away: 'Costa de Marfil' },
      { matchId: 'E4', group: 'E', date: '2026-06-20', timeEt: '22:00', home: 'Ecuador', away: 'Curazao' },
      { matchId: 'E5', group: 'E', date: '2026-06-25', timeEt: '16:00', home: 'Curazao', away: 'Costa de Marfil' },
      { matchId: 'E6', group: 'E', date: '2026-06-25', timeEt: '16:00', home: 'Ecuador', away: 'Alemania' },
      { matchId: 'F1', group: 'F', date: '2026-06-14', timeEt: '16:00', home: 'Países Bajos', away: 'Japón' },
      { matchId: 'F2', group: 'F', date: '2026-06-14', timeEt: '22:00', home: 'Suecia', away: 'Túnez' },
      { matchId: 'F3', group: 'F', date: '2026-06-20', timeEt: '13:00', home: 'Países Bajos', away: 'Suecia' },
      { matchId: 'F4', group: 'F', date: '2026-06-21', timeEt: '00:00', home: 'Túnez', away: 'Japón' },
      { matchId: 'F5', group: 'F', date: '2026-06-25', timeEt: '19:00', home: 'Japón', away: 'Suecia' },
      { matchId: 'F6', group: 'F', date: '2026-06-25', timeEt: '19:00', home: 'Túnez', away: 'Países Bajos' },
      { matchId: 'G1', group: 'G', date: '2026-06-15', timeEt: '15:00', home: 'Bélgica', away: 'Egipto' },
      { matchId: 'G2', group: 'G', date: '2026-06-15', timeEt: '21:00', home: 'RI de Irán', away: 'Nueva Zelanda' },
      { matchId: 'G3', group: 'G', date: '2026-06-21', timeEt: '15:00', home: 'Bélgica', away: 'RI de Irán' },
      { matchId: 'G4', group: 'G', date: '2026-06-21', timeEt: '21:00', home: 'Nueva Zelanda', away: 'Egipto' },
      { matchId: 'G5', group: 'G', date: '2026-06-26', timeEt: '23:00', home: 'Egipto', away: 'RI de Irán' },
      { matchId: 'G6', group: 'G', date: '2026-06-26', timeEt: '23:00', home: 'Nueva Zelanda', away: 'Bélgica' },
      { matchId: 'H1', group: 'H', date: '2026-06-15', timeEt: '12:00', home: 'España', away: 'Cabo Verde' },
      { matchId: 'H2', group: 'H', date: '2026-06-15', timeEt: '18:00', home: 'Arabia Saudí', away: 'Uruguay' },
      { matchId: 'H3', group: 'H', date: '2026-06-21', timeEt: '12:00', home: 'España', away: 'Arabia Saudí' },
      { matchId: 'H4', group: 'H', date: '2026-06-21', timeEt: '18:00', home: 'Uruguay', away: 'Cabo Verde' },
      { matchId: 'H5', group: 'H', date: '2026-06-26', timeEt: '20:00', home: 'Cabo Verde', away: 'Arabia Saudí' },
      { matchId: 'H6', group: 'H', date: '2026-06-26', timeEt: '20:00', home: 'Uruguay', away: 'España' },
      { matchId: 'I1', group: 'I', date: '2026-06-16', timeEt: '15:00', home: 'Francia', away: 'Senegal' },
      { matchId: 'I2', group: 'I', date: '2026-06-16', timeEt: '18:00', home: 'Irak', away: 'Noruega' },
      { matchId: 'I3', group: 'I', date: '2026-06-22', timeEt: '17:00', home: 'Francia', away: 'Irak' },
      { matchId: 'I4', group: 'I', date: '2026-06-22', timeEt: '20:00', home: 'Noruega', away: 'Senegal' },
      { matchId: 'I5', group: 'I', date: '2026-06-26', timeEt: '15:00', home: 'Noruega', away: 'Francia' },
      { matchId: 'I6', group: 'I', date: '2026-06-26', timeEt: '15:00', home: 'Senegal', away: 'Irak' },
      { matchId: 'J1', group: 'J', date: '2026-06-16', timeEt: '21:00', home: 'Argentina', away: 'Argelia' },
      { matchId: 'J2', group: 'J', date: '2026-06-17', timeEt: '00:00', home: 'Austria', away: 'Jordania' },
      { matchId: 'J3', group: 'J', date: '2026-06-22', timeEt: '13:00', home: 'Argentina', away: 'Austria' },
      { matchId: 'J4', group: 'J', date: '2026-06-22', timeEt: '23:00', home: 'Jordania', away: 'Argelia' },
      { matchId: 'J5', group: 'J', date: '2026-06-27', timeEt: '22:00', home: 'Argelia', away: 'Austria' },
      { matchId: 'J6', group: 'J', date: '2026-06-27', timeEt: '22:00', home: 'Jordania', away: 'Argentina' },
      { matchId: 'K1', group: 'K', date: '2026-06-17', timeEt: '13:00', home: 'Portugal', away: 'RD de Congo' },
      { matchId: 'K2', group: 'K', date: '2026-06-17', timeEt: '22:00', home: 'Uzbekistán', away: 'Colombia' },
      { matchId: 'K3', group: 'K', date: '2026-06-23', timeEt: '13:00', home: 'Portugal', away: 'Uzbekistán' },
      { matchId: 'K4', group: 'K', date: '2026-06-23', timeEt: '22:00', home: 'Colombia', away: 'RD de Congo' },
      { matchId: 'K5', group: 'K', date: '2026-06-27', timeEt: '19:30', home: 'Colombia', away: 'Portugal' },
      { matchId: 'K6', group: 'K', date: '2026-06-27', timeEt: '19:30', home: 'RD de Congo', away: 'Uzbekistán' },
      { matchId: 'L1', group: 'L', date: '2026-06-17', timeEt: '16:00', home: 'Inglaterra', away: 'Croacia' },
      { matchId: 'L2', group: 'L', date: '2026-06-17', timeEt: '19:00', home: 'Ghana', away: 'Panamá' },
      { matchId: 'L3', group: 'L', date: '2026-06-23', timeEt: '16:00', home: 'Inglaterra', away: 'Ghana' },
      { matchId: 'L4', group: 'L', date: '2026-06-23', timeEt: '19:00', home: 'Panamá', away: 'Croacia' },
      { matchId: 'L5', group: 'L', date: '2026-06-27', timeEt: '17:00', home: 'Panamá', away: 'Inglaterra' },
      { matchId: 'L6', group: 'L', date: '2026-06-27', timeEt: '17:00', home: 'Croacia', away: 'Ghana' },
    ];

    const teams: TeamSeed[] = Object.entries(groups).flatMap(([group, names]) =>
      names.map((name, index) => {
        const ranking = fifaRanking[name];
        if (!ranking) {
          throw new Error(`Missing FIFA ranking seed for ${name}`);
        }
        return {
          teamId: `${group}${index + 1}`,
          name,
          group,
          code: name.substring(0, 3).toUpperCase(),
          fifaRanking: ranking,
        };
      }),
    );
    if (Object.keys(fifaRanking).length !== teams.length) {
      throw new Error('FIFA ranking seed must contain exactly one entry for every tournament team');
    }
    const teamsByName = new Map(teams.map((team) => [team.name, team]));
    const rostersByTeamName = new Map(WORLD_CUP_2026_ROSTERS.map((roster) => [roster.teamName, roster]));
    if (rostersByTeamName.size !== WORLD_CUP_2026_ROSTERS.length) {
      throw new Error('Duplicate team names found in the World Cup player roster seed');
    }

    const invalidRosterSizes = WORLD_CUP_2026_ROSTERS.filter(
      (roster) =>
        TOURNAMENT_ROSTER_POSITIONS.reduce(
          (playerCount, position) => playerCount + roster.players[position].length,
          0,
        ) !== TOURNAMENT_SQUAD_SIZE,
    );
    if (invalidRosterSizes.length > 0) {
      throw new Error(
        `World Cup squads must contain ${TOURNAMENT_SQUAD_SIZE} players: ${invalidRosterSizes
          .map((roster) => roster.teamName)
          .join(', ')}`,
      );
    }

    const missingRosterTeams = teams.filter((team) => !rostersByTeamName.has(team.name));
    const unknownRosterTeams = WORLD_CUP_2026_ROSTERS.filter((roster) => !teamsByName.has(roster.teamName));
    if (missingRosterTeams.length > 0 || unknownRosterTeams.length > 0) {
      throw new Error(
        `World Cup player roster mismatch. Missing: ${missingRosterTeams.map((team) => team.name).join(', ') || 'none'}. ` +
          `Unknown: ${unknownRosterTeams.map((roster) => roster.teamName).join(', ') || 'none'}.`,
      );
    }

    const seededAt = Math.floor(Date.now() / 1000);
    const playerSeeds = teams.flatMap((team) => {
      const roster = rostersByTeamName.get(team.name)!;
      const meta = countryMeta[team.name] || { code: team.code, flag: '' };
      return TOURNAMENT_ROSTER_POSITIONS.flatMap((position) =>
        roster.players[position].map((name) => ({
          playerId: worldCupPlayerId(team.teamId, position, name),
          teamId: team.teamId,
          teamName: team.name,
          name,
          position,
          countryCode: meta.code,
          flagEmoji: meta.flag,
        })),
      );
    });
    const playerIds = playerSeeds.map((player) => player.playerId);
    if (new Set(playerIds).size !== playerIds.length) {
      throw new Error('Duplicate player IDs found in the World Cup player roster seed');
    }

    const matchNumbersById = new Map(
      [...matches]
        .sort((a, b) => {
          const byTime = toUtcIsoFromEt(a.date, a.timeEt).localeCompare(toUtcIsoFromEt(b.date, b.timeEt));
          return byTime || a.matchId.localeCompare(b.matchId);
        })
        .map((match, index) => [match.matchId, index + 1]),
    );

    const client = await this.postgres.getClient();
    try {
      await client.query('BEGIN');

      for (const team of teams) {
        await client.query(
          `
            INSERT INTO teams (
              team_id,
              name,
              group_id,
              code,
              fifa_ranking
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (team_id)
            DO UPDATE SET
              name = EXCLUDED.name,
              group_id = EXCLUDED.group_id,
              code = EXCLUDED.code,
              fifa_ranking = EXCLUDED.fifa_ranking
          `,
          [
            team.teamId,
            team.name,
            team.group,
            team.code,
            team.fifaRanking,
          ],
        );
      }

      await client.query(
        `
          INSERT INTO tournament_players (
            player_id,
            team_id,
            team_name,
            name,
            position,
            image_url,
            country_code,
            flag_emoji,
            created_at
          )
          SELECT
            player_id,
            team_id,
            team_name,
            name,
            position,
            '',
            country_code,
            flag_emoji,
            created_at
          FROM UNNEST(
            $1::uuid[],
            $2::text[],
            $3::text[],
            $4::text[],
            $5::text[],
            $6::text[],
            $7::text[],
            $8::bigint[]
          ) AS seeded_players(
            player_id,
            team_id,
            team_name,
            name,
            position,
            country_code,
            flag_emoji,
            created_at
          )
          ON CONFLICT (player_id)
          DO UPDATE SET
            team_id = EXCLUDED.team_id,
            team_name = EXCLUDED.team_name,
            name = EXCLUDED.name,
            position = EXCLUDED.position,
            country_code = EXCLUDED.country_code,
            flag_emoji = EXCLUDED.flag_emoji,
            updated_at = EXCLUDED.created_at
        `,
        [
          playerSeeds.map((player) => player.playerId),
          playerSeeds.map((player) => player.teamId),
          playerSeeds.map((player) => player.teamName),
          playerSeeds.map((player) => player.name),
          playerSeeds.map((player) => player.position),
          playerSeeds.map((player) => player.countryCode),
          playerSeeds.map((player) => player.flagEmoji),
          playerSeeds.map(() => seededAt),
        ],
      );

      await client.query(
        `
          DELETE FROM tournament_players
          WHERE team_id = ANY($1::text[])
            AND NOT (player_id = ANY($2::uuid[]))
            AND NOT EXISTS (
              SELECT 1 FROM tournament_player_stats stats
              WHERE stats.player_id = tournament_players.player_id
            )
            AND NOT EXISTS (
              SELECT 1 FROM tournament_player_match_stats match_stats
              WHERE match_stats.player_id = tournament_players.player_id
            )
            AND NOT EXISTS (
              SELECT 1 FROM tournament_player_awards awards
              WHERE awards.player_id = tournament_players.player_id
            )
            AND NOT EXISTS (
              SELECT 1 FROM pool_player_selections selections
              WHERE selections.player_id = tournament_players.player_id
            )
            AND NOT EXISTS (
              SELECT 1 FROM pool_player_award_selections award_selections
              WHERE award_selections.player_id = tournament_players.player_id
            )
        `,
        [teams.map((team) => team.teamId), playerIds],
      );

      for (const match of matches) {
        const homeTeam = teamsByName.get(match.home);
        const awayTeam = teamsByName.get(match.away);
        if (!homeTeam || !awayTeam) {
          throw new Error(`Missing seeded team for match ${match.matchId}`);
        }

        const scheduledAt = toUtcIsoFromEt(match.date, match.timeEt);

        await client.query(
          `
            INSERT INTO group_phase_matches (
              match_id,
              pool_id,
              group_id,
              home_team_id,
              away_team_id,
              home_team_name,
              away_team_name,
              match_number,
              scheduled_at,
              phase,
              status,
              created_at
            )
            VALUES ($1, 'all-pools', $2, $3, $4, $5, $6, $7, $8, 'group', 'scheduled', $9)
            ON CONFLICT (match_id)
            DO UPDATE SET
              pool_id = EXCLUDED.pool_id,
              group_id = EXCLUDED.group_id,
              home_team_id = EXCLUDED.home_team_id,
              away_team_id = EXCLUDED.away_team_id,
              home_team_name = EXCLUDED.home_team_name,
              away_team_name = EXCLUDED.away_team_name,
              match_number = EXCLUDED.match_number,
              scheduled_at = EXCLUDED.scheduled_at,
              phase = EXCLUDED.phase,
              status = CASE
                WHEN group_phase_matches.status = 'completed' THEN group_phase_matches.status
                ELSE EXCLUDED.status
              END
          `,
          [
            match.matchId,
            match.group,
            homeTeam.teamId,
            awayTeam.teamId,
            homeTeam.name,
            awayTeam.name,
            matchNumbersById.get(match.matchId) ?? null,
            scheduledAt,
            Math.floor(Date.now() / 1000),
          ],
        );
      }

      await client.query('COMMIT');
      this.logger.log(`Seeded real teams, ${playerSeeds.length} tournament players, and group phase match schedule`);
    } catch (error: any) {
      await client.query('ROLLBACK');
      this.logger.error(`Failed to seed teams/matches: ${error.message}`, error.stack);
      throw error;
    } finally {
      client.release();
    }
  }

  private async seedBracketMatches(): Promise<void> {
    const matches: Array<{
      phase: string;
      index: number;
      matchNumber: number;
      homeSourceLabel: string;
      awaySourceLabel: string;
    }> = [
      { phase: '16th-finals', index: 1, matchNumber: 74, homeSourceLabel: '1E', awaySourceLabel: '3ABCDF' },
      { phase: '16th-finals', index: 2, matchNumber: 77, homeSourceLabel: '1I', awaySourceLabel: '3CDFGH' },
      { phase: '16th-finals', index: 3, matchNumber: 73, homeSourceLabel: '2A', awaySourceLabel: '2B' },
      { phase: '16th-finals', index: 4, matchNumber: 75, homeSourceLabel: '1F', awaySourceLabel: '2C' },
      { phase: '16th-finals', index: 5, matchNumber: 83, homeSourceLabel: '2K', awaySourceLabel: '2L' },
      { phase: '16th-finals', index: 6, matchNumber: 84, homeSourceLabel: '1H', awaySourceLabel: '2J' },
      { phase: '16th-finals', index: 7, matchNumber: 81, homeSourceLabel: '1D', awaySourceLabel: '3BEFIJ' },
      { phase: '16th-finals', index: 8, matchNumber: 82, homeSourceLabel: '1G', awaySourceLabel: '3AEHIJ' },
      { phase: '16th-finals', index: 9, matchNumber: 76, homeSourceLabel: '1C', awaySourceLabel: '2F' },
      { phase: '16th-finals', index: 10, matchNumber: 78, homeSourceLabel: '2E', awaySourceLabel: '2I' },
      { phase: '16th-finals', index: 11, matchNumber: 79, homeSourceLabel: '1A', awaySourceLabel: '3CEFHI' },
      { phase: '16th-finals', index: 12, matchNumber: 80, homeSourceLabel: '1L', awaySourceLabel: '3EHIJK' },
      { phase: '16th-finals', index: 13, matchNumber: 86, homeSourceLabel: '1J', awaySourceLabel: '2H' },
      { phase: '16th-finals', index: 14, matchNumber: 88, homeSourceLabel: '2D', awaySourceLabel: '2G' },
      { phase: '16th-finals', index: 15, matchNumber: 85, homeSourceLabel: '1B', awaySourceLabel: '3EFGIJ' },
      { phase: '16th-finals', index: 16, matchNumber: 87, homeSourceLabel: '1K', awaySourceLabel: '3DEIJL' },
      { phase: '8th-finals', index: 1, matchNumber: 89, homeSourceLabel: 'W74', awaySourceLabel: 'W77' },
      { phase: '8th-finals', index: 2, matchNumber: 90, homeSourceLabel: 'W73', awaySourceLabel: 'W75' },
      { phase: '8th-finals', index: 3, matchNumber: 93, homeSourceLabel: 'W83', awaySourceLabel: 'W84' },
      { phase: '8th-finals', index: 4, matchNumber: 94, homeSourceLabel: 'W81', awaySourceLabel: 'W82' },
      { phase: '8th-finals', index: 5, matchNumber: 91, homeSourceLabel: 'W76', awaySourceLabel: 'W78' },
      { phase: '8th-finals', index: 6, matchNumber: 92, homeSourceLabel: 'W79', awaySourceLabel: 'W80' },
      { phase: '8th-finals', index: 7, matchNumber: 95, homeSourceLabel: 'W86', awaySourceLabel: 'W88' },
      { phase: '8th-finals', index: 8, matchNumber: 96, homeSourceLabel: 'W85', awaySourceLabel: 'W87' },
      { phase: 'quarter-finals', index: 1, matchNumber: 97, homeSourceLabel: 'W89', awaySourceLabel: 'W90' },
      { phase: 'quarter-finals', index: 2, matchNumber: 98, homeSourceLabel: 'W93', awaySourceLabel: 'W94' },
      { phase: 'quarter-finals', index: 3, matchNumber: 99, homeSourceLabel: 'W91', awaySourceLabel: 'W92' },
      { phase: 'quarter-finals', index: 4, matchNumber: 100, homeSourceLabel: 'W95', awaySourceLabel: 'W96' },
      { phase: 'semi-finals', index: 1, matchNumber: 101, homeSourceLabel: 'W97', awaySourceLabel: 'W98' },
      { phase: 'semi-finals', index: 2, matchNumber: 102, homeSourceLabel: 'W99', awaySourceLabel: 'W100' },
      { phase: 'finals', index: 1, matchNumber: 104, homeSourceLabel: 'W101', awaySourceLabel: 'W102' },
    ];

    const client = await this.postgres.getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        `
          DELETE FROM final_phase_predictions
          WHERE bracket_match_id IN (
            SELECT bracket_match_id
            FROM final_phase_matches
            WHERE pool_id = 'all-pools'
              AND (phase = 'third-place' OR match_number = 103)
          )
          OR bracket_match_id = 'all-pools-third-place-1'
        `,
      );
      await client.query(
        `
          DELETE FROM final_phase_matches
          WHERE pool_id = 'all-pools'
            AND (phase = 'third-place' OR match_number = 103 OR bracket_match_id = 'all-pools-third-place-1')
        `,
      );

      for (const match of matches) {
        const bracketMatchId = `all-pools-${match.phase}-${match.index}`;
        await client.query(
          `
            INSERT INTO final_phase_matches (
              bracket_match_id,
              pool_id,
              phase,
              match_number,
              home_source_label,
              away_source_label,
              status,
              created_at
            )
            VALUES ($1, 'all-pools', $2, $3, $4, $5, 'scheduled', $6)
            ON CONFLICT (bracket_match_id)
            DO UPDATE SET
              phase = EXCLUDED.phase,
              match_number = EXCLUDED.match_number,
              home_source_label = EXCLUDED.home_source_label,
              away_source_label = EXCLUDED.away_source_label,
              updated_at = EXCLUDED.created_at
          `,
          [
            bracketMatchId,
            match.phase,
            match.matchNumber,
            match.homeSourceLabel,
            match.awaySourceLabel,
            Math.floor(Date.now() / 1000),
          ],
        );
      }

      await client.query('COMMIT');
      this.logger.log('Seeded FIFA final phase match numbers');
    } catch (error: any) {
      await client.query('ROLLBACK');
      this.logger.error(`Failed to seed bracket matches: ${error.message}`, error.stack);
      throw error;
    } finally {
      client.release();
    }
  }
}
