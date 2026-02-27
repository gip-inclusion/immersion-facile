/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

const tableName = "short_links";
const currentColumnName = "single_use";
const newColumnName = `old__${currentColumnName}`;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(tableName, currentColumnName, newColumnName);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(tableName, newColumnName, currentColumnName);
}
