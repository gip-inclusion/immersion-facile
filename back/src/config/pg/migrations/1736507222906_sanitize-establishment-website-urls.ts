import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  await pgm.db.query(`
      UPDATE establishments
      SET website = LOWER(TRIM(website))
      WHERE website IS NOT NULL
        AND website != '';
  `);

  await pgm.db.query(`
      UPDATE establishments
      SET website = 'https://' || website
      WHERE website IS NOT NULL
        AND website != ''
        AND website ~
            '^(www\\.)?([\\w-]+\\.)+[a-z]{2,}(/[^"\\s<>'']*)*/?(\\?[^"\\s<>'']*)?$'
  `);

  await pgm.db.query(`
      UPDATE establishments
      SET website = ''
      WHERE website IS NOT NULL
        AND website != ''
        AND (
          website ilike '%@%'
              OR website not ilike '%.%'
          )
  `);

  await pgm.db.query(`
      UPDATE establishments
      SET website = regexp_replace(website, 'https//:', 'https://')
      WHERE website IS NOT NULL
        AND website != ''
        AND website ilike 'https//:%'
  `);
}

export async function down(): Promise<void> {
  // nothing to do
}
