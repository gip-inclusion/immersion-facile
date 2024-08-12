/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(`
     WITH 
    agenciesWithTwoStepsValidation as (
      SELECT agency_id
      FROM "users__agencies"
      WHERE roles::text LIKE '%counsellor%'
      AND is_notified_by_email IS true
    ), 
    usersToUpdate as (
      SELECT user_id, agency_id
      FROM "users__agencies"
      WHERE roles::text LIKE '%counsellor%'
      AND agency_id NOT IN (
        SELECT * 
        FROM agenciesWithTwoStepsValidation
      )
    )
    UPDATE users__agencies
    SET roles = '["agency-viewer"]'::jsonb
    FROM usersToUpdate
    WHERE users__agencies.user_id = usersToUpdate.user_id 
    AND users__agencies.agency_id = usersToUpdate.agency_id
  `);
}

export async function down(): Promise<void> {}
