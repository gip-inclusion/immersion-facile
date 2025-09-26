/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

const tableName = "discussions";
const legacyColumnName = "potential_beneficiary_has_working_experience";
const deprecatedColumnName =
  "deprecated_potential_beneficiary_has_working_experience";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(tableName, legacyColumnName, deprecatedColumnName);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(tableName, deprecatedColumnName, legacyColumnName);
}
