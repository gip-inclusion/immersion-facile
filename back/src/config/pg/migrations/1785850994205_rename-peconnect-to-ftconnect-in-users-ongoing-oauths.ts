import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE users_ongoing_oauths
    SET provider = 'ftConnect'
    WHERE provider = 'peConnect';
  `);

  pgm.sql(`
    UPDATE convention_drafts
    SET signatories = jsonb_set(
      signatories,
      '{beneficiary,federatedIdentity,provider}',
      '"ftConnect"'
    )
    WHERE signatories -> 'beneficiary' -> 'federatedIdentity' ->> 'provider' = 'peConnect';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE users_ongoing_oauths
    SET provider = 'peConnect'
    WHERE provider = 'ftConnect';
  `);

  pgm.sql(`
    UPDATE convention_drafts
    SET signatories = jsonb_set(
      signatories,
      '{beneficiary,federatedIdentity,provider}',
      '"peConnect"'
    )
    WHERE signatories -> 'beneficiary' -> 'federatedIdentity' ->> 'provider' = 'ftConnect';
  `);
}
