/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("immersion_contacts", {
    contact_mode: { type: "contact_mode", notNull: false },
  });

  // Migrates column `contact_mode` from table `establishments` to table `immersion_contacts` for all establishments where data_source=form
  // NB : we need to use 'COALESCE' since esatblishments.contact_mode is nullable (indeed, establishments may not have any contact),
  // It should not happened, but if an establishment with data_source=form had no contact_mode specified, it would be set to 'mail'.
  await pgm.sql(`
      WITH establishments_from_form AS 
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
