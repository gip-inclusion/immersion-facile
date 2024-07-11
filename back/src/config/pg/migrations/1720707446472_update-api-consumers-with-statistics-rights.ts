import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`UPDATE api_consumers
    SET rights = jsonb_set(rights, '{statistics}', '{"kinds": [], "scope": "no-scope"}')
    WHERE NOT rights ? 'statistics';
  `);
}

export async function down(): Promise<void> {
  // nothing to do
}
