import { type MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView("view_outbox_failures");
  pgm.dropView("view_outbox");
}

export async function down(): Promise<void> {
  // no need to recreate the views
}
