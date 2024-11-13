import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  await pgm.db.query(`
      INSERT INTO feature_flags(flag_name, is_active, kind)
      VALUES ('enableBroadcastOfConseilDepartementalToFT', false, 'boolean'),
             ('enableBroadcastOfCapEmploiToFT', false, 'boolean'),
             ('enableBroadcastOfMissionLocaleToFT', false, 'boolean')
      ON CONFLICT DO NOTHING;
  `);
}

export async function down(): Promise<void> {
  // nothing to do
}
