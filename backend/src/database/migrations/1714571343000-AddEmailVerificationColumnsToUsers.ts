import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationColumnsToUsers1714571343000 implements MigrationInterface {
  name = 'AddEmailVerificationColumnsToUsers1714571343000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationCode" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationExpiresAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationLastSentAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerified"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerificationCode"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerificationExpiresAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerificationLastSentAt"`);
  }
}
