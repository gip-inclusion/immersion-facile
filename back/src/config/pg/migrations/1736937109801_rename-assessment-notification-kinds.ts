/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE notifications_email
    SET email_kind = 'ASSESSMENT_BENEFICIARY_NOTIFICATION'
    WHERE email_kind = 'BENEFICIARY_ASSESSMENT_NOTIFICATION'
  `);
  pgm.sql(`
    UPDATE notifications_email
    SET email_kind = 'ASSESSMENT_ESTABLISHMENT_NOTIFICATION'
    WHERE email_kind = 'ESTABLISHMENT_ASSESSMENT_NOTIFICATION'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE notifications_email
    SET email_kind = 'BENEFICIARY_ASSESSMENT_NOTIFICATION'
    WHERE email_kind = 'ASSESSMENT_BENEFICIARY_NOTIFICATION'
  `);
  pgm.sql(`
    UPDATE notifications_email
    SET email_kind = 'ESTABLISHMENT_ASSESSMENT_NOTIFICATION'
    WHERE email_kind = 'ASSESSMENT_ESTABLISHMENT_NOTIFICATION'
  `);
}
