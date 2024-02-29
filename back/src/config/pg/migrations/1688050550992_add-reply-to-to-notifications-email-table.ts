import { MigrationBuilder } from "node-pg-migrate";

const notificationEmailTable = "notifications_email";
const replyToEmailColumn = "reply_to_email";
const replyToNameColumn = "reply_to_name";
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(notificationEmailTable, {
    reply_to_name: { type: "text", notNull: false },
    reply_to_email: { type: "text", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(notificationEmailTable, [
    replyToEmailColumn,
    replyToNameColumn,
  ]);
}
