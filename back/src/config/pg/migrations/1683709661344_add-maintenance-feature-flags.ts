import { MigrationBuilder } from "node-pg-migrate";

const featureFlagTableName = "feature_flags";
const columnName = "flag_name";
const featureFlag = "enableMaintenance";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `INSERT INTO ${featureFlagTableName} (${columnName}, is_active) VALUES ('${featureFlag}', false);`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DELETE FROM ${featureFlagTableName} WHERE ${columnName} = '${featureFlag}';`);
}
