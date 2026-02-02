/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("notifications_email", {
    user_id: { type: "uuid", notNull: false },
  });
  pgm.addColumn("notifications_sms", {
    user_id: { type: "uuid", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("notifications_email", "user_id");
  pgm.dropColumn("notifications_sms", "user_id");
}
