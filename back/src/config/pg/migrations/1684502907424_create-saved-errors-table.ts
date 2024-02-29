import { MigrationBuilder } from "node-pg-migrate";

const savedErrorsTable = "saved_errors";
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(savedErrorsTable, {
    id: { type: "serial", primaryKey: true },
    service_name: { type: "text", notNull: true },
    http_status: { type: "integer", notNull: true },
    message: { type: "text", notNull: true },
    params: { type: "jsonb", notNull: false },
    occurred_at: { type: "timestamptz", notNull: true },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(savedErrorsTable);
}
