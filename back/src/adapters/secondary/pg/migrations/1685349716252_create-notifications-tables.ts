import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

const followedIds: ColumnDefinitions = {
  convention_id: { type: "uuid", notNull: false },
  establishment_siret: { type: "char(14)", notNull: false },
  agency_id: { type: "uuid", notNull: false },
};

const smsNotificationTable = "notifications_sms";
const emailNotificationTable = "notifications_email";
const emailRecipientsTable = "notifications_email_recipients";
const recipientType = "recipient_type";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(smsNotificationTable, {
    id: { type: "uuid", primaryKey: true },
    sms_kind: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true },
    recipient_phone: { type: "text", notNull: true },
    ...followedIds,
    params: { type: "jsonb", notNull: false },
  });

  pgm.createTable(emailNotificationTable, {
    id: { type: "uuid", primaryKey: true },
    email_kind: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true },
    ...followedIds,
    params: { type: "jsonb", notNull: false },
  });

  pgm.createType(recipientType, ["cc", "to"]);

  pgm.createTable(emailRecipientsTable, {
    notifications_email_id: {
      type: "uuid",
      references: { name: "notifications_email" },
      notNull: true,
    },
    email: { type: "text", notNull: true },
    recipient_type: { type: recipientType, notNull: true },
  });

  pgm.addConstraint(
    emailRecipientsTable,
    "notifications_email_recipients_unique",
    { unique: ["notifications_email_id", "email"] },
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(smsNotificationTable);
  pgm.dropTable(emailRecipientsTable);
  pgm.dropTable(emailNotificationTable);
  pgm.dropType(recipientType);
}
