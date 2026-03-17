"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddManagerUserToWorkspaces1710620000000 = void 0;
class AddManagerUserToWorkspaces1710620000000 {
    name = 'AddManagerUserToWorkspaces1710620000000';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "workspaces"
      ADD COLUMN IF NOT EXISTS "manager_user_id" uuid NULL
    `);
        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_workspaces_manager_user'
            AND table_name = 'workspaces'
        ) THEN
          ALTER TABLE "workspaces"
          ADD CONSTRAINT "FK_workspaces_manager_user"
          FOREIGN KEY ("manager_user_id") REFERENCES "users"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_workspaces_manager_user_id"
      ON "workspaces" ("manager_user_id")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_workspaces_manager_user_id"');
        await queryRunner.query('ALTER TABLE "workspaces" DROP CONSTRAINT IF EXISTS "FK_workspaces_manager_user"');
        await queryRunner.query('ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "manager_user_id"');
    }
}
exports.AddManagerUserToWorkspaces1710620000000 = AddManagerUserToWorkspaces1710620000000;
//# sourceMappingURL=1710620000000-AddManagerUserToWorkspaces.js.map