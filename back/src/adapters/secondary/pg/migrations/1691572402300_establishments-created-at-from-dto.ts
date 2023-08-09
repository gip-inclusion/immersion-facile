import { MigrationBuilder } from "node-pg-migrate";

const tableName = "establishments";
const columnName = "created_at";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(tableName, columnName, {
    default: null,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(tableName, columnName, {
    default: pgm.func("now()"),
  });
}
