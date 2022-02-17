/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("immersion_offers", [
    "naf",
    "naf_division",
    "voluntary_to_immersion",
    "data_source",
    "contact_in_establishment_uuid",
    "gps",
    "name",

    "number_displays",
    "number_immersions",
    "number_connections",
  ]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("immersion_offers", {
    naf: { type: "character(5)", notNull: false },
    naf_division: { type: "character(2)", notNull: false },
    data_source: { type: "data_source" },
    voluntary_to_immersion: { type: "boolean", default: false },
    contact_in_establishment_uuid: { type: "uuid" },
    gps: { type: "geography" },
    name: { type: "varchar(255)" },

    number_displays: { type: "integer", default: 0 },
    number_connections: { type: "integer", default: 0 },
    number_immersions: { type: "integer", default: 0 },
  });
  pgm.addConstraint("immersion_offers", "fk_contact_in_establishment_uuid", {
    foreignKeys: {
      columns: "contact_in_establishment_uuid",
      references: "immersion_contacts(uuid)",
    },
  });
}
