import { MigrationBuilder } from "node-pg-migrate";
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("notifications_email_recipients", "notifications_email_id");
  pgm.createIndex("notifications_email_attachments", "notifications_email_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("notifications_email_recipients", "notifications_email_id");
  pgm.dropIndex("notifications_email_attachments", "notifications_email_id");
}
