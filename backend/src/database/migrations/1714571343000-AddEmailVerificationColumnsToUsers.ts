import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationColumnsToUsers1714571343000 implements MigrationInterface {
  name = 'AddEmailVerificationColumnsToUsers1714571343000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This migration is superseded by 1710860000000-AddOtpFieldsToUsers.ts
    // All required columns have already been added in that migration
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
