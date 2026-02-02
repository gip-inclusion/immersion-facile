/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("notifications_email", {
    user_id: { type: "uuid", notNull: false },
  });
  pgm.addColumn("notifications_sms", {
    user_id: { type: "uuid", notNull: false },
  });
  pgm.createIndex("notifications_email", "user_id", {
    name: "notifications_email_user_id_index",
  });
  pgm.createIndex("notifications_sms", "user_id", {
    name: "notifications_sms_user_id_index",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("notifications_sms", "user_id", {
    name: "notifications_sms_user_id_index",
  });
  pgm.dropIndex("notifications_email", "user_id", {
    name: "notifications_email_user_id_index",
  });
  pgm.dropColumn("notifications_email", "user_id");
  pgm.dropColumn("notifications_sms", "user_id");
}
