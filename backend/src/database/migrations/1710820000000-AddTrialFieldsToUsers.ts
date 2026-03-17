import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrialFieldsToUsers1710820000000 implements MigrationInterface {
  name = 'AddTrialFieldsToUsers1710820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "trial_start_at" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "trial_status" varchar(20)
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "plan" = 'pro'
      WHERE "plan" IS NULL OR "plan" = '' OR "plan" = 'basic'
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET
        "trial_start_at" = NOW(),
        "trial_ends_at" = NOW() + INTERVAL '14 days',
        "trial_status" = 'active'
      WHERE "trial_start_at" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "plan" SET DEFAULT 'pro'
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "trial_status" SET DEFAULT 'active'
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "trial_status" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "plan" SET DEFAULT 'basic'
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "trial_status",
      DROP COLUMN IF EXISTS "trial_ends_at",
      DROP COLUMN IF EXISTS "trial_start_at"
    `);
  }
}
