import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("immersion_offers", "rome_appellation", "appellation_code");
  pgm.alterColumn("immersion_offers", "appellation_code", {
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_offers", "appellation_code", {
    notNull: false,
  });
  pgm.renameColumn("immersion_offers", "appellation_code", "rome_appellation");
}
