import { MigrationInterface, QueryRunner } from 'typeorm';

export class DailyAccelerationAggregate20260604000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS daily_acceleration_metrics
      WITH (timescaledb.continuous) AS
      SELECT
        keyword_id,
        time_bucket('1 day', timestamp) AS day,
        provider,
        AVG(search_volume) AS avg_search_volume,
        MAX(video_count) - MIN(video_count) AS videos_added,
        MAX(unique_creators) - MIN(unique_creators) AS new_creators,
        AVG(engagement_rate) AS avg_engagement_rate
      FROM trend_data_points
      GROUP BY keyword_id, day, provider
      WITH NO DATA
    `);

    await queryRunner.query(`
      SELECT add_continuous_aggregate_policy(
        'daily_acceleration_metrics',
        start_offset => INTERVAL '3 days',
        end_offset => INTERVAL '1 hour',
        schedule_interval => INTERVAL '1 hour',
        if_not_exists => TRUE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS daily_acceleration_metrics`);
  }
}
