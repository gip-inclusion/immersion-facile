/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

const tableName = "establishments__users";
const columnName = "should_receive_discussion_notifications";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropMaterializedView("view_contact_requests");

  pgm.addColumn(tableName, {
    [columnName]: {
      type: "boolean",
      notNull: true,
      default: true,
    },
  });
  pgm.alterColumn(tableName, columnName, {
    default: null,
  });

  pgm.sql(`
    CREATE TABLE __to_delete__discussion_contacts AS
    SELECT 
      id AS discussion_id,
      establishment_contact_email,
      establishment_contact_first_name,
      establishment_contact_last_name,
      establishment_contact_phone,
      establishment_contact_job,
      establishment_contact_copy_emails
    FROM discussions;

    ALTER TABLE exchanges
      ADD COLUMN establishment_first_name text,
      ADD COLUMN establishment_last_name text,
      ADD COLUMN establishment_email text;

    UPDATE exchanges e
    SET 
      establishment_first_name = t.establishment_contact_first_name,
      establishment_last_name = t.establishment_contact_last_name,
      establishment_email = t.establishment_contact_email
    FROM __to_delete__discussion_contacts t
    WHERE e.discussion_id = t.discussion_id;

    ALTER TABLE discussions
      DROP COLUMN establishment_contact_email,
      DROP COLUMN establishment_contact_first_name,
      DROP COLUMN establishment_contact_last_name,
      DROP COLUMN establishment_contact_phone,
      DROP COLUMN establishment_contact_job,
      DROP COLUMN establishment_contact_copy_emails;

    ALTER TABLE exchanges
      DROP COLUMN recipient;
  `);

  pgm.sql(createContactRequestView("up"));
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropMaterializedView("view_contact_requests");

  pgm.dropColumn(tableName, columnName);

  pgm.sql(`
    ALTER TABLE discussions
      ADD COLUMN establishment_contact_email text,
      ADD COLUMN establishment_contact_first_name text,
      ADD COLUMN establishment_contact_last_name text,
      ADD COLUMN establishment_contact_phone text,
      ADD COLUMN establishment_contact_job text,
      ADD COLUMN establishment_contact_copy_emails jsonb;

    UPDATE discussions d
    SET
      establishment_contact_email = t.establishment_contact_email,
      establishment_contact_first_name = t.establishment_contact_first_name,
      establishment_contact_last_name = t.establishment_contact_last_name,
      establishment_contact_phone = t.establishment_contact_phone,
      establishment_contact_job = t.establishment_contact_job,
      establishment_contact_copy_emails = t.establishment_contact_copy_emails
    FROM __to_delete__discussion_contacts t
    WHERE d.id = t.discussion_id;

    ALTER TABLE exchanges
      DROP COLUMN establishment_first_name,
      DROP COLUMN establishment_last_name,
      DROP COLUMN establishment_email;

    DROP TABLE IF EXISTS __to_delete__discussion_contacts;

    ALTER TABLE exchanges
      ADD COLUMN recipient exchange_role;

    UPDATE exchanges
    SET 
      recipient = CASE sender WHEN 'establishment' THEN 'potentialBeneficiary'::exchange_role ELSE 'establishment'::exchange_role END;
  `);

  pgm.sql(createContactRequestView("down"));
}

const createContactRequestView = (
  mode: "up" | "down",
) => `CREATE MATERIALIZED VIEW view_contact_requests AS (
  SELECT 
    d.created_at AS "Date de la mise en relation",
    d.contact_method AS "Type de mise en relation",
    d.potential_beneficiary_email AS "Email du bénéficiaire potentiel",
    ${
      mode === "up"
        ? "COALESCE(e.contact_emails, '')"
        : "d.establishment_contact_email"
    } AS "Email de l'établissement",
    d.siret AS "Siret",
    d.appellation_code AS "Code Appellation",
    a.libelle_appellation_long AS "Appellation",
    a.code_rome AS "Code Rome",
    r.libelle_rome AS "Libellé Rome",
    pdr.department_name AS "Département",
    pdr.region_name AS "Région",
    d.postcode AS "Code Postal"
  FROM discussions d
  LEFT JOIN public_department_region pdr ON pdr.department_code = d.department_code
  LEFT JOIN public_appellations_data a ON a.ogr_appellation = d.appellation_code
  LEFT JOIN public_romes_data r ON r.code_rome = (a.code_rome)::bpchar
  ${
    mode === "up"
      ? `
    LEFT JOIN (
      SELECT
        eu.siret,
        STRING_AGG(u.email, ', ') AS contact_emails
      FROM establishments__users eu
      JOIN users u ON u.id = eu.user_id
      GROUP BY eu.siret
    ) e ON e.siret = d.siret`
      : ""
  }
);`;
