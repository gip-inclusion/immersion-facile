import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE conventions SET status = 'ACCEPTED_BY_VALIDATOR'
    WHERE id IN (
        SELECT id
        FROM conventions
        WHERE status = 'VALIDATED'
        )`);
}

export async function down(): Promise<void> {
  // nothing to do
}
