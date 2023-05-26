import { MigrationBuilder } from "node-pg-migrate";

const savedErrorsTable = "saved_errors";
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(savedErrorsTable, "http_status");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(savedErrorsTable, {
    http_status: { type: "integer", notNull: true, default: 404 },
  });
}
