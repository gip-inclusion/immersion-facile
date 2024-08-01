/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE feature_flags
    SET
      kind = 'textWithSeverity',
      is_active = false,
      value = '{"message": "", "severity": "warning"}'
    WHERE flag_name = 'enableMaintenance'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE feature_flags
    SET
      kind = 'text',
      is_active = false,
      value = '{"message": ""}'
    WHERE flag_name = 'enableMaintenance'
  `);
}
