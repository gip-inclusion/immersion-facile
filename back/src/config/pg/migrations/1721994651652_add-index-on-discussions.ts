import { MigrationBuilder } from "node-pg-migrate";

const tableName = "discussions";
const columnNames = [
  "establishment_contact_email",
  "potential_beneficiary_email",
  "appellation_code",
];

export async function up(pgm: MigrationBuilder): Promise<void> {
  columnNames.forEach((columnName) => pgm.addIndex(tableName, columnName));
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  columnNames.forEach((columnName) => pgm.dropIndex(tableName, columnName));
}
