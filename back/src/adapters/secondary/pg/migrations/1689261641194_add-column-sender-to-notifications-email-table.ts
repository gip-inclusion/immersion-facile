import { MigrationBuilder } from "node-pg-migrate";

const notificationsEmailTable = "notifications_email";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(notificationsEmailTable, {
    sender_email: {
      type: "text",
      notNull: false,
    },
    sender_name: {
      type: "text",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(notificationsEmailTable, "sender_email");
  pgm.dropColumn(notificationsEmailTable, "sender_name");
}
