import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
      UPDATE establishments_contacts
      SET email = TRIM(email);
  `);
  pgm.sql(`
      UPDATE public.actors
      SET email = TRIM(email);
  `);
  pgm.sql(`
      UPDATE users
      SET email = TRIM(email);
  `);
  pgm.sql(`
      UPDATE discussions
      SET potential_beneficiary_email = TRIM(potential_beneficiary_email),
          establishment_contact_email = TRIM(establishment_contact_email),
          establishment_contact_copy_emails = (
              SELECT CASE
                         WHEN jsonb_array_length(establishment_contact_copy_emails) = 0 THEN '[]'::jsonb
                         ELSE jsonb_agg(TRIM(value::text))
                         END
              FROM jsonb_array_elements(establishment_contact_copy_emails) AS elem(value)
          )
  `);
}

export async function down(): Promise<void> {}
