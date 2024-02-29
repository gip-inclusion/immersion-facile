/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";
const conventionTable = "conventions";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(conventionTable, "postal_code");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(conventionTable, {
    postal_code: { type: "character(5)" },
  });
}
