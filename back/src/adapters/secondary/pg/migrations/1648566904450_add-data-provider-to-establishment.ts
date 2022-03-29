/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("data_provider", {
    source: {
      type: "varchar(255)",
      default: "immersion-facile",
    },
  });

  // Retrieve data from forms

  // Easy ones : set data_provider from form nomenclature, is commited and customized name
  // ------------------------------------------------------------------
  await pgm.sql(`
    WITH cci_from_form AS (SELECT * FROM form_establishments) 
    UPDATE establishments
    SET data_provider = 'cci' 
       FROM cci_from_form
    WHERE establishments.siret = cci_from_form.siret;
  `)
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("form_establishments", "data_provider");
}