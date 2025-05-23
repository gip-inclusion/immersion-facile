/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE conventions
    SET status = 'READY_TO_SIGN'
    WHERE status = 'DRAFT'
  `);
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
