import { MigrationBuilder } from "node-pg-migrate";

const sentAtDiscussionIdUniqueConstraintName = "exchanges_discussion_id_unique";
const exchangeTable = "exchanges";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(exchangeTable, {
    id: {
      type: "serial",
      primaryKey: true,
      notNull: true,
    },
  });
  pgm.dropConstraint(exchangeTable, sentAtDiscussionIdUniqueConstraintName);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(exchangeTable, ["id"]);
  pgm.addConstraint(exchangeTable, sentAtDiscussionIdUniqueConstraintName, {
    unique: ["sent_at", "discussion_id"],
  });
}
