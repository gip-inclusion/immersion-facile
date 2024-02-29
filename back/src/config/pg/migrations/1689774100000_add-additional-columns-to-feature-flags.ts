/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const tableName = "feature_flags";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(tableName, {
    kind: {
      type: "text",
      notNull: true,
      default: "boolean",
    },
    value: {
      type: "jsonb",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(tableName, ["kind", "value"]);
}
