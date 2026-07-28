import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("notifications_sms", "sms_kind", {
    ifNotExists: true,
    name: "notifications_sms_sms_kind_index",
  });
  pgm.createIndex("notifications_sms", "convention_id", {
    ifNotExists: true,
    name: "notifications_sms_convention_id_index",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("notifications_sms", "convention_id", {
    ifExists: true,
    name: "notifications_sms_convention_id_index",
  });
  pgm.dropIndex("notifications_sms", "sms_kind", {
    ifExists: true,
    name: "notifications_sms_sms_kind_index",
  });
}
