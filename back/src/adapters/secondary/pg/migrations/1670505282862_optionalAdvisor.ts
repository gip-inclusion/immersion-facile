import { MigrationBuilder } from "node-pg-migrate";

const tableName = "partners_pe_connect";
const columnNames = ["firstname", "lastname", "email", "type"];

/* eslint-disable @typescript-eslint/naming-convention */
export async function up(pgm: MigrationBuilder): Promise<void> {
  columnNames.forEach((columnName) =>
    pgm.alterColumn(tableName, columnName, {
      notNull: false,
    }),
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  columnNames.forEach((columnName) =>
    pgm.alterColumn(tableName, columnName, {
      notNull: true,
    }),
  );
}
