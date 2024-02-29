/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add temporary id to table
  pgm.addColumns("immersion_offers", { id: { type: "serial" } });

  // Remove duplicated offers
  pgm.sql(`
  DELETE FROM
    immersion_offers a
    USING immersion_offers b
  WHERE
      a.id < b.id
      AND a.siret = b.siret 
      AND a.rome_code = b.rome_code
      AND a.rome_appellation = b.rome_appellation
    `);
  pgm.addConstraint("immersion_offers", "immersion_offers_unicity", {
    unique: ["siret", "rome_code", "rome_appellation"],
  });
  // Drop id column
  pgm.sql(`
    ALTER TABLE immersion_offers DROP COLUMN id`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("immersion_offers", "immersion_offers_unicity");
}
