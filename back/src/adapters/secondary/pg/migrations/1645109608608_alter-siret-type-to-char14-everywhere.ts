import { MigrationBuilder } from "node-pg-migrate";

const newSiretOptions = {
  type: "char(14)",
};
export async function up(pgm: MigrationBuilder): Promise<void> {
  // Drop foreign keys
  pgm.dropConstraint("immersion_contacts", "fk_siret_establishment");
  pgm.dropConstraint("immersion_offers", "fk_siret");
  // Change siret type
  pgm.alterColumn("establishments", "siret", newSiretOptions);
  pgm.alterColumn("immersion_contacts", "siret_establishment", newSiretOptions);
  pgm.alterColumn("immersion_offers", "siret", newSiretOptions);
  // Re-create foreign keys
  pgm.addConstraint("immersion_contacts", "fk_siret_establishment", {
    foreignKeys: {
      columns: "siret_establishment",
      references: "establishments(siret)",
    },
  });
  pgm.addConstraint("immersion_offers", "fk_siret", {
    foreignKeys: {
      columns: "siret",
      references: "establishments(siret)",
      onDelete: "CASCADE", // If an establishment is deleted, will delete the offers referencing the siret
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop foreign keys
  pgm.dropConstraint("immersion_contacts", "fk_siret_establishment");
  pgm.dropConstraint("immersion_offers", "fk_siret");
  // Change siret type
  pgm.alterColumn("establishments", "siret", {
    type: "bigint",
    using: "siret::bigint",
  });
  pgm.alterColumn("immersion_contacts", "siret_establishment", {
    type: "bigint",
    using: "siret_establishment::bigint",
  });
  pgm.alterColumn("immersion_offers", "siret", {
    type: "bigint",
    using: "siret::bigint",
  });
  // Re-create foreign keys
  pgm.addConstraint("immersion_contacts", "fk_siret_establishment", {
    foreignKeys: {
      columns: "siret_establishment",
      references: "establishments(siret)",
    },
  });
  pgm.addConstraint("immersion_offers", "fk_siret", {
    foreignKeys: {
      columns: "siret",
      references: "establishments(siret)",
    },
  });
}
