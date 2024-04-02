import { MigrationBuilder } from "node-pg-migrate";

const conventionTable = "conventions";
const columnName = "validators";
const defaultValue = { agencyValidator: { lastname: "N/A", firstname: "N/A" } };
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${conventionTable} SET ${columnName} = '${JSON.stringify(
      defaultValue,
    )}'
    WHERE ${columnName} IS NULL;
  `);

  pgm.alterColumn(conventionTable, columnName, {
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(conventionTable, columnName, {
    notNull: false,
  });
  pgm.sql(`
    UPDATE
      ${conventionTable}
    SET
      ${columnName} = NULL
    WHERE
      ${columnName} = '${JSON.stringify(defaultValue)}';
  `);
}
