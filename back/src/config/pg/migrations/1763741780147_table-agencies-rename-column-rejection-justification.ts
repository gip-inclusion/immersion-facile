/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    "ALTER TABLE agencies RENAME COLUMN rejection_justification TO status_justification;",
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    "ALTER TABLE agencies RENAME COLUMN status_justification TO rejection_justification;",
  );
}
