import { DataSource } from 'typeorm';

export async function setupTimescaleHypertable(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    SELECT create_hypertable('trend_data_points', 'timestamp', if_not_exists => TRUE)
  `);

  await dataSource.query(`
    SELECT add_retention_policy(
      'trend_data_points',
      INTERVAL '90 days',
      if_not_exists => TRUE
    )
  `);
}
