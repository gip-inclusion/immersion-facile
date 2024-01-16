import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DELETE FROM feature_flags where flag_name not in ('enableTemporaryOperation', 'enableMaintenance');
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(
    `
    INSERT INTO feature_flags (flag_name, is_active) VALUES ('enableInseeApi', true);
    INSERT INTO feature_flags (flag_name, is_active) VALUES ('enableMaxContactPerWeek', true);
    INSERT INTO feature_flags (flag_name, is_active) VALUES ('enablePeConnectApi', true);
    INSERT INTO feature_flags (flag_name, is_active) VALUES ('enablePeConventionBroadcast', true);
    `,
  );
}
