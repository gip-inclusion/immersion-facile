import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("immersion_contacts", "name", "lastname");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("immersion_contacts", "lastname", "name");
}
