/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const handledByAgencyColumnName = "handled_by_agency";
const viewConventionsErroredName = "view_conventions_errored";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("saved_errors", {
    [handledByAgencyColumnName]: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  });

  pgm.createView(
    viewConventionsErroredName,
    {},
    `with ranked_errors AS (
      SELECT 
        se.*,
        ROW_NUMBER() OVER (PARTITION BY se.params ->> 'conventionId' ORDER BY se.occurred_at DESC) AS rn 
      FROM saved_errors se
        WHERE (
              se.message = 'Identifiant National DE trouvé mais écart sur la date de naissance'
            OR 
              se.message = 'Identifiant National DE non trouvé'
            )
          AND 
            (
              se.params ->> 'httpStatus')::bigint = 404 
            AND 
              se.service_name = 'PoleEmploiGateway.notifyOnConventionUpdated'
            AND 
              se.handled_by_agency = false  
            )
       SELECT
          c.id,
          re.message,
          a.name AS "Structure",
          c.date_submission AS "Date de la demande",
          c.date_validation AS "Date de validation",
          c.status AS "Statut",
          c.date_start AS "Date de début",
          c.date_end AS "Date de fin",
          c.immersion_objective AS "Objectif de l'immersion",
          pad.libelle_appellation_long AS "Métier observé",
          ((c.schedule -> 'totalHours'::text))::numeric AS "Total heures d'immersion",
          CASE
              WHEN (b.signed_at IS NOT NULL) THEN 'Oui'::text
              ELSE 'Non'::text
          END AS "Accepté par le bénéficiaire",
          concat(b.first_name, ' ', b.last_name) AS "Bénéficiaire",
          b.email AS "Email bénéficiaire",
          b.phone AS "Téléphone bénéficiaire",
          ((b.extra_fields ->> 'birthdate'::text))::timestamp with time zone AS "Date de naissance du bénéficiaire",
          c.siret AS "Siret"
      FROM ranked_errors re
      LEFT JOIN conventions c ON (c.id = (re.params ->> 'conventionId')::uuid)
      LEFT JOIN agencies a ON (a.id = c.agency_id)
      LEFT JOIN public_appellations_data pad ON (pad.ogr_appellation = c.immersion_appellation)
      LEFT JOIN actors b ON (c.beneficiary_id = b.id)
      WHERE re.rn =1;`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView(viewConventionsErroredName);
  pgm.dropColumns("saved_errors", [handledByAgencyColumnName]);
}
