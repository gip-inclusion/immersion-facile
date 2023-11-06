/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    INSERT INTO feature_flags(flag_name, is_active, kind) VALUES ('enableApiV0', true, 'boolean')
    ON CONFLICT DO NOTHING;
  `);
  pgm.sql(`
    INSERT INTO feature_flags(flag_name, is_active, kind) VALUES ('enableApiV1', true, 'boolean')
    ON CONFLICT DO NOTHING;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
  DELETE FROM feature_flags
  WHERE flag_name = 'enableApiV0' OR flag_name = 'enableApiV1';`);
}
