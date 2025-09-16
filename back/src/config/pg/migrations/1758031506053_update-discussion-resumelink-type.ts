import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
      UPDATE discussions
      SET potential_beneficiary_resume_link = 'http://' || potential_beneficiary_resume_link
      WHERE potential_beneficiary_resume_link ilike 'www.%'
      `);

  pgm.sql(`
      UPDATE discussions
      SET potential_beneficiary_resume_link = ''
      WHERE potential_beneficiary_resume_link IS NOT NULL
        AND potential_beneficiary_resume_link NOT LIKE 'http%'
  `);

  pgm.sql(`
      UPDATE discussions
      SET potential_beneficiary_resume_link = lower(replace(potential_beneficiary_resume_link, ' ', ''))
      WHERE potential_beneficiary_resume_link IS NOT NULL AND potential_beneficiary_resume_link != ''
      `);
}

export async function down(): Promise<void> {}
