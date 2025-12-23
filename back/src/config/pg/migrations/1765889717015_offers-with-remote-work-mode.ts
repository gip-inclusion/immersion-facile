import type { MigrationBuilder } from "node-pg-migrate";

const tableName = "immersion_offers";
const columnName = "remote_work_mode";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(tableName, {
    [columnName]: {
      type: "text",
      notNull: true,
      default: "NO_REMOTE",
    },
  });

  pgm.alterColumn(tableName, columnName, {
    default: null,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(tableName, columnName);
}
