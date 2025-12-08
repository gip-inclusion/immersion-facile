/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

const defaultClosedJustification = "Motif de fermeture par défaut";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE "agencies" 
    SET "status_justification" = '${defaultClosedJustification}'
    WHERE "status" = 'closed' 
    AND "status_justification" IS NULL;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE "agencies" 
    SET "status_justification" = NULL
    WHERE "status" = 'closed' 
    AND "status_justification" = '${defaultClosedJustification}';
  `);
}
