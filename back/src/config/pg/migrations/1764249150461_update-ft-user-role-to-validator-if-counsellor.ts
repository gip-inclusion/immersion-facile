/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE users__agencies ua
    SET roles =
      CASE
        WHEN ua.roles ? 'validator' AND NOT ua.roles ? 'counsellor'
          THEN (ua.roles - 'validator') || '"counsellor"'
        WHEN ua.roles ? 'validator' AND ua.roles ? 'counsellor'
          THEN ua.roles - 'validator'
        ELSE ua.roles
      END
    FROM agencies a 
    WHERE ua.agency_id = a.id and a.kind = 'pole-emploi'
  `);
}

export async function down(): Promise<void> {}
