import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("actors", "email");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("actors", "email");
}
