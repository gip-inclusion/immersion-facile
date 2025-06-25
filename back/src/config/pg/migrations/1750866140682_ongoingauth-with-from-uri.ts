/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("users_ongoing_oauths", {
    from_uri: {
      type: "string",
      notNull: true,
      default: "/",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("users_ongoing_oauths", "from_uri");
}
