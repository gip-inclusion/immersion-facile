import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

const tableName = "api_consumers";
const columnNames = [
  "contact_first_name",
  "contact_last_name",
  "contact_job",
  "contact_phone",
] as const;
const contactEmailsColumnName = "contact_emails";
const defaultValuesByColumnNames: Record<(typeof columnNames)[number], string> =
  {
    contact_first_name: "inconnu",
    contact_job: "inconnu",
    contact_last_name: "inconnu",
    contact_phone: "0000000000",
  };

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(
    tableName,
    columnNames.reduce<ColumnDefinitions>(
      (agg, columnName) => ({
        ...agg,
        [columnName]: {
          type: "text",
          notNull: true,
          default: defaultValuesByColumnNames[columnName],
        },
      }),
      {},
    ),
  );

  columnNames.forEach((columnName) =>
    pgm.sql(
      `ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP DEFAULT;`,
    ),
  );

  pgm.sql(
    `ALTER TABLE ${tableName} ALTER COLUMN ${contactEmailsColumnName} DROP DEFAULT;`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(tableName, [...columnNames]);
  pgm.alterColumn(tableName, contactEmailsColumnName, { default: "{}" });
}
