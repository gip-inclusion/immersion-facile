import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_applications", "immersion_appellation", {
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_applications", "immersion_appellation", {
    notNull: false,
  });
}
