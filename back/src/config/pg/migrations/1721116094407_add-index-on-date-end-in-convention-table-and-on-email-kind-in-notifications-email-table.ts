import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex("notifications_email", "email_kind");
  pgm.addIndex("conventions", "date_end");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("notifications_email", "email_kind");
  pgm.dropIndex("conventions", "date_end");
}
