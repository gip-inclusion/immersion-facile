/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("establishments", "additional_information", {
    type: "TEXT",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("establishments", "additional_information", {
    type: "character varying(255)",
  });
}
