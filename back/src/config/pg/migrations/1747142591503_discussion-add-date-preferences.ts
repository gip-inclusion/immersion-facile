/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE discussions
    SET potential_beneficiary_date_preferences = ''
    WHERE contact_method = 'EMAIL' 
    AND potential_beneficiary_date_preferences IS NULL  
  `);
}

export async function down(_: MigrationBuilder): Promise<void> {}
