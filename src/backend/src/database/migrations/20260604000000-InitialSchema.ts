import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema20260604000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "is_active" BOOLEAN DEFAULT true
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE lifecycle_stage_enum AS ENUM ('seed','emerging','growing','viral','saturated','declining');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE monitoring_status_enum AS ENUM ('active','paused','failed');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "keywords" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES users(id) ON DELETE CASCADE,
        "original_term" VARCHAR(100) NOT NULL,
        "normalized_form" VARCHAR(100) NOT NULL,
        "current_lifecycle_stage" lifecycle_stage_enum NOT NULL DEFAULT 'seed',
        "stage_entered_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "is_seed_keyword" BOOLEAN DEFAULT false,
        "monitoring_status" monitoring_status_enum NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "last_collected_at" TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_keywords_unique
        ON keywords(user_id, normalized_form) WHERE user_id IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_seed_keywords_unique
        ON keywords(normalized_form) WHERE is_seed_keyword = true
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_keywords_seed ON keywords(is_seed_keyword)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_keywords_lifecycle_stage ON keywords(current_lifecycle_stage)`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE provider_enum AS ENUM ('google_trends','youtube');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE collection_status_enum AS ENUM ('success','partial','failed');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "trend_data_points" (
        "id" UUID DEFAULT gen_random_uuid(),
        "keyword_id" UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
        "provider" provider_enum NOT NULL,
        "timestamp" TIMESTAMPTZ NOT NULL,
        "search_volume" INTEGER CHECK (search_volume IS NULL OR (search_volume >= 0 AND search_volume <= 100)),
        "video_count" INTEGER,
        "view_count" BIGINT,
        "unique_creators" INTEGER,
        "engagement_rate" NUMERIC(5,4) CHECK (engagement_rate IS NULL OR (engagement_rate >= 0 AND engagement_rate <= 0.1)),
        "related_query_breakouts" INTEGER,
        "raw_response" JSONB,
        "collection_status" collection_status_enum NOT NULL DEFAULT 'success',
        "error_message" TEXT,
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_trend_data_keyword_time ON trend_data_points(keyword_id, timestamp DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_trend_data_provider_time ON trend_data_points(provider, timestamp DESC)`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE confidence_level_enum AS ENUM ('low','medium','high');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "acceleration_metrics" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "keyword_id" UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
        "calculation_timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "search_acceleration" NUMERIC,
        "search_acceleration_7d" NUMERIC,
        "search_acceleration_30d" NUMERIC,
        "video_velocity" NUMERIC CHECK (video_velocity IS NULL OR video_velocity >= 0),
        "view_velocity" NUMERIC,
        "creator_adoption_rate" NUMERIC CHECK (creator_adoption_rate IS NULL OR creator_adoption_rate >= 0),
        "related_query_growth" NUMERIC,
        "confidence_level" confidence_level_enum NOT NULL,
        "historical_data_days" INTEGER NOT NULL CHECK (historical_data_days >= 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_acceleration_keyword_time ON acceleration_metrics(keyword_id, calculation_timestamp DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_acceleration_confidence ON acceleration_metrics(confidence_level)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "prediction_scores" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "keyword_id" UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
        "score" INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
        "calculation_timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "search_acceleration_component" NUMERIC NOT NULL,
        "video_velocity_component" NUMERIC NOT NULL,
        "creator_adoption_component" NUMERIC NOT NULL,
        "related_query_growth_component" NUMERIC NOT NULL,
        "view_velocity_component" NUMERIC NOT NULL,
        "confidence_level" confidence_level_enum NOT NULL,
        "previous_score" INTEGER,
        "score_change" INTEGER
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_prediction_keyword_time ON prediction_scores(keyword_id, calculation_timestamp DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_prediction_score_desc ON prediction_scores(score DESC, calculation_timestamp DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_prediction_confidence ON prediction_scores(confidence_level, score DESC)`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE timing_rec_enum AS ENUM ('early','on_time','late','avoid');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_insights" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "keyword_id" UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
        "insight_text" TEXT NOT NULL CHECK (char_length(insight_text) >= 50 AND char_length(insight_text) <= 500),
        "lifecycle_stage_explained" VARCHAR(20) NOT NULL,
        "timing_recommendation" timing_rec_enum NOT NULL,
        "seasonality_flag" BOOLEAN DEFAULT false,
        "rapid_transition_flag" BOOLEAN DEFAULT false,
        "confidence_score" INTEGER CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
        "generation_timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ai_provider" VARCHAR(50) NOT NULL,
        "token_count" INTEGER,
        "prompt_version" VARCHAR(20)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ai_insights_keyword_time ON ai_insights(keyword_id, generation_timestamp DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ai_insights_timing ON ai_insights(timing_recommendation)`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE transition_velocity_enum AS ENUM ('normal','rapid','stagnant');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stage_transition_events" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "keyword_id" UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
        "previous_stage" lifecycle_stage_enum NOT NULL,
        "new_stage" lifecycle_stage_enum NOT NULL,
        "transition_timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "trigger_signals" TEXT[] NOT NULL,
        "transition_velocity" transition_velocity_enum NOT NULL,
        "days_in_previous_stage" INTEGER NOT NULL CHECK (days_in_previous_stage >= 0),
        "acceleration_at_transition" NUMERIC,
        CHECK (previous_stage != new_stage)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_stage_transition_keyword_time ON stage_transition_events(keyword_id, transition_timestamp DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_stage_transition_velocity ON stage_transition_events(transition_velocity)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS stage_transition_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_insights`);
    await queryRunner.query(`DROP TABLE IF EXISTS prediction_scores`);
    await queryRunner.query(`DROP TABLE IF EXISTS acceleration_metrics`);
    await queryRunner.query(`DROP TABLE IF EXISTS trend_data_points`);
    await queryRunner.query(`DROP TABLE IF EXISTS keywords`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TYPE IF EXISTS transition_velocity_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS timing_rec_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS confidence_level_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS collection_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS provider_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS monitoring_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS lifecycle_stage_enum`);
  }
}
