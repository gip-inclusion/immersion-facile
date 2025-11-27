/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE users__agencies ua
    SET roles =
      CASE
        WHEN ua.roles ? 'counsellor' AND NOT ua.roles ? 'validator'
          THEN (ua.roles - 'counsellor') || '"validator"'
        WHEN ua.roles ? 'validator' AND ua.roles ? 'counsellor'
          THEN ua.roles - 'counsellor'
        ELSE ua.roles
      END
    FROM agencies a 
    WHERE ua.agency_id = a.id and a.kind = 'pole-emploi'
  `);
}

export async function down(): Promise<void> {}
