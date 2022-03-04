/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // When there are multiple form establishments for same siret, keep only the latest
  await pgm.sql(`
  WITH form_establishments_ids_to_remove AS (SELECT id FROM
      (SELECT id, siret, updated_at, ROW_NUMBER() OVER 
      (PARTITION BY (siret) ORDER BY updated_at DESC) row_number
       FROM form_establishments) partitionned WHERE row_number > 1)
  
  DELETE FROM form_establishments all_forms 
  WHERE EXISTS (
     SELECT FROM form_establishments_ids_to_remove forms_to_remove
     WHERE  forms_to_remove.id = all_forms.id);`);

  pgm.dropConstraint("form_establishments", "form_establishments_pkey");
  pgm.addConstraint("form_establishments", "form_establishments_pkey", {
    primaryKey: "siret",
  });
  pgm.dropColumn("form_establishments", "id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("form_establishments", "form_establishments_pkey");

  await pgm.sql(
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
     ALTER TABLE form_establishments ADD id uuid PRIMARY KEY DEFAULT uuid_generate_v4();`,
  );
}
