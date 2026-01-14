/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("agencies", {
    contact_email: { type: "text", notNull: false },
  });

  pgm.sql(`
    WITH notified_counsellors AS (
      SELECT DISTINCT ON (ua.agency_id)
        ua.agency_id,
        u.email
      FROM users__agencies ua
      INNER JOIN users u ON u.id = ua.user_id
      INNER JOIN agencies a ON a.id = ua.agency_id
      WHERE ua.is_notified_by_email = true
        AND ua.roles @> '["counsellor"]'::jsonb
        AND a.refers_to_agency_id IS NOT NULL
      ORDER BY ua.agency_id, u.email
    )
    UPDATE agencies a
    SET contact_email = nc.email
    FROM notified_counsellors nc
    WHERE a.id = nc.agency_id
  `);

  pgm.sql(`
    WITH notified_validators AS (
      SELECT DISTINCT ON (ua.agency_id)
        ua.agency_id,
        u.email
      FROM users__agencies ua
      INNER JOIN users u ON u.id = ua.user_id
      INNER JOIN agencies a ON a.id = ua.agency_id
      WHERE ua.is_notified_by_email = true
        AND ua.roles @> '["validator"]'::jsonb
        AND a.refers_to_agency_id IS NULL
      ORDER BY ua.agency_id, u.email
    )
    UPDATE agencies a
    SET contact_email = nv.email
    FROM notified_validators nv
    WHERE a.id = nv.agency_id
  `);

  pgm.alterColumn("agencies", "contact_email", {
    type: "text",
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("agencies", "contact_email");
}
