/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const tableName = "api_consumers";
const contactEmailColumnName = "contact_emails";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(tableName, {
    [contactEmailColumnName]: {
      type: "text[]",
      notNull: true,
      default: "{}",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(tableName, contactEmailColumnName);
}
