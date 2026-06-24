import { MigrationInterface, QueryRunner } from 'typeorm';

const SEED_KEYWORDS = [
  'wireless earbuds',
  'standing desk',
  'portable blender',
  'resistance bands',
  'air purifier',
  'ring light',
  'ergonomic chair',
  'smart water bottle',
  'yoga mat',
  'led strip lights',
  'mini projector',
  'electric toothbrush',
  'foam roller',
  'portable charger',
  'blue light glasses',
  'noise cancelling headphones',
  'desk organizer',
  'reusable straws',
  'posture corrector',
  'sleep mask',
];

export class SeedKeywords20260604000002 implements MigrationInterface {
  name = 'SeedKeywords20260604000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const term of SEED_KEYWORDS) {
      const normalized = term.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
      await queryRunner.query(
        `INSERT INTO keywords (id, original_term, normalized_form, current_lifecycle_stage, stage_entered_at, is_seed_keyword, monitoring_status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'seed', NOW(), true, 'active', NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [term, normalized],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM keywords WHERE is_seed_keyword = true`);
  }
}
