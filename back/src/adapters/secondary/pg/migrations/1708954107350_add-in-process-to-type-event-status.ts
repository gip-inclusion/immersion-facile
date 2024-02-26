import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addTypeValue("event_status", "in-process", { ifNotExists: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // no easy way to remove a type value in node-pg-migrate so we'll just leave it
}
