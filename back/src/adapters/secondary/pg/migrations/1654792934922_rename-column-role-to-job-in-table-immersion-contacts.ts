import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("immersion_contacts", "role", "job");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("immersion_contacts", "job", "role");
}
