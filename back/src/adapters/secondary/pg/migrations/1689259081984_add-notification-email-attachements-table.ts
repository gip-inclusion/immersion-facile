import { MigrationBuilder } from "node-pg-migrate";

const emailAttachmentsTable = "notifications_email_attachments";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(emailAttachmentsTable, {
    id: {
      type: "serial",
      primaryKey: true,
    },
    notifications_email_id: {
      type: "uuid",
      notNull: true,
      references: "notifications_email",
      onDelete: "CASCADE",
    },
    attachment: {
      type: "jsonb",
      notNull: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(emailAttachmentsTable);
}
