import { MigrationBuilder } from "node-pg-migrate";

const tableName = "exchanges";
const columnName = "attachments";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(tableName, {
    [columnName]: { type: "jsonb", notNull: true, default: "[]" },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(tableName, columnName);
}
