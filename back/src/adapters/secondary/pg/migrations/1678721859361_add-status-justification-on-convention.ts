import { MigrationBuilder } from "node-pg-migrate";

const conventionTableName = "conventions";
const columnName = "status_justification";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(conventionTableName, {
    [columnName]: {
      type: "text",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(conventionTableName, columnName);
}
