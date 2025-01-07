import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE notifications_email
    SET email_kind = 'ESTABLISHMENT_ASSESSMENT_NOTIFICATION'
    WHERE email_kind = 'CREATE_ASSESSMENT';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE notifications_email
    SET email_kind = 'CREATE_ASSESSMENT'
    WHERE email_kind = 'ESTABLISHMENT_ASSESSMENT_NOTIFICATION';
  `);
}
