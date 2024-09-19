import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE users__agencies
    SET roles = (
      SELECT jsonb_agg(
      CASE 
        WHEN elem::text = '"agencyOwner"' THEN '"agency-admin"'::jsonb
        WHEN elem::text = '"toReview"' THEN '"to-review"'::jsonb
        ELSE elem
      END
    )
    FROM jsonb_array_elements(roles) AS elem
    )
    WHERE roles ? 'agencyOwner' OR roles ? 'toReview';
    `);
}

export async function down(): Promise<void> {}
