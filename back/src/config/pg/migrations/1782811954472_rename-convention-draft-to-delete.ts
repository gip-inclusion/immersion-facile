/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE outbox
    SET topic = 'ConventionDraftToDelete'
    WHERE topic = 'ConventionDrafToDelete';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE outbox
    SET topic = 'ConventionDrafToDelete'
    WHERE topic = 'ConventionDraftToDelete';
  `);
}
