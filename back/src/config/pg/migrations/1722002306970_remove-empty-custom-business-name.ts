import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE establishments
    SET customized_name = NULL
    WHERE TRIM(customized_name) = ''
  `);
  pgm.sql(`
    UPDATE form_establishments
    SET business_name_customized = NULL
    WHERE TRIM(business_name_customized) = ''
  `);
  pgm.sql(`
    UPDATE discussions d
    SET business_name = e.name
    FROM establishments e
    WHERE d.siret = e.siret
    AND TRIM(d.business_name) = ''
  `);
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
