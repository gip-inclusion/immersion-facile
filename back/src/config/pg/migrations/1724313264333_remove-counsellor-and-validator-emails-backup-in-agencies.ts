import { MigrationBuilder } from "node-pg-migrate";

const viewAgencies = "view_agencies";
const viewAgenciesSibImport = "view_agency_email_for_sib_import";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView("view_conventions");
  pgm.dropView(viewAgencies);
  pgm.dropView(viewAgenciesSibImport);

  pgm.dropColumn("agencies", [
    "counsellor_emails_backup",
    "validator_emails_backup",
  ]);

  pgm.createView(
    viewAgencies,
    {},
    `SELECT a.id,
    a.name AS "Nom",
    a.code_safir AS "Code Safir",
    a.kind AS "Type",
    a.status AS "Statut",
    a.created_at AS "Date de création",
    a.street_number_and_address AS "Adresse",
    a.post_code AS "Code Postal",
    pdr.department_name AS "Département",
    pdr.region_name AS "Région"
   FROM (agencies a
     LEFT JOIN public_department_region pdr ON ((pdr.department_code = a.department_code)))
  ORDER BY pdr.department_name;`,
  );

  pgm.createView(
    viewAgenciesSibImport,
    {},
    `SELECT a.id,
    a.name AS nom,
    a.kind AS type,
    a.status AS statut,
    to_char(a.created_at, 'DD/MM/YYYY'::text) AS creation_date,
    a.post_code AS postal_code,
    a.agency_siret,
    pdr.department_name AS department,
    pdr.region_name AS region
   FROM (agencies a
     LEFT JOIN public_department_region pdr ON ((pdr.department_code = a.department_code)))
  ORDER BY pdr.department_name;`,
  );
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
