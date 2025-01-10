/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
      ALTER TABLE "immersion_assessments"
          ALTER COLUMN number_of_missed_hours TYPE NUMERIC(5, 2) USING number_of_missed_hours::NUMERIC(5, 2);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
      ALTER TABLE "immersion_assessments"
          ALTER COLUMN number_of_missed_hours TYPE INTEGER
  `);
}
