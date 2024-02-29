import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `UPDATE actors
  SET extra_fields = jsonb_set(extra_fields::jsonb, '{businessAddress}', '"Adresse non fournie"', true)
  WHERE id IN (
      SELECT beneficiary_current_employer_id
      FROM "conventions"
      WHERE "beneficiary_current_employer_id" IS NOT NULL
  )
  AND (extra_fields ->> 'businessAddress') IS NULL;`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`UPDATE actors
  SET extra_fields = extra_fields - 'businessAddress'
  WHERE id IN (
      SELECT beneficiary_current_employer_id
      FROM "conventions"
      WHERE "beneficiary_current_employer_id" IS NOT NULL
  )
  AND (extra_fields ->> 'businessAddress') = 'Adresse non fournie';
  `);
}
