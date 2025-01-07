import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE form_establishments
    SET business_contact = business_contact::jsonb || ('{"copyEmails": []}' )::jsonb
    WHERE business_contact ->> 'copyEmails' is null
  `);
}

export async function down(): Promise<void> {}
