import type { MigrationBuilder } from "node-pg-migrate";

const tableName = "users_ongoing_oauths";
const columnName = "id_token";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(tableName, {
    [columnName]: {
      type: "text",
      notNull: false,
      default: null,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(tableName, columnName);
}
