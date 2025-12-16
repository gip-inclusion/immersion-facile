/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DELETE FROM users__agencies
    WHERE roles = '[]'::jsonb;
  `);
}

export async function down(): Promise<void> {}
