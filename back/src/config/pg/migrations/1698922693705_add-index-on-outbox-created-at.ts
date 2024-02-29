import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("outbox", ["occurred_at"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("outbox", ["occurred_at"]);
}
