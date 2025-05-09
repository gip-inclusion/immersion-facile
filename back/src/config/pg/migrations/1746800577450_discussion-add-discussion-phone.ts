/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE discussions
    SET potential_beneficiary_phone = '+33600000000'
    WHERE contact_method = 'EMAIL' 
    AND potential_beneficiary_phone IS NULL  
  `);
}

export async function down(_: MigrationBuilder): Promise<void> {}
