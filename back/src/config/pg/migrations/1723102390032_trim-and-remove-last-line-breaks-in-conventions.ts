import { MigrationBuilder } from "node-pg-migrate";

const conventionEndDate = "2024-08-05";

export async function up(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(`
      UPDATE actors
      SET extra_fields = jsonb_set(
                  extra_fields,
                  '{financiaryHelp}',
                  to_jsonb(regexp_replace(trim(extra_fields ->> 'financiaryHelp'), '\\n+$', '', 'g')),
                  false)
      FROM conventions
      WHERE conventions.beneficiary_id = actors.id
        AND DATE(conventions.date_end) > '${conventionEndDate}'
        AND conventions.status = 'ACCEPTED_BY_VALIDATOR';
  `);

  await pgm.sql(`
    UPDATE conventions
    SET
        immersion_skills = REGEXP_REPLACE(TRIM(immersion_skills), '\\n+$', '', 'g')
    WHERE DATE(conventions.date_end) > '${conventionEndDate}'
      AND status = 'ACCEPTED_BY_VALIDATOR'
  `);

  await pgm.sql(`
      UPDATE conventions
      SET
          sanitary_prevention_description = REGEXP_REPLACE(TRIM(sanitary_prevention_description), '\\n+$', '', 'g')
    WHERE DATE(conventions.date_end) > '${conventionEndDate}'
      AND status = 'ACCEPTED_BY_VALIDATOR'
  `);
}

export async function down(): Promise<void> {}
