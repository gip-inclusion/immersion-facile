import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("immersion_applications", {
    immersion_appellation: { type: "integer" },
  });

  // Add foreign key on immersion_appellation to reference table public_appellations_data
  pgm.addConstraint("immersion_applications", "fk_immersion_appellation", {
    foreignKeys: {
      columns: "immersion_appellation",
      references: "public_appellations_data(ogr_appellation)",
    },
  });
  // Fill column immersion_appellation with values of public_appellations_data infered from immersion_profession
  await pgm.sql(`
    WITH appellation_by_application_id AS 
        (
        SELECT id, ogr_appellation
        FROM immersion_applications AS ia 
        LEFT JOIN public_appellations_data AS pad 
        ON pad.libelle_appellation_court = ia.immersion_profession
        )
    UPDATE immersion_applications
    SET immersion_appellation = ogr_appellation 
    FROM appellation_by_application_id
    WHERE appellation_by_application_id.id = immersion_applications.id
`);

  // Delete column immersion_profession
  pgm.dropColumn("immersion_applications", "immersion_profession");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("immersion_applications", {
    immersion_profession: { type: "varchar(255)" },
  });

  // Fill column immersion_profession with values of public_appellations_data infered from immersion_appellation
  await pgm.sql(`
    WITH appellation_libelle_by_application_id AS 
      (
      SELECT id, libelle_appellation_court
      FROM immersion_applications AS ia 
      LEFT JOIN public_appellations_data AS pad 
      ON pad.ogr_appellation = ia.immersion_appellation
      )
    UPDATE immersion_applications
    SET immersion_profession = libelle_appellation_court 
    FROM appellation_libelle_by_application_id
    WHERE appellation_libelle_by_application_id.id = immersion_applications.id
  `);

  pgm.dropColumn("immersion_applications", "immersion_appellation");
}
