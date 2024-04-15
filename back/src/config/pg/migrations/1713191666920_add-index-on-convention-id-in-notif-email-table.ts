import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex("notifications_email", "convention_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("notifications_email", "convention_id");
}
