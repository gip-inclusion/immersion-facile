import { MigrationBuilder } from "node-pg-migrate";

const eventKinds = [
  "to-be-reminded",
  "reminder-sent",
  "registration-accepted",
  "registration-refused",
];

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addType("establishment_lead_events_kind", eventKinds);
  pgm.addType("notification_kind", ["email", "sms"]);

  pgm.createTable("establishment_lead_events", {
    siret: { type: "char(14)", notNull: true },
    kind: { type: "establishment_lead_events_kind", notNull: true },
    occurred_at: { type: "timestamptz", notNull: true },
    convention_id: { type: "uuid", notNull: true },
    notification_id: { type: "uuid", notNull: false },
    notification_kind: { type: "notification_kind", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("establishment_lead_events");
  pgm.dropType("notification_kind");
  pgm.dropType("establishment_lead_events_kind");
}
