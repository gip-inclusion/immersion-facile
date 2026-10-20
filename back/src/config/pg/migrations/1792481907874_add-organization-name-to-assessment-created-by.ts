import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE immersion_assessments AS ass
    SET created_by = jsonb_set(
      ass.created_by,
      '{organizationName}',
      to_jsonb(
        CASE
          WHEN ass.created_by->>'role' = 'establishment-tutor'
            THEN COALESCE(NULLIF(TRIM(c.business_name_customized), ''), c.business_name)
          WHEN ass.created_by->>'role' = 'validator'
            THEN COALESCE(refers.name, a.name)
          ELSE a.name
        END
      ),
      true
    )
    FROM conventions c
    JOIN agencies a ON a.id = c.agency_id
    LEFT JOIN agencies refers ON refers.id = a.refers_to_agency_id
    WHERE ass.convention_id = c.id
      AND ass.created_by IS NOT NULL
      AND NULLIF(ass.created_by->>'organizationName', '') IS NULL;
  `);
}

export async function down(_: MigrationBuilder): Promise<void> {}
