import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanToUsers1710720000000 implements MigrationInterface {
  name = 'AddPlanToUsers1710720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "plan" varchar(20)
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "plan" = 'basic'
      WHERE "plan" IS NULL OR "plan" = ''
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "plan" SET DEFAULT 'basic'
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "plan" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "plan"
    `);
  }
}
