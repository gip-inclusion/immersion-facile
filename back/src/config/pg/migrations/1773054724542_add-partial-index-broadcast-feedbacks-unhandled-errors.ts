import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE INDEX idx_bf_unhandled_errors
    ON broadcast_feedbacks (((request_params ->> 'conventionId')::uuid), occurred_at DESC)
    WHERE subscriber_error_feedback IS NOT NULL;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql("DROP INDEX idx_bf_unhandled_errors;");
}
