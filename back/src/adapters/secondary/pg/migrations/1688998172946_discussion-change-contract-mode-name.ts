/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const tableName = "discussions";
const oldColumnName = "contact_mode";
const newColumnName = "contact_method";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(tableName, oldColumnName, newColumnName);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(tableName, newColumnName, oldColumnName);
}
