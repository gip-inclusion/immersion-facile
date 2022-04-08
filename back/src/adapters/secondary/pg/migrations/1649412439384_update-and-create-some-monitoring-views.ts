/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView("view_application_avancement", { ifExists: true });
  pgm.dropView("view_daily_immersion_application_events", { ifExists: true });
  pgm.dropView("view_immersion_application_accepted_by_validator", {
    ifExists: true,
  });

  pgm.createView(
    "view_application_avancement",
    {},
    `SELECT 
      ia.id, 
      ia.updated_at AS "dernière mise à jour",
      ia.date_start AS "date de début",
      ia.status AS "statut",
      ia.enterprise_accepted AS "acceptée par l'entreprise", 
      ia.beneficiary_accepted AS "accepté par le bénéficiaire",
      (ia.date_end - ia.date_start) AS "durée",
      a.name AS "nom de l'agence",
      ia.business_name AS "nom de l'entreprise",
      vad.appellation_label AS "métier",
      a.address AS "adresse de l'agence",
      a.counsellor_emails AS "email du conseiller",
      a.validator_emails AS "email du validateur",
      ia.email AS "email de du bénéficiaire",
      ia.first_name AS "prénom du bénéficiaire",
      ia.last_name AS "nom du bénéficiaire",
      ia.phone AS "téléphone du bénéficiaire",
      ia.mentor AS "mentor",
      ia.mentor_phone AS "téléphone du mentor",
      ia.mentor_email AS "email du mentor"
    FROM ((immersion_applications ia
      JOIN agencies a ON ((a.id = ia.agency_id)))
      JOIN view_appellations_dto vad ON ((vad.appellation_code = ia.immersion_appellation)))
    ORDER BY ia.date_start DESC
  `,
  );
  pgm.createView(
    "view_daily_immersion_application_events",
    {},
    `
    WITH daily_view AS(
      WITH filtered_events AS 
      (
      SELECT
      occurred_at, topic, payload ->> 'id' AS application_id
      FROM outbox 
      WHERE topic like 'ImmersionApplication%'
      AND occurred_at::date = (current_date - INTEGER '1')::date
      ORDER BY occurred_at DESC 
      )
      SELECT DISTINCT ON (application_id) 
      occurred_at AS "date de l'évènement", topic AS "sujet de l'évènement", view_application_avancement.*
      FROM filtered_events
      LEFT JOIN view_application_avancement ON (view_application_avancement.id)::text = filtered_events.application_id
      )
      SELECT * FROM daily_view ORDER BY "date de l'évènement" ASC
  `,
  );
  pgm.createView(
    "view_immersion_application_accepted_by_validator",
    {},
    `
    WITH filtered_outbox AS (
      SELECT outbox.occurred_at,
        outbox.payload,
        (outbox.payload ->> 'agencyId'::text) AS agency_id
        FROM outbox
      WHERE ((outbox.topic)::text = 'ImmersionApplicationAcceptedByValidator'::text)
    )
    SELECT 
    occurred_at AS "date de validation",
    agencies.name AS "nom de l'agence",
    concat((filtered_outbox.payload ->> 'firstName'::text), ' ', (filtered_outbox.payload ->> 'lastName'::text)) AS "nom de l'applicant",
    (filtered_outbox.payload ->> 'email'::text) AS "email de l'applicant",
    (filtered_outbox.payload ->> 'phone'::text) AS "numéro de l'applicant",
    (filtered_outbox.payload ->> 'dateStart'::text) AS "date début",
    (filtered_outbox.payload ->> 'dateEnd'::text) AS "date fin"
    FROM (filtered_outbox
    LEFT JOIN agencies ON (((agencies.id)::text = filtered_outbox.agency_id)))
    ORDER BY filtered_outbox.occurred_at DESC
  `,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView("view_daily_immersion_application_events");
  pgm.dropView("view_immersion_application_accepted_by_validator");
}
