/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint("immersion_offers", "fk_rome", {
    foreignKeys: {
      columns: "rome",
      references: "romes_public_data(code_rome)",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("immersion_offers", "fk_rome");
}
