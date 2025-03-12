import type { MigrationBuilder } from "node-pg-migrate";

const tableName = "conventions_to_sync_with_pe";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(tableName, {
    id: { type: "uuid", primaryKey: true },
    status: { type: "text", notNull: true },
    process_date: { type: "timestamptz", notNull: false },
    reason: { type: "text", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(tableName);
}
