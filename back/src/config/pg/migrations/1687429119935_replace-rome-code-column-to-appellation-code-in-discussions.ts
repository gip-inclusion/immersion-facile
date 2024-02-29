import { MigrationBuilder } from "node-pg-migrate";

const discussionTable = "discussions";
const appellationCodeColumn = "appellation_code";
const romeCodeColumn = "rome_code";

const viewContactRequestName = "view_contact_requests";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropMaterializedView(viewContactRequestName);
  pgm.dropConstraint("discussions", "fk_siret");
  pgm.addColumn(discussionTable, {
    [appellationCodeColumn]: {
      type: "integer",
      references: { name: "public_appellations_data" },
    },
  });

  const subquery = `
    SELECT DISTINCT ON (discussions.rome_code, e.siret) io.rome_appellation as appellation_code, discussions.rome_code as rome_code, e.siret
    FROM discussions
    LEFT JOIN establishments e ON e.siret = discussions.siret
    LEFT JOIN immersion_offers io ON e.siret = io.siret
    WHERE io.rome_code = discussions.rome_code 
  `;

  pgm.sql(`
      WITH subquery AS (${subquery})
      UPDATE discussions
      SET appellation_code = subquery.appellation_code
      FROM subquery
      WHERE discussions.rome_code = subquery.rome_code AND discussions.siret = subquery.siret;
    `);

  pgm.sql(`
    WITH d AS (SELECT id, rome_code FROM "discussions" WHERE appellation_code IS NULL)
    UPDATE discussions 
    SET appellation_code = (
      SELECT ogr_appellation
      FROM public_appellations_data
      WHERE public_appellations_data.code_rome = d.rome_code
      LIMIT 1
    )
    FROM d
    WHERE discussions.id = d.id;
  `);

  pgm.alterColumn(discussionTable, appellationCodeColumn, {
    notNull: true,
  });

  pgm.dropColumn(discussionTable, romeCodeColumn);

  pgm.sql(`
    CREATE MATERIALIZED VIEW ${viewContactRequestName} AS (
      SELECT discussions.created_at AS "Date de la mise en relation",
        discussions.contact_mode AS "Type de mise en relation",
        discussions.potential_beneficiary_email AS "Email",
        discussions.siret AS "Siret",
        discussions.${appellationCodeColumn} AS "Code Appellation",
        a.libelle_appellation_long AS "Appellation",
        a.code_rome AS "Code Rome",
        r.libelle_rome AS "Libellé Rome",
        e.department_name AS "Département",
        e.region_name AS "Région"
      FROM discussions
        LEFT JOIN view_siret_with_department_region e ON e.siret = discussions.siret
        LEFT JOIN public_appellations_data a ON a.ogr_appellation = discussions.appellation_code
        LEFT JOIN public_romes_data r ON r.code_rome = a.code_rome
    );`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropMaterializedView(viewContactRequestName);
  pgm.addColumn(discussionTable, {
    [romeCodeColumn]: {
      type: "char(5)",
    },
  });

  // recreate the foreign key constraint
  pgm.addConstraint("discussions", "fk_siret", {
    foreignKeys: [
      {
        columns: "siret",
        references: "establishments",
        referencesConstraintName: "fk_siret",
      },
    ],
  });

  pgm.sql(`
      UPDATE discussions
      SET rome_code = subquery.code_rome
      FROM (
          SELECT ogr_appellation as appellation_code, code_rome
          FROM public_appellations_data
      ) as subquery
      WHERE discussions.appellation_code = subquery.appellation_code;
    `);

  pgm.alterColumn(discussionTable, romeCodeColumn, {
    notNull: true,
  });

  pgm.dropColumn(discussionTable, appellationCodeColumn);

  pgm.sql(`
    CREATE MATERIALIZED VIEW ${viewContactRequestName} AS (
      SELECT discussions.created_at AS "Date de la mise en relation",
        discussions.contact_mode AS "Type de mise en relation",
        discussions.potential_beneficiary_email AS "Email",
        discussions.siret AS "Siret",
        discussions.rome_code AS "Code métier",
        prd.libelle_rome AS "Métier",
        e.department_name AS "Département",
        e.region_name AS "Région"
       FROM discussions
         LEFT JOIN public_romes_data prd ON prd.code_rome = discussions.rome_code
         LEFT JOIN view_siret_with_department_region e ON e.siret = discussions.siret
    );`);
}
