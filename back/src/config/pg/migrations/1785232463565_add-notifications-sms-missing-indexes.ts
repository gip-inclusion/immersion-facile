import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("notifications_sms", "sms_kind", {
    ifNotExists: true,
    name: "idx_notifications_sms_sms_kind",
  });
  pgm.createIndex("notifications_sms", "convention_id", {
    ifNotExists: true,
    name: "idx_notifications_sms_convention_id",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("notifications_sms", "convention_id", {
    ifExists: true,
    name: "idx_notifications_sms_convention_id",
  });
  pgm.dropIndex("notifications_sms", "sms_kind", {
    ifExists: true,
    name: "idx_notifications_sms_sms_kind",
  });
}
