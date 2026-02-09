import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("exchanges", "discussion_id", {
    name: "exchanges_discussion_id_index",
  });
  pgm.createIndex("exchanges", ["discussion_id", "sent_at"], {
    name: "exchanges_discussion_id_sent_at_index",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("exchanges", ["discussion_id", "sent_at"], {
    name: "exchanges_discussion_id_sent_at_index",
  });
  pgm.createIndex("exchanges", "discussion_id", {
    name: "exchanges_discussion_id_index",
  });
}
