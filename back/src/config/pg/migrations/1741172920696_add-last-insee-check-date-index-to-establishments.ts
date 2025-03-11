/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex("establishments", "last_insee_check_date", {
    name: "establishments_last_insee_check_date_index",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("establishments", "establishments_last_insee_check_date_index");
}
