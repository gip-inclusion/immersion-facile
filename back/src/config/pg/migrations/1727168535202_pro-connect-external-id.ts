import { MigrationBuilder } from "node-pg-migrate";

const tableName = "users";
const legacyInclusionConnectExternalIdColumnName = "external_id";
const newInclusionConnectExternalIdColumnName = "inclusion_connect_sub";
const proConnectExternalIdColumnName = "pro_connect_sub";

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
