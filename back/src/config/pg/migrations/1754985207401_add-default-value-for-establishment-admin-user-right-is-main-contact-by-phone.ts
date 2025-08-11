/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE establishments__users
    SET is_main_contact_by_phone = false
    WHERE role = 'establishment-admin'
      AND is_main_contact_by_phone IS NULL;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE establishments__users
    SET is_main_contact_by_phone = NULL
    WHERE role = 'establishment-admin'
      AND is_main_contact_by_phone = false;
  `);
}
