/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const conventionTable = "conventions";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(conventionTable, {
    validators: {
      type: "jsonb",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(conventionTable, "validators");
}
