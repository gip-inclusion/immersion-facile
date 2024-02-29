import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex("notifications_email", "created_at");
  pgm.addIndex("notifications_sms", "created_at");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("notifications_email", "created_at");
  pgm.dropIndex("notifications_sms", "created_at");
}
