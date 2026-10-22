import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addTypeValue("discussion_rejection_kind", "CLOSED_BY_CANDIDATE", {
    ifNotExists: true,
  });
}

export async function down(): Promise<void> {}
