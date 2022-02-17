/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_contacts", "email", { notNull: true });
  pgm.alterColumn("immersion_contacts", "lastname", { notNull: true });
  pgm.alterColumn("immersion_contacts", "firstname", { notNull: true });
  pgm.alterColumn("immersion_contacts", "role", { notNull: true });
  pgm.alterColumn("immersion_contacts", "siret_establishment", {
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_contacts", "email", { notNull: false });
  pgm.alterColumn("immersion_contacts", "lastname", { notNull: false });
  pgm.alterColumn("immersion_contacts", "firstname", { notNull: false });
  pgm.alterColumn("immersion_contacts", "role", { notNull: false });
  pgm.alterColumn("immersion_contacts", "siret_establishment", {
    notNull: false,
  });
}
