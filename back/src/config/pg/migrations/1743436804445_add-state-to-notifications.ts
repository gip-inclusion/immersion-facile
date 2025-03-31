import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("notifications_email", {
    state: {
      type: "jsonb",
    },
  });
  pgm.addColumn("notifications_sms", {
    state: {
      type: "jsonb",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("notifications_email", "state");
  pgm.dropColumn("notifications_sms", "state");
}
