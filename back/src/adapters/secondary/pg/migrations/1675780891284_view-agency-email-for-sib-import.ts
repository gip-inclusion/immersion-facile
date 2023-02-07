import { MigrationBuilder } from "node-pg-migrate";
const viewAgencyMailForSib = "view_agency_email_for_sib_import";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createView(viewAgencyMailForSib, {}, viewAgenciesMailForSib);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView(viewAgencyMailForSib);
}

// We want only one mail per agency and some data columns for filtering on the SiB interface
const viewAgenciesMailForSib = `
    SELECT a.id,
        a.name AS nom,
        regexp_replace(((a.validator_emails -> 0))::text, '["]'::text, ''::text, 'g'::text) AS email,
        a.kind AS type,
        a.status AS statut,
        to_char(a.created_at, 'DD/MM/YYYY'::text) AS creation_date,
        a.post_code AS postal_code,
        a.agency_siret AS agency_siret,
        pdr.department_name AS department,
        pdr.region_name AS region
       FROM (agencies a
         LEFT JOIN public_department_region pdr ON ((pdr.department_code = a.department_code)))
      ORDER BY pdr.department_name;
  `;
