import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `UPDATE "users__agencies" ua
    SET role = 'counsellor'
    WHERE (user_id, agency_id, role) IN (
        SELECT sub.user_id, sub.agency_id, sub.role
        FROM (
            SELECT ua.user_id, ua.agency_id, ua.role, au.email, a.validator_emails, au.created_at
            FROM "users__agencies" ua
            LEFT JOIN "authenticated_users" au ON au.id = ua.user_id
            LEFT JOIN "agencies" a ON a.id = ua.agency_id
            WHERE ua.agency_id IN (
                SELECT "id"
                FROM "agencies"
                WHERE CAST("counsellor_emails" AS text) <> '[]'
            )
            AND au.created_at < '2024-01-29'
            AND ua.role = 'validator'
        ) AS sub
        WHERE NOT EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(sub.validator_emails) AS ve(email)
            WHERE sub.email = ve.email
        )
    );`,
  );
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
