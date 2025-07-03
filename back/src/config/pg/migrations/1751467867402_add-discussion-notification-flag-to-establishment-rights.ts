/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("establishments__users", {
    should_receive_discussion_notifications: {
      type: "boolean",
      notNull: true,
      default: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(
    "establishments__users",
    "should_receive_discussion_notifications",
  );
}
