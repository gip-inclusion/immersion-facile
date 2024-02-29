import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create jointure table
  pgm.createTable("establishments__immersion_contacts", {
    establishment_siret: { type: "char(14)", notNull: true, primaryKey: true },
    contact_uuid: { type: "uuid", notNull: true, primaryKey: true },
  });
  pgm.addConstraint(
    "establishments__immersion_contacts",
    "fk_establishment_siret",
    {
      foreignKeys: {
        columns: "establishment_siret",
        references: "establishments(siret)",
        onDelete: "CASCADE", // If an establishment is deleted, will delete the rows referencing the siret
      },
    },
  );
  pgm.addConstraint("establishments__immersion_contacts", "fk_contact_uuid", {
    foreignKeys: {
      columns: "contact_uuid",
      references: "immersion_contacts(uuid)",
      onDelete: "CASCADE", // If a contact is deleted, will delete the rows referencing the contact_uuid
    },
  });
  // Migrate data from immersion_contacts table
  pgm.sql(`
    INSERT INTO establishments__immersion_contacts(establishment_siret, contact_uuid)
    SELECT siret_establishment, uuid from immersion_contacts;   
  `);
  // Drop ref column in immersion_contacts
  pgm.dropColumn("immersion_contacts", "siret_establishment");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Create column to immersion_contacts
  pgm.addColumn("immersion_contacts", {
    siret_establishment: { type: "char(14)", notNull: false },
  });
  // Migrate data from jointure table
  pgm.sql(`
    UPDATE immersion_contacts
    SET siret_establishment = establishments__immersion_contacts.establishment_siret FROM establishments__immersion_contacts
    WHERE immersion_contacts.uuid = establishments__immersion_contacts.contact_uuid
`);

  pgm.alterColumn("immersion_contacts", "siret_establishment", {
    notNull: true,
  });

  pgm.addConstraint("immersion_contacts", "fk_siret_establishment", {
    foreignKeys: {
      columns: "siret_establishment",
      references: "establishments(siret)",
    },
  });
  // Drop jointure table
  pgm.dropTable("establishments__immersion_contacts");
}
