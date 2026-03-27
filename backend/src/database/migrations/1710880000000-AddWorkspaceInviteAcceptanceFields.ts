import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspaceInviteAcceptanceFields1710880000000 implements MigrationInterface {
  name = 'AddWorkspaceInviteAcceptanceFields1710880000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workspace_invites"
      ADD COLUMN IF NOT EXISTS "invite_code" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "workspace_invites"
      ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "workspace_invites"
      ADD COLUMN IF NOT EXISTS "accepted_at" TIMESTAMP
    `);

    await queryRunner.query(`
      UPDATE "workspace_invites"
      SET "expires_at" = COALESCE("expires_at", "createdAt" + INTERVAL '7 days')
      WHERE "expires_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_workspace_invites_email_status"
      ON "workspace_invites" ("email", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_workspace_invites_email_status"');
    await queryRunner.query('ALTER TABLE "workspace_invites" DROP COLUMN IF EXISTS "accepted_at"');
    await queryRunner.query('ALTER TABLE "workspace_invites" DROP COLUMN IF EXISTS "expires_at"');
    await queryRunner.query('ALTER TABLE "workspace_invites" DROP COLUMN IF EXISTS "invite_code"');
  }
}
