import { MigrationBuilder } from "node-pg-migrate";

const constraintName = "exchanges_discussion_id_unique";
const exchangesTable = "exchanges";
const viewContactRequestName = "view_contact_requests";

const createContactRequestView = (mode: "up" | "down") => `
    CREATE MATERIALIZED VIEW ${viewContactRequestName} AS (
      SELECT discussions.created_at AS "Date de la mise en relation",
        discussions.contact_mode AS "Type de mise en relation",
        discussions.potential_beneficiary_email AS "Email du bénéficiaire potentiel",
        ${
          mode === "up"
            ? `discussions.establishment_contact_email AS "Email de l'établissement",`
            : ""
        }
        discussions.siret AS "Siret",
        discussions.appellation_code AS "Code Appellation",
        a.libelle_appellation_long AS "Appellation",
        a.code_rome AS "Code Rome",
        r.libelle_rome AS "Libellé Rome",
        ${
          mode === "down"
            ? `e.department_name AS "Département", e.region_name AS "Région"`
            : `pdr.department_name AS "Département", pdr.region_name AS "Région",
               discussions.postcode AS "Code Postal"
            `
        }
      FROM discussions
        ${
          mode === "down"
            ? "LEFT JOIN view_siret_with_department_region e ON e.siret = discussions.siret"
            : "LEFT JOIN public_department_region pdr ON pdr.department_code = discussions.department_code"
        }
        LEFT JOIN public_appellations_data a ON a.ogr_appellation = discussions.appellation_code
        LEFT JOIN public_romes_data r ON r.code_rome = a.code_rome
    );`;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // add uniq constraint on dicussion_id and sent_at
  pgm.addConstraint(exchangesTable, constraintName, {
    unique: ["discussion_id", "sent_at"],
  });

  pgm.dropMaterializedView(viewContactRequestName);
  pgm.sql(createContactRequestView("up"));
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(exchangesTable, constraintName);
  pgm.dropMaterializedView(viewContactRequestName);
  pgm.sql(createContactRequestView("down"));
}
