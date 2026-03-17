"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddParentWorkspaceToWorkspaces1710520000000 = void 0;
class AddParentWorkspaceToWorkspaces1710520000000 {
    name = 'AddParentWorkspaceToWorkspaces1710520000000';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "workspaces"
      ADD COLUMN IF NOT EXISTS "parent_workspace_id" uuid NULL
    `);
        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_workspaces_parent_workspace'
            AND table_name = 'workspaces'
        ) THEN
          ALTER TABLE "workspaces"
          ADD CONSTRAINT "FK_workspaces_parent_workspace"
          FOREIGN KEY ("parent_workspace_id") REFERENCES "workspaces"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_workspaces_parent_workspace_id"
      ON "workspaces" ("parent_workspace_id")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_workspaces_parent_workspace_id"');
        await queryRunner.query('ALTER TABLE "workspaces" DROP CONSTRAINT IF EXISTS "FK_workspaces_parent_workspace"');
        await queryRunner.query('ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "parent_workspace_id"');
    }
}
exports.AddParentWorkspaceToWorkspaces1710520000000 = AddParentWorkspaceToWorkspaces1710520000000;
//# sourceMappingURL=1710520000000-AddParentWorkspaceToWorkspaces.js.map