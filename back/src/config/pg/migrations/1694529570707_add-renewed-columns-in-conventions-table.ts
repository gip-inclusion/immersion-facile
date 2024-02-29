/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const tableName = "conventions";
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(tableName, {
    renewed_from: {
      type: "uuid",
      references: "conventions",
    },
    renewed_justification: { type: "text" },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(tableName, ["renewed_from", "renewed_justification"]);
}
