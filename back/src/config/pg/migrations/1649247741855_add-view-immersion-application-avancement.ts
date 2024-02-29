import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createView(
    "view_application_avancement",
    {},
    `
      SELECT ia.date_start,
        ia.status,
        (ia.date_end - ia.date_start) AS duration,
        a.name AS agency_name,
        ia.business_name,
        appellation_label,
        a.address AS agency_address,
        a.counsellor_emails AS agency_counsellor_emails,
        a.validator_emails AS agency_validator_emails,
        ia.email AS candidate_email,
        ia.first_name AS candidate_prenom,
        ia.last_name AS candidate_nom,
        ia.phone AS candidate_phone,
        ia.mentor,
        ia.mentor_phone,
        ia.mentor_email
      FROM (immersion_applications AS ia
        JOIN agencies a ON ((a.id = ia.agency_id)))
        JOIN view_appellations_dto AS vad ON vad.appellation_code = ia.immersion_appellation
        ORDER BY ia.date_start DESC;
  `,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView("view_application_avancement");
}
