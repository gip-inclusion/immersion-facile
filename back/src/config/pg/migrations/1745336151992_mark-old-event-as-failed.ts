import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  await pgm.db.query(`
    UPDATE outbox
    SET status = 'failed-to-many-times'
    WHERE status = 'in-process' AND occurred_at < NOW() - INTERVAL '1 day'
  `);
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
