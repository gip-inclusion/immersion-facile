import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addTypeValue("discussion_rejection_kind", "DEPRECATED", {
    ifNotExists: true,
  });
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
