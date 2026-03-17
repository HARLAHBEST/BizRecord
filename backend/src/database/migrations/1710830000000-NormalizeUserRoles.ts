import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeUserRoles1710830000000 implements MigrationInterface {
  name = 'NormalizeUserRoles1710830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "role" = 'owner'
      WHERE "role" IS NULL OR "role" = '' OR "role" = 'user' OR "role" = 'admin'
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" SET DEFAULT 'owner'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "role" = 'user'
      WHERE "role" = 'owner'
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" SET DEFAULT 'user'
    `);
  }
}
