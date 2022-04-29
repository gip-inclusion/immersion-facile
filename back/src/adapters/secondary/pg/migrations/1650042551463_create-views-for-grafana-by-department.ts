/* eslint-disable no-useless-escape */

import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createView(
    "view_agencies_by_department",
    { replace: true },
    `
    WITH agencies_with_postal_code AS
      (SELECT name, kind, (regexp_match(address, '\d{5}'))[1] AS postal_code
       FROM agencies)
    SELECT name, kind, department FROM agencies_with_postal_code AS a
    LEFT JOIN postal_code_department_region AS pcdr ON pcdr.postal_code = a.postal_code
    ORDER BY department
  `,
  );

  pgm.createView(
    "view_offers_by_department",
    { replace: true },
    `
    WITH offers_by_department AS 
      (WITH establishments_by_department AS 
         (WITH form_establishments_postal_code AS 
            (SELECT siret, (regexp_match(address,  '\d{5}'))[1] AS postal_code
             FROM establishments WHERE data_source = 'form')
         SELECT siret, department
         FROM form_establishments_postal_code AS fepc
         LEFT JOIN postal_code_department_region AS pcdr ON pcdr.postal_code = fepc.postal_code) 
      SELECT io.siret, department, rome_code, rome_appellation
      FROM establishments_by_department AS ebd
      LEFT JOIN immersion_offers AS io ON io.siret = ebd.siret 
      ORDER BY siret) 
    SELECT e.siret, name, department, 
    coalesce(libelle_appellation_long, libelle_rome) AS offer_job
    FROM offers_by_department obd
    LEFT JOIN public_romes_data prd on prd.code_rome = obd.rome_code 
    LEFT JOIN public_appellations_data pad on pad.ogr_appellation = obd.rome_appellation 
    LEFT JOIN establishments e on e.siret = obd.siret`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView("view_agencies_by_department");
  pgm.dropView("view_offers_by_department");
}
