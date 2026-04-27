import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  const minDateString = "1900-01-01";
  const minDateIsoString = "1900-01-01 00:00:00+00";
  const maxDateString = "2031-01-01";
  const maxDateIsoString = "2031-01-01 00:00:00+00";

  pgm.sql(`
    UPDATE actors
    SET extra_fields = jsonb_set(extra_fields, '{birthdate}', 
      CASE 
        -- On utilise LEFT pour normaliser à 10 caractères avant de tester
        WHEN (LEFT(extra_fields->>'birthdate', 10))::date < '${minDateString}' THEN '"${minDateString}"'::jsonb
        WHEN (LEFT(extra_fields->>'birthdate', 10))::date > '${maxDateString}' THEN '"${maxDateString}"'::jsonb
      END
    )
    WHERE extra_fields ? 'birthdate'
    AND extra_fields->>'birthdate' ~ '^\\d{4}-\\d{2}-\\d{2}'
    AND (
      (LEFT(extra_fields->>'birthdate', 10))::date < '${minDateString}' 
      OR 
      (LEFT(extra_fields->>'birthdate', 10))::date > '${maxDateString}'
    )
  `);

  pgm.sql(`
    UPDATE establishments
    SET next_availability_date = 
      CASE 
        WHEN next_availability_date < '${minDateString}' THEN '${minDateIsoString}'::timestamptz
        WHEN next_availability_date > '${maxDateString}' THEN '${maxDateIsoString}'::timestamptz
      END
    WHERE next_availability_date IS NOT NULL 
    AND (
      next_availability_date < '${minDateString}' 
      OR 
      next_availability_date > '${maxDateString}'
    )
  `);

  pgm.sql(`
    UPDATE immersion_assessments
    SET last_day_of_presence = 
      CASE 
        WHEN last_day_of_presence < '${minDateString}' THEN '${minDateIsoString}'::timestamptz
        WHEN last_day_of_presence > '${maxDateString}' THEN '${maxDateIsoString}'::timestamptz
      END
    WHERE last_day_of_presence IS NOT NULL 
    AND (
      last_day_of_presence < '${minDateString}'
      OR 
      last_day_of_presence > '${maxDateString}'
    );
  `);

  pgm.sql(`
    UPDATE immersion_assessments
    SET contract_start_date = 
      CASE 
        WHEN contract_start_date < '${minDateString}' THEN '${minDateIsoString}'::timestamptz
        WHEN contract_start_date > '${maxDateString}' THEN '${maxDateIsoString}'::timestamptz
      END
    WHERE contract_start_date IS NOT NULL 
    AND (
      contract_start_date < '${minDateString}'
      OR
      contract_start_date > '${maxDateString}'
    );
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {}
