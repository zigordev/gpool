import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PostgresService } from './postgres.service';

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
        shirt_number INTEGER,
        created_at BIGINT NOT NULL,
        updated_at BIGINT
      );
      ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS shirt_number INTEGER;
      CREATE INDEX IF NOT EXISTS idx_tournament_players_position ON tournament_players(position);
      CREATE INDEX IF NOT EXISTS idx_tournament_players_team_id ON tournament_players(team_id);

      CREATE TABLE IF NOT EXISTS tournament_player_stats (
        player_id UUID PRIMARY KEY REFERENCES tournament_players(player_id) ON DELETE CASCADE,
        goals INTEGER NOT NULL DEFAULT 0,
        penalty_goals INTEGER NOT NULL DEFAULT 0,
        missed_penalties INTEGER NOT NULL DEFAULT 0,
        mvps INTEGER NOT NULL DEFAULT 0,
        penalties_saved INTEGER NOT NULL DEFAULT 0,
        forced_penalty_misses INTEGER NOT NULL DEFAULT 0,
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
      ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS forced_penalty_misses INTEGER NOT NULL DEFAULT 0;
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
        forced_penalty_misses INTEGER NOT NULL DEFAULT 0,
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
      ALTER TABLE tournament_player_match_stats ADD COLUMN IF NOT EXISTS forced_penalty_misses INTEGER NOT NULL DEFAULT 0;
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

    this.logger.log('Postgres schema verified');
  }
}
