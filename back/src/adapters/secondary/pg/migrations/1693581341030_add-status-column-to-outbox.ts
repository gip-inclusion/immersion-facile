import { MigrationBuilder } from "node-pg-migrate";

const eventStatus = "event_status";
const outboxTable = "outbox";
const statusColumn = "status";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType(eventStatus, [
    "never-published",
    "to-republish",
    "published",
    "failed-but-will-retry",
    "failed-to-many-times",
  ]);

  pgm.addColumn(outboxTable, {
    status: {
      type: eventStatus,
      default: "published",
    },
  });

  pgm.sql(
    "UPDATE outbox SET status = 'failed-to-many-times' WHERE was_quarantined = true",
  );

  pgm.createIndex(outboxTable, "status");
  pgm.alterColumn(outboxTable, statusColumn, {
    default: null,
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(outboxTable, "status");
  pgm.dropType(eventStatus);
}
