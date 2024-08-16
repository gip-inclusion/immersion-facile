/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const tableName = "users";
const legacyInclusionConnectExternalIdColumnName = "external_id";
const newInclusionConnectExternalIdColumnName = "external_id_inclusion_connect";
const proConnectExternalIdColumnName = "external_id_pro_connect";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(
    tableName,
    legacyInclusionConnectExternalIdColumnName,
    newInclusionConnectExternalIdColumnName,
  );
  pgm.addColumn(tableName, {
    [proConnectExternalIdColumnName]: {
      type: "text",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(tableName, proConnectExternalIdColumnName);
  pgm.renameColumn(
    tableName,
    newInclusionConnectExternalIdColumnName,
    legacyInclusionConnectExternalIdColumnName,
  );
}
