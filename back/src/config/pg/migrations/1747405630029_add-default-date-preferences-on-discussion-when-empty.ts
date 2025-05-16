import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE discussions
    SET potential_beneficiary_date_preferences = 'Dates d’immersion envisagées non renseignées'
    WHERE potential_beneficiary_date_preferences = '' AND contact_method = 'EMAIL'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE discussions
    SET potential_beneficiary_date_preferences = ''
    WHERE potential_beneficiary_date_preferences = 'Dates d’immersion envisagées non renseignées' AND contact_method = 'EMAIL' AND acquisition_campaign = 'api-consumer'
  `);
}
