/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex("establishments", "update_date");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("establishments", "update_date");
}
