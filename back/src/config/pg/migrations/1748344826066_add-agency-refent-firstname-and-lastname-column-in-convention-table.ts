/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("conventions", {
    agency_referent_first_name: {
      type: "varchar(255)",
      notNull: false,
      default: null,
    },
    agency_referent_last_name: {
      type: "varchar(255)",
      notNull: false,
      default: null,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("conventions", "agency_referent_first_name");
  pgm.dropColumn("conventions", "agency_referent_last_name");
}
