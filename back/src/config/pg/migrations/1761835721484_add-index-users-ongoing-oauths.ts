/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex("users_ongoing_oauths", ["updated_at"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("users_ongoing_oauths", ["updated_at"]);
}
