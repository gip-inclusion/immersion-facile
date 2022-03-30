/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("source_provider", {
    source: {
      type: "varchar(255)",
    },
  });

  await pgm.sql(`
    WITH cci_from_form AS (SELECT siret FROM form_establishments WHERE source = 'cci') 
    UPDATE establishments
    SET source_provider = 'cci' 
       FROM cci_from_form
    WHERE establishments.siret = cci_from_form.siret;
  `);

  await pgm.sql(`
    WITH ujus_from_form AS (SELECT siret FROM form_establishments WHERE source = 'unJeuneUneSolution') 
    UPDATE establishments
    SET source_provider = 'unJeuneUneSolution' 
       FROM ujus_from_form
    WHERE establishments.siret = ujus_from_form.siret;
  `);

  await pgm.sql(`
    WITH imf_from_form AS (SELECT siret FROM form_establishments WHERE source = 'immersion-facile') 
    UPDATE establishments
    SET source_provider = 'immersion-facile' 
       FROM imf_from_form
    WHERE establishments.siret = immersion-facile_from_form.siret;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("form_establishments", "source_provider");
}
