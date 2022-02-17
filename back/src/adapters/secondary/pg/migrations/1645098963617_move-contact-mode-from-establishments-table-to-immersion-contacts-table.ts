/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("immersion_contacts", {
    contact_mode: { type: "contact_mode", notNull: false },
  });

  await pgm.sql(`
      with establishments_from_form as 
      (SELECT siret, contact_mode FROM establishments WHERE data_source = 'form')
      UPDATE immersion_contacts
      SET contact_mode = COALESCE(establishments_from_form.contact_mode, 'mail') FROM establishments_from_form
      WHERE immersion_contacts.siret_establishment = establishments_from_form.siret`);

  pgm.alterColumn("immersion_contacts", "contact_mode", { notNull: true });
  pgm.dropColumn("establishments", "contact_mode");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("establishments", {
    contact_mode: { type: "contact_mode" },
  });

  await pgm.sql(`
      UPDATE establishments
      SET contact_mode = immersion_contacts.contact_mode FROM immersion_contacts
      WHERE immersion_contacts.siret_establishment = establishments.siret`);

  pgm.dropColumn("immersion_contacts", "contact_mode");
}
