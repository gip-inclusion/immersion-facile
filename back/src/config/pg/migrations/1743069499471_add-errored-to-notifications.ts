import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("notifications_email", {
    errored: {
      type: "jsonb",
    },
  });
  pgm.addColumn("notifications_sms", {
    errored: {
      type: "jsonb",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("notifications_email", "errored");
  pgm.dropColumn("notifications_sms", "errored");
}
