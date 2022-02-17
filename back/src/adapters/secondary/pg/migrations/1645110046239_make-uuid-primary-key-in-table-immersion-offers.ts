/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_offers", "uuid", { notNull: true });
  pgm.addConstraint("immersion_offers", "pk_uuid", { primaryKey: "uuid" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("immersion_offers", "pk_uuid");
  pgm.alterColumn("immersion_offers", "uuid", { notNull: false });
}
