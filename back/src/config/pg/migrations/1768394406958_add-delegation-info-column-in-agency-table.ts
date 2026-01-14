/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("agencies", {
    delegation_info: { type: "jsonb", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("agencies", "delegation_info");
}
