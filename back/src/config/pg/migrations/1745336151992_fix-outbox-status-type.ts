import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("outbox", "status", {
    type: "varchar(255)",
  });
  pgm.dropType("event_status");
  pgm.createType("event_status", [
    "never-published",
    "to-republish",
    "published",
    "failed-but-will-retry",
    "failed-to-many-times",
    "in-process",
  ]);
  pgm.alterColumn("outbox", "status", {
    type: "event_status",
    using: "status::event_status",
  });
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
