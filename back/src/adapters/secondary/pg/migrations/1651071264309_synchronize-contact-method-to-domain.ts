/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_contacts", "contact_mode", {
    type: "varchar(255)",
  });

  pgm.dropType("contact_mode");
  pgm.createType("contact_mode", ["PHONE", "EMAIL", "IN_PERSON"]);
  pgm.alterColumn("immersion_contacts", "contact_mode", {
    type: "contact_mode",
    using: "UPPER(REPLACE(contact_mode, 'mail', 'email'))::contact_mode",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_contacts", "contact_mode", {
    type: "varchar(255)",
  });
  pgm.dropType("contact_mode");
  pgm.createType("contact_mode", ["phone", "mail", "in_person"]);
  pgm.alterColumn("immersion_contacts", "contact_mode", {
    type: "contact_mode",
    using: "LOWER(REPLACE(contact_mode, 'email', 'mail'))::contact_mode",
  });
}
